import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, BanknotesIcon, ArrowDownTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from './ui/LoadingSpinner';

const ImportTransactionsModal = ({ isOpen, onClose, budgetId, onImported }) => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [filterDays, setFilterDays] = useState(30);
  const { showSuccess, showError } = useToast();

  const fetchAccounts = useCallback(async () => {
    try {
      const response = await api.get('/plaid/accounts');
      setAccounts(response.data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      showError('Failed to fetch account information');
    }
  }, [showError]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/plaid/transactions?days=${filterDays}`);
      setTransactions(response.data.transactions || []);
      // Pre-select all transactions
      setSelectedTransactions(new Set(response.data.transactions.map(t => t.transaction_id)));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showError(error.response?.data?.error || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [filterDays, showError]);

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
      fetchAccounts();
    }
  }, [isOpen, fetchTransactions, fetchAccounts]);

  const handleTransactionToggle = (transactionId) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.transaction_id)));
    }
  };

  const handleImport = async () => {
    if (selectedTransactions.size === 0) {
      showError('Please select at least one transaction to import');
      return;
    }

    setImporting(true);
    try {
      const transactionsToImport = transactions.filter(t => 
        selectedTransactions.has(t.transaction_id)
      );

      const response = await api.post('/plaid/import', {
        budgetId,
        transactions: transactionsToImport
      });

      showSuccess(`Successfully imported ${response.data.imported} transactions`);
      
      if (response.data.skipped > 0) {
        showError(`${response.data.skipped} transactions were skipped (already imported)`);
      }

      if (onImported) {
        onImported(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error('Error importing transactions:', error);
      showError(error.response?.data?.error || 'Failed to import transactions');
    } finally {
      setImporting(false);
    }
  };

  const getCategoryColor = (categories) => {
    if (!categories || categories.length === 0) return 'bg-gray-100 text-gray-700';
    
    const colorMap = {
      'Food and Drink': 'bg-orange-100 text-orange-700',
      'Transportation': 'bg-blue-100 text-blue-700',
      'Shops': 'bg-purple-100 text-purple-700',
      'Recreation': 'bg-green-100 text-green-700',
      'Service': 'bg-red-100 text-red-700',
      'Healthcare': 'bg-pink-100 text-pink-700',
      'Travel': 'bg-indigo-100 text-indigo-700',
    };
    
    return colorMap[categories[0]] || 'bg-gray-100 text-gray-700';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <BanknotesIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Import Bank Transactions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Account Info */}
        {accounts.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Connected Accounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {accounts.map(account => (
                <div key={account.account_id} className="bg-white p-3 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-500">{account.subtype}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(account.balances.current)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Available: {formatCurrency(account.balances.available || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Show transactions from last:
              </label>
              <select
                value={filterDays}
                onChange={(e) => setFilterDays(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedTransactions.size === transactions.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-gray-500">
                {selectedTransactions.size} of {transactions.length} selected
              </span>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner size="large" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <BanknotesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found for the selected period</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {transactions.map(transaction => (
                <div
                  key={transaction.transaction_id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedTransactions.has(transaction.transaction_id)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTransactionToggle(transaction.transaction_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.has(transaction.transaction_id)}
                        onChange={() => handleTransactionToggle(transaction.transaction_id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {transaction.name || transaction.merchant_name || 'Unknown Transaction'}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-500">{transaction.date}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(transaction.category)}`}>
                            {transaction.category?.[0] || 'Other'}
                          </span>
                          {transaction.pending && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        -{formatCurrency(Math.abs(transaction.amount))}
                      </p>
                      <p className="text-xs text-gray-500">{transaction.payment_channel}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedTransactions.size > 0 && (
              <span>
                Total to import: {formatCurrency(
                  transactions
                    .filter(t => selectedTransactions.has(t.transaction_id))
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                )}
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedTransactions.size === 0 || importing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? (
                <>
                  <LoadingSpinner size="small" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Import {selectedTransactions.size} Transactions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportTransactionsModal;