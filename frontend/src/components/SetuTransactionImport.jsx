import React, { useState, useEffect } from 'react';
import { 
  ArrowDownTrayIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  BuildingOfficeIcon 
} from '@heroicons/react/24/outline';

const SetuTransactionImport = ({ onImportSuccess, onError }) => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    toDate: new Date().toISOString().split('T')[0] // today
  });

  useEffect(() => {
    const loadAccountsOnMount = async () => {
      setIsLoadingAccounts(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/setu/accounts', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success) {
          setAccounts(data.accounts || []);
        } else {
          throw new Error(data.error || 'Failed to load accounts');
        }
      } catch (error) {
        console.error('Error loading Setu accounts:', error);
        onError && onError(`Failed to load bank accounts: ${error.message}`);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    loadAccountsOnMount();
  }, [onError]);

  const loadTransactions = async () => {
    if (!selectedAccount) return;

    setIsLoadingTransactions(true);
    setTransactions([]);
    setSelectedTransactions([]);

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        fromDate: dateRange.fromDate,
        toDate: dateRange.toDate,
        limit: '200'
      });

      const response = await fetch(
        `http://localhost:5001/api/setu/transactions/${selectedAccount}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions || []);
        // Pre-select all transactions
        setSelectedTransactions((data.transactions || []).map(t => t.transaction_id));
      } else {
        throw new Error(data.error || 'Failed to load transactions');
      }
    } catch (error) {
      console.error('Error loading Setu transactions:', error);
      onError && onError(`Failed to load transactions: ${error.message}`);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleImportTransactions = async () => {
    if (!selectedAccount || selectedTransactions.length === 0) {
      onError && onError('Please select an account and at least one transaction to import');
      return;
    }

    setIsImporting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/setu/import-transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId: selectedAccount,
          fromDate: dateRange.fromDate,
          toDate: dateRange.toDate,
          selectedTransactions: selectedTransactions
        })
      });

      const data = await response.json();

      if (data.success) {
        onImportSuccess && onImportSuccess({
          imported: data.imported,
          skipped: data.skipped,
          errors: data.errors
        });
        
        // Reset selection after successful import
        setSelectedTransactions([]);
      } else {
        throw new Error(data.error || 'Failed to import transactions');
      }
    } catch (error) {
      console.error('Error importing Setu transactions:', error);
      onError && onError(`Failed to import transactions: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const toggleTransactionSelection = (transactionId) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t.transaction_id));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Food & Dining': 'bg-orange-100 text-orange-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Groceries': 'bg-green-100 text-green-800',
      'Shopping': 'bg-purple-100 text-purple-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Healthcare': 'bg-red-100 text-red-800',
      'Income': 'bg-emerald-100 text-emerald-800',
      'Transfer': 'bg-gray-100 text-gray-800',
      'Cash & ATM': 'bg-yellow-100 text-yellow-800',
      'Housing': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-slate-100 text-slate-800'
    };
    return colors[category] || colors['Other'];
  };

  if (isLoadingAccounts) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading bank accounts...</span>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <ExclamationCircleIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No bank accounts connected</p>
          <p className="text-sm text-gray-500">Connect your Indian bank account first to import transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Selection */}
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <BuildingOfficeIcon className="w-5 h-5 mr-2 text-blue-600" />
          Import from Indian Bank Account
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Bank Account
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose an account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name || account.mask || account.id} - {account.subtype || 'Savings'}
                  {account.balances?.current && ` (${formatCurrency(account.balances.current)})`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.fromDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.toDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <button
          onClick={loadTransactions}
          disabled={!selectedAccount || isLoadingTransactions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {isLoadingTransactions ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Loading Transactions...
            </>
          ) : (
            <>
              <CalendarIcon className="w-4 h-4 mr-2" />
              Load Transactions
            </>
          )}
        </button>
      </div>

      {/* Transaction List */}
      {transactions.length > 0 && (
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Available Transactions ({transactions.length})
            </h4>
            
            <div className="flex items-center space-x-3">
              <label className="flex items-center text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                  onChange={toggleSelectAll}
                  className="mr-2 rounded"
                />
                Select All
              </label>
              
              <button
                onClick={handleImportTransactions}
                disabled={selectedTransactions.length === 0 || isImporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Import Selected ({selectedTransactions.length})
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.transaction_id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTransactions.includes(transaction.transaction_id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleTransactionSelection(transaction.transaction_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.transaction_id)}
                      onChange={() => toggleTransactionSelection(transaction.transaction_id)}
                      className="rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-800 truncate max-w-xs">
                          {transaction.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(transaction.category)}`}>
                            {transaction.category}
                          </span>
                          <span className={`font-semibold ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {formatDate(transaction.date)}
                        {transaction.reference_number && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Ref: {transaction.reference_number}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedAccount && !isLoadingTransactions && transactions.length === 0 && (
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <CurrencyDollarIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No transactions found</p>
            <p className="text-sm text-gray-500">
              Try adjusting the date range or check if there are transactions in the selected account
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetuTransactionImport;