const axios = require('axios');
const crypto = require('crypto');
const { encrypt, decrypt } = require('../utils/crypto');

class SetuService {
    constructor() {
        this.clientId = process.env.SETU_CLIENT_ID;
        this.clientSecret = process.env.SETU_CLIENT_SECRET;
        this.authUrl = process.env.SETU_AUTH_URL;
        this.tokenUrl = process.env.SETU_TOKEN_URL;
        this.apiBase = process.env.SETU_API_BASE;
        this.redirectUri = process.env.SETU_REDIRECT_URI;
    }

    /**
     * Generate authorization URL for Setu OAuth2 flow
     */
    generateAuthUrl(userId) {
        const state = crypto.randomBytes(32).toString('hex');
        const nonce = crypto.randomBytes(32).toString('hex');
        
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            scope: 'account:read transaction:read',
            redirect_uri: this.redirectUri,
            state: `${userId}:${state}:${nonce}`,
            access_type: 'offline'
        });

        return `${this.authUrl}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code, state) {
        try {
            const tokenData = {
                grant_type: 'authorization_code',
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: code,
                redirect_uri: this.redirectUri
            };

            const response = await axios.post(this.tokenUrl, tokenData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            });

            const tokens = response.data;
            
            // Encrypt tokens before storage
            const encryptedAccessToken = encrypt(tokens.access_token);
            const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

            return {
                access_token: encryptedAccessToken,
                refresh_token: encryptedRefreshToken,
                expires_in: tokens.expires_in,
                token_type: tokens.token_type,
                scope: tokens.scope
            };
        } catch (error) {
            console.error('Setu token exchange error:', error.response?.data || error.message);
            throw new Error('Failed to exchange authorization code for tokens');
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(encryptedRefreshToken) {
        try {
            const refreshToken = decrypt(encryptedRefreshToken);
            
            const tokenData = {
                grant_type: 'refresh_token',
                client_id: this.clientId,
                client_secret: this.clientSecret,
                refresh_token: refreshToken
            };

            const response = await axios.post(this.tokenUrl, tokenData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            });

            const tokens = response.data;
            
            // Encrypt new tokens
            const encryptedAccessToken = encrypt(tokens.access_token);
            const encryptedNewRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : encryptedRefreshToken;

            return {
                access_token: encryptedAccessToken,
                refresh_token: encryptedNewRefreshToken,
                expires_in: tokens.expires_in,
                token_type: tokens.token_type
            };
        } catch (error) {
            console.error('Setu token refresh error:', error.response?.data || error.message);
            throw new Error('Failed to refresh access token');
        }
    }

    /**
     * Get authenticated API client
     */
    async getAuthenticatedClient(encryptedAccessToken) {
        const accessToken = decrypt(encryptedAccessToken);
        
        return axios.create({
            baseURL: this.apiBase,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    /**
     * Fetch user's bank accounts
     */
    async getAccounts(encryptedAccessToken) {
        try {
            const client = await this.getAuthenticatedClient(encryptedAccessToken);
            const response = await client.get('/v1/accounts');
            
            return response.data.data || [];
        } catch (error) {
            console.error('Setu get accounts error:', error.response?.data || error.message);
            
            // If token expired, throw specific error
            if (error.response?.status === 401) {
                throw new Error('TOKEN_EXPIRED');
            }
            
            throw new Error('Failed to fetch accounts');
        }
    }

    /**
     * Fetch transactions for a specific account
     */
    async getTransactions(encryptedAccessToken, accountId, fromDate, toDate, limit = 100, offset = 0) {
        try {
            const client = await this.getAuthenticatedClient(encryptedAccessToken);
            
            const params = new URLSearchParams({
                account_id: accountId,
                limit: limit.toString(),
                offset: offset.toString()
            });

            if (fromDate) {
                params.append('from_date', fromDate);
            }
            
            if (toDate) {
                params.append('to_date', toDate);
            }

            const response = await client.get(`/v1/transactions?${params.toString()}`);
            
            return response.data.data || [];
        } catch (error) {
            console.error('Setu get transactions error:', error.response?.data || error.message);
            
            // If token expired, throw specific error
            if (error.response?.status === 401) {
                throw new Error('TOKEN_EXPIRED');
            }
            
            throw new Error('Failed to fetch transactions');
        }
    }

    /**
     * Get account balance
     */
    async getAccountBalance(encryptedAccessToken, accountId) {
        try {
            const client = await this.getAuthenticatedClient(encryptedAccessToken);
            const response = await client.get(`/v1/accounts/${accountId}/balance`);
            
            return response.data.data;
        } catch (error) {
            console.error('Setu get balance error:', error.response?.data || error.message);
            
            if (error.response?.status === 401) {
                throw new Error('TOKEN_EXPIRED');
            }
            
            throw new Error('Failed to fetch account balance');
        }
    }

    /**
     * Transform Setu transaction to our format
     */
    transformTransaction(setuTransaction, accountId) {
        return {
            account_id: accountId,
            transaction_id: setuTransaction.id || setuTransaction.transaction_id,
            amount: Math.abs(setuTransaction.amount || 0),
            type: (setuTransaction.amount || 0) >= 0 ? 'credit' : 'debit',
            description: setuTransaction.description || setuTransaction.narration || 'Unknown transaction',
            date: setuTransaction.transaction_date || setuTransaction.date,
            category: this.categorizeTransaction(setuTransaction.description || setuTransaction.narration || ''),
            merchant_name: setuTransaction.merchant_name || null,
            reference_number: setuTransaction.reference_number || setuTransaction.utr || null,
            balance: setuTransaction.balance || null,
            source: 'setu'
        };
    }

    /**
     * Simple transaction categorization
     */
    categorizeTransaction(description) {
        const desc = description.toLowerCase();
        
        if (desc.includes('food') || desc.includes('restaurant') || desc.includes('zomato') || desc.includes('swiggy')) {
            return 'Food & Dining';
        }
        if (desc.includes('fuel') || desc.includes('petrol') || desc.includes('diesel') || desc.includes('gas')) {
            return 'Transportation';
        }
        if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('mart')) {
            return 'Groceries';
        }
        if (desc.includes('atm') || desc.includes('cash withdrawal')) {
            return 'Cash & ATM';
        }
        if (desc.includes('transfer') || desc.includes('upi') || desc.includes('imps') || desc.includes('neft')) {
            return 'Transfer';
        }
        if (desc.includes('salary') || desc.includes('income')) {
            return 'Income';
        }
        if (desc.includes('rent')) {
            return 'Housing';
        }
        if (desc.includes('medical') || desc.includes('hospital') || desc.includes('pharmacy')) {
            return 'Healthcare';
        }
        if (desc.includes('shopping') || desc.includes('amazon') || desc.includes('flipkart')) {
            return 'Shopping';
        }
        if (desc.includes('entertainment') || desc.includes('movie') || desc.includes('netflix')) {
            return 'Entertainment';
        }
        
        return 'Other';
    }

    /**
     * Validate state parameter from OAuth callback
     */
    validateState(state, expectedUserId) {
        try {
            const [userId, stateToken, nonce] = state.split(':');
            return userId === expectedUserId && stateToken && nonce;
        } catch (error) {
            return false;
        }
    }
}

module.exports = new SetuService();