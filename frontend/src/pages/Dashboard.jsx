import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { budgetService } from '../services';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/currency';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { useForm } from 'react-hook-form';

const Dashboard = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { showSuccess, showError } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchBudgets = useCallback(async () => {
    try {
      const response = await budgetService.getAll();
      setBudgets(response.budgets || []);
    } catch (err) {
      console.error('Failed to load budgets:', err);
      showError('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const onSubmit = async (data) => {
    setIsCreating(true);
    try {
      await budgetService.create({
        ...data,
        monthNumber: parseInt(data.monthNumber),
        year: parseInt(data.year),
        income: parseFloat(data.income)
      });
      showSuccess('Budget created successfully!');
      setShowAddModal(false);
      reset();
      fetchBudgets();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create budget';
      showError(message);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 lg:mb-8 space-y-3 sm:space-y-0">
        <div>
          <h1 className="heading-xl text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1 mobile-text-base">Manage your monthly budgets and track expenses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center justify-center sm:justify-start w-full sm:w-auto py-3 sm:py-2 px-4 mobile-text-lg sm:text-sm font-semibold rounded-xl sm:rounded-lg shadow-lg sm:shadow-md hover:shadow-xl transition-all duration-200"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Budget
        </button>
      </div>

      {/* Quick Stats */}
      {budgets.length > 0 && (
        <div className="mobile-grid-3 mb-4 sm:mb-6 lg:mb-8">
          <div className="stat-card">
            <div className="flex items-center">
              <CalendarIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary-600 flex-shrink-0" />
              <div className="ml-3 min-w-0">
                <p className="mobile-text-sm text-gray-600">Active Budgets</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{budgets.length}</p>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-600 flex-shrink-0" />
              <div className="ml-3 min-w-0">
                <p className="mobile-text-sm text-gray-600">Total Income</p>
                <p className="text-base sm:text-lg lg:text-2xl font-semibold text-gray-900 truncate">
                  {formatCurrency(budgets.reduce((sum, budget) => sum + budget.income, 0))}
                </p>
              </div>
            </div>
          </div>
          
          <div className="stat-card sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <ChartBarIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0" />
              <div className="ml-3 min-w-0">
                <p className="mobile-text-sm text-gray-600">Avg Monthly Income</p>
                <p className="text-base sm:text-lg lg:text-2xl font-semibold text-gray-900 truncate">
                  {formatCurrency(budgets.length > 0 ? Math.round(budgets.reduce((sum, budget) => sum + budget.income, 0) / budgets.length) : 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budgets Grid */}
      {budgets.length === 0 ? (
        <div className="card p-6 sm:p-8">
          <EmptyState
            icon={DocumentIcon}
            title="No budgets yet"
            description="Create your first monthly budget to start tracking your income and expenses"
            action={
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center justify-center w-full sm:w-auto px-6 py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Budget
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {budgets.map((budget) => (
            <Link
              key={budget._id}
              to={`/budget/${budget._id}`}
              className="card hover:shadow-lg active:scale-[0.98] transition-all duration-200 border-l-4 border-primary-500 p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center">
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 mr-2" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {months[budget.monthNumber - 1]} {budget.year}
                  </h3>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-gray-600">Income:</span>
                  <span className="font-medium text-green-600 text-sm sm:text-base">
                    {formatCurrency(budget.income)}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                  <span>Expenses:</span>
                  <span>{budget.expenses?.length || 0} items</span>
                </div>
                
                <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                  <span>Borrowings:</span>
                  <span>{budget.borrowings?.length || 0} items</span>
                </div>
              </div>
              
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Created {new Date(budget.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Budget Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          reset();
        }}
        title="Create New Budget"
        size="medium"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                {...register('monthNumber', { required: 'Month is required' })}
                className={`input-field ${errors.monthNumber ? 'border-red-300' : ''}`}
                defaultValue={new Date().getMonth() + 1}
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              {errors.monthNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.monthNumber.message}</p>
              )}
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                {...register('year', { required: 'Year is required' })}
                className={`input-field ${errors.year ? 'border-red-300' : ''}`}
                defaultValue={new Date().getFullYear()}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {errors.year && (
                <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
              )}
            </div>
          </div>

          {/* Income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Income
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₹
              </span>
              <input
                {...register('income', {
                  required: 'Income is required',
                  min: { value: 0, message: 'Income must be positive' }
                })}
                type="number"
                step="0.01"
                className={`input-field pl-8 ${errors.income ? 'border-red-300' : ''}`}
                placeholder="50000"
              />
            </div>
            {errors.income && (
              <p className="mt-1 text-sm text-red-600">{errors.income.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                reset();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isCreating ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Budget'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
