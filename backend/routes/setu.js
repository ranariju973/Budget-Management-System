const express = require('express');
const router = express.Router();
const setuService = require('../services/setuService');
const User = require('../models/User');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/setu/create-link
 * @desc    Create Setu authorization URL for bank connection
 * @access  Private
 */
router.get('/create-link', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const authUrl = setuService.generateAuthUrl(userId);
        
        res.json({ 
            success: true, 
            link_url: authUrl,
            message: 'Setu authorization URL generated successfully'
        });
    } catch (error) {
        console.error('Setu create link error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create Setu authorization link' 
        });
    }
});

/**
 * @route   GET /api/setu/callback
 * @desc    Handle Setu OAuth callback and exchange code for tokens
 * @access  Public (OAuth callback)
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error: authError } = req.query;
        
        // Check for authorization errors
        if (authError) {
            console.error('Setu authorization error:', authError);
            return res.redirect(`${process.env.FRONTEND_URL}/budget?error=authorization_failed`);
        }
        
        if (!code || !state) {
            return res.redirect(`${process.env.FRONTEND_URL}/budget?error=missing_parameters`);
        }
        
        // Extract userId from state
        const [userId] = state.split(':');
        if (!userId) {
            return res.redirect(`${process.env.FRONTEND_URL}/budget?error=invalid_state`);
        }
        
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/budget?error=user_not_found`);
        }
        
        // Validate state
        if (!setuService.validateState(state, userId)) {
            return res.redirect(`${process.env.FRONTEND_URL}/budget?error=invalid_state`);
        }
        
        // Exchange code for tokens
        const tokenData = await setuService.exchangeCodeForToken(code, state);
        
        // Update user with Setu tokens
        user.setuAccessToken = tokenData.access_token;
        user.setuRefreshToken = tokenData.refresh_token;
        user.setuTokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000));
        user.setuConnected = true;
        
        await user.save();
        
        console.log(`Setu account connected successfully for user: ${userId}`);
        
        // Redirect to frontend with success
        res.redirect(`${process.env.FRONTEND_URL}/budget?setu_connected=true`);
        
    } catch (error) {
        console.error('Setu callback error:', error.message);
        res.redirect(`${process.env.FRONTEND_URL}/budget?error=connection_failed`);
    }
});

/**
 * @route   GET /api/setu/accounts
 * @desc    Get user's connected bank accounts
 * @access  Private
 */
router.get('/accounts', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user.setuConnected || !user.setuAccessToken) {
            return res.status(400).json({ 
                success: false, 
                error: 'Setu account not connected' 
            });
        }
        
        // Check if token needs refresh
        if (user.setuTokenExpiry && new Date() >= user.setuTokenExpiry) {
            try {
                const refreshedTokens = await setuService.refreshAccessToken(user.setuRefreshToken);
                
                user.setuAccessToken = refreshedTokens.access_token;
                user.setuRefreshToken = refreshedTokens.refresh_token;
                user.setuTokenExpiry = new Date(Date.now() + (refreshedTokens.expires_in * 1000));
                
                await user.save();
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError.message);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Please reconnect your bank account' 
                });
            }
        }
        
        const accounts = await setuService.getAccounts(user.setuAccessToken);
        
        res.json({ 
            success: true, 
            accounts: accounts,
            message: 'Bank accounts fetched successfully'
        });
        
    } catch (error) {
        console.error('Setu get accounts error:', error.message);
        
        if (error.message === 'TOKEN_EXPIRED') {
            return res.status(401).json({ 
                success: false, 
                error: 'Please reconnect your bank account' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch bank accounts' 
        });
    }
});

/**
 * @route   GET /api/setu/transactions/:accountId
 * @desc    Get transactions for a specific account
 * @access  Private
 */
router.get('/transactions/:accountId', auth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { fromDate, toDate, limit = 100, offset = 0 } = req.query;
        
        const user = await User.findById(req.user.id);
        
        if (!user.setuConnected || !user.setuAccessToken) {
            return res.status(400).json({ 
                success: false, 
                error: 'Setu account not connected' 
            });
        }
        
        // Check if token needs refresh
        if (user.setuTokenExpiry && new Date() >= user.setuTokenExpiry) {
            try {
                const refreshedTokens = await setuService.refreshAccessToken(user.setuRefreshToken);
                
                user.setuAccessToken = refreshedTokens.access_token;
                user.setuRefreshToken = refreshedTokens.refresh_token;
                user.setuTokenExpiry = new Date(Date.now() + (refreshedTokens.expires_in * 1000));
                
                await user.save();
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError.message);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Please reconnect your bank account' 
                });
            }
        }
        
        const transactions = await setuService.getTransactions(
            user.setuAccessToken, 
            accountId, 
            fromDate, 
            toDate, 
            parseInt(limit), 
            parseInt(offset)
        );
        
        // Transform transactions to our format
        const transformedTransactions = transactions.map(transaction => 
            setuService.transformTransaction(transaction, accountId)
        );
        
        res.json({ 
            success: true, 
            transactions: transformedTransactions,
            count: transformedTransactions.length,
            message: 'Transactions fetched successfully'
        });
        
    } catch (error) {
        console.error('Setu get transactions error:', error.message);
        
        if (error.message === 'TOKEN_EXPIRED') {
            return res.status(401).json({ 
                success: false, 
                error: 'Please reconnect your bank account' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch transactions' 
        });
    }
});

/**
 * @route   POST /api/setu/import-transactions
 * @desc    Import transactions from Setu to expenses
 * @access  Private
 */
router.post('/import-transactions', auth, async (req, res) => {
    try {
        const { accountId, fromDate, toDate, selectedTransactions } = req.body;
        
        if (!accountId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Account ID is required' 
            });
        }
        
        const user = await User.findById(req.user.id);
        
        if (!user.setuConnected || !user.setuAccessToken) {
            return res.status(400).json({ 
                success: false, 
                error: 'Setu account not connected' 
            });
        }
        
        // Check if token needs refresh
        if (user.setuTokenExpiry && new Date() >= user.setuTokenExpiry) {
            try {
                const refreshedTokens = await setuService.refreshAccessToken(user.setuRefreshToken);
                
                user.setuAccessToken = refreshedTokens.access_token;
                user.setuRefreshToken = refreshedTokens.refresh_token;
                user.setuTokenExpiry = new Date(Date.now() + (refreshedTokens.expires_in * 1000));
                
                await user.save();
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError.message);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Please reconnect your bank account' 
                });
            }
        }
        
        // Fetch transactions from Setu
        const transactions = await setuService.getTransactions(
            user.setuAccessToken, 
            accountId, 
            fromDate, 
            toDate, 
            500 // Get more transactions for import
        );
        
        let importedCount = 0;
        let skippedCount = 0;
        const errors = [];
        
        for (const transaction of transactions) {
            try {
                // Skip if specific transactions selected and this isn't one
                if (selectedTransactions && selectedTransactions.length > 0) {
                    const transactionId = transaction.id || transaction.transaction_id;
                    if (!selectedTransactions.includes(transactionId)) {
                        continue;
                    }
                }
                
                // Transform transaction
                const transformedTransaction = setuService.transformTransaction(transaction, accountId);
                
                // Check if transaction already exists
                const existingExpense = await Expense.findOne({
                    user: req.user.id,
                    bankTransactionId: transformedTransaction.transaction_id,
                    source: 'setu'
                });
                
                if (existingExpense) {
                    skippedCount++;
                    continue;
                }
                
                // Create expense record
                const expense = new Expense({
                    user: req.user.id,
                    title: transformedTransaction.description,
                    amount: transformedTransaction.amount,
                    category: transformedTransaction.category,
                    type: transformedTransaction.type === 'debit' ? 'expense' : 'income',
                    date: new Date(transformedTransaction.date),
                    bankTransactionId: transformedTransaction.transaction_id,
                    bankAccountId: accountId,
                    merchantName: transformedTransaction.merchant_name,
                    source: 'setu',
                    metadata: {
                        reference_number: transformedTransaction.reference_number,
                        balance: transformedTransaction.balance,
                        original_description: transformedTransaction.description
                    }
                });
                
                await expense.save();
                importedCount++;
                
            } catch (transactionError) {
                console.error('Error importing transaction:', transactionError.message);
                errors.push({
                    transaction_id: transaction.id || transaction.transaction_id,
                    error: transactionError.message
                });
            }
        }
        
        res.json({ 
            success: true, 
            imported: importedCount,
            skipped: skippedCount,
            errors: errors.length,
            message: `Successfully imported ${importedCount} transactions, skipped ${skippedCount} duplicates`
        });
        
    } catch (error) {
        console.error('Setu import transactions error:', error.message);
        
        if (error.message === 'TOKEN_EXPIRED') {
            return res.status(401).json({ 
                success: false, 
                error: 'Please reconnect your bank account' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: 'Failed to import transactions' 
        });
    }
});

/**
 * @route   GET /api/setu/connection-status
 * @desc    Check Setu connection status
 * @access  Private
 */
router.get('/connection-status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        const status = {
            connected: user.setuConnected || false,
            hasTokens: !!(user.setuAccessToken && user.setuRefreshToken),
            tokenExpiry: user.setuTokenExpiry,
            needsReconnection: false
        };
        
        // Check if token is expired
        if (status.hasTokens && user.setuTokenExpiry && new Date() >= user.setuTokenExpiry) {
            status.needsReconnection = true;
        }
        
        res.json({ 
            success: true, 
            status: status,
            message: 'Connection status retrieved successfully'
        });
        
    } catch (error) {
        console.error('Setu connection status error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to check connection status' 
        });
    }
});

/**
 * @route   DELETE /api/setu/disconnect
 * @desc    Disconnect Setu account
 * @access  Private
 */
router.delete('/disconnect', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        // Clear Setu tokens and connection status
        user.setuAccessToken = null;
        user.setuRefreshToken = null;
        user.setuTokenExpiry = null;
        user.setuConnected = false;
        
        await user.save();
        
        res.json({ 
            success: true, 
            message: 'Setu account disconnected successfully' 
        });
        
    } catch (error) {
        console.error('Setu disconnect error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to disconnect Setu account' 
        });
    }
});

module.exports = router;