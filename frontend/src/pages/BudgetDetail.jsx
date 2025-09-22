import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PlusIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ChartPieIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  HandRaisedIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { budgetService, expenseService, borrowingService, lendingService } from '../services';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/currency';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { useForm } from 'react-hook-form';
import useBreakpoint from '../hooks/useBreakpoint';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Personal Care',
  'Home & Garden',
  'Sports & Fitness',
  'Other'
];

const BudgetDetail = () => {
  const { isMobile } = useBreakpoint();
  const { id } = useParams();
  const [budget, setBudget] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [borrowings, setBorrowings] = useState([]);
  const [lendings, setLendings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showBorrowingModal, setShowBorrowingModal] = useState(false);
  const [showLendingModal, setShowLendingModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingBorrowing, setEditingBorrowing] = useState(null);
  const [editingLending, setEditingLending] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analyticsView, setAnalyticsView] = useState('daily'); // daily, weekly, monthly
  
  // Date navigation states
  const [currentExpenseDate, setCurrentExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentBorrowingDate, setCurrentBorrowingDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentLendingDate, setCurrentLendingDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { showSuccess, showError } = useToast();

  const {
    register: registerExpense,
    handleSubmit: handleExpenseForm,
    reset: resetExpenseForm,
    formState: { errors: expenseErrors }
  } = useForm();

  const {
    register: registerBorrowing,
    handleSubmit: handleBorrowingForm,
    reset: resetBorrowingForm,
    formState: { errors: borrowingErrors }
  } = useForm();

  const {
    register: registerLending,
    handleSubmit: handleLendingForm,
    reset: resetLendingForm,
    formState: { errors: lendingErrors }
  } = useForm();

  const fetchData = useCallback(async () => {
    try {
      const [budgetResponse, summaryResponse, expensesResponse, borrowingsResponse, lendingsResponse] = await Promise.all([
        budgetService.getById(id),
        budgetService.getSummary(id),
        expenseService.getAll({ budgetId: id }),
        borrowingService.getAll({ budgetId: id }),
        lendingService.getAll({ budgetId: id })
      ]);

      setBudget(budgetResponse.budget);
      setSummary(summaryResponse.summary);
      
      const expensesData = expensesResponse.expenses || [];
      const borrowingsData = borrowingsResponse.borrowings || [];
      const lendingsData = lendingsResponse.lendings || [];
      
      setExpenses(expensesData);
      setBorrowings(borrowingsData);
      setLendings(lendingsData);
      
      // Set initial dates to latest transaction dates for better UX
      if (expensesData.length > 0) {
        setCurrentExpenseDate(findLatestTransactionDate(expensesData));
      }
      if (borrowingsData.length > 0) {
        setCurrentBorrowingDate(findLatestTransactionDate(borrowingsData));
      }
      if (lendingsData.length > 0) {
        setCurrentLendingDate(findLatestTransactionDate(lendingsData));
      }
    } catch (err) {
      console.error('Failed to load budget data:', err);
      showError('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  }, [id, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExpenseSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const expenseData = {
        ...data,
        budgetId: id,
        amount: parseFloat(data.amount),
        date: new Date(data.date)
      };

      if (editingExpense) {
        await expenseService.update(editingExpense._id, expenseData);
        showSuccess('Expense updated successfully!');
      } else {
        await expenseService.create(expenseData);
        showSuccess('Expense added successfully!');
      }

      setShowExpenseModal(false);
      setEditingExpense(null);
      resetExpenseForm();
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save expense';
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBorrowingSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const borrowingData = {
        ...data,
        budgetId: id,
        amount: parseFloat(data.amount),
        date: new Date(data.date)
      };

      if (editingBorrowing) {
        await borrowingService.update(editingBorrowing._id, borrowingData);
        showSuccess('Borrowing updated successfully!');
      } else {
        await borrowingService.create(borrowingData);
        showSuccess('Borrowing added successfully!');
      }

      setShowBorrowingModal(false);
      setEditingBorrowing(null);
      resetBorrowingForm();
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save borrowing';
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLendingSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const lendingData = {
        ...data,
        budgetId: id,
        amount: parseFloat(data.amount),
        date: new Date(data.date)
      };

      if (editingLending) {
        await lendingService.update(editingLending._id, lendingData);
        showSuccess('Lending updated successfully!');
      } else {
        await lendingService.create(lendingData);
        showSuccess(`Lending added successfully! ₹${lendingData.amount.toLocaleString('en-IN')} expense automatically created.`);
      }

      setShowLendingModal(false);
      setEditingLending(null);
      resetLendingForm();
      fetchData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save lending';
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseService.delete(expenseId);
        showSuccess('Expense deleted successfully!');
        fetchData();
      } catch (err) {
        console.error('Failed to delete expense:', err);
        showError('Failed to delete expense');
      }
    }
  };

  const handleDeleteBorrowing = async (borrowingId) => {
    if (window.confirm('Are you sure you want to delete this borrowing?')) {
      try {
        await borrowingService.delete(borrowingId);
        showSuccess('Borrowing deleted successfully!');
        fetchData();
      } catch (err) {
        console.error('Failed to delete borrowing:', err);
        showError('Failed to delete borrowing');
      }
    }
  };

  const handleToggleRepaid = async (borrowing) => {
    try {
      if (borrowing.isRepaid) {
        await borrowingService.update(borrowing._id, { isRepaid: false, repaidDate: null });
        showSuccess('Marked as unpaid');
      } else {
        await borrowingService.markRepaid(borrowing._id);
        showSuccess(`Marked as repaid! ₹${borrowing.amount.toLocaleString('en-IN')} expense added.`);
      }
      fetchData();
    } catch (err) {
      console.error('Failed to update borrowing status:', err);
      showError('Failed to update borrowing status');
    }
  };

  const handleDeleteLending = async (lendingId) => {
    if (window.confirm('Are you sure you want to delete this lending? This will also remove the associated expense.')) {
      try {
        await lendingService.delete(lendingId);
        showSuccess('Lending and associated expense deleted successfully!');
        fetchData();
      } catch (err) {
        console.error('Failed to delete lending:', err);
        showError('Failed to delete lending');
      }
    }
  };

  const handleToggleLendingRepaid = async (lending) => {
    try {
      if (lending.isRepaid) {
        await lendingService.update(lending._id, { isRepaid: false, repaidDate: null });
        showSuccess('Marked as unpaid');
      } else {
        await lendingService.markRepaid(lending._id);
        showSuccess(`Marked as repaid! ₹${lending.amount.toLocaleString('en-IN')} income added to expenses.`);
      }
      fetchData();
    } catch (err) {
      console.error('Failed to update lending status:', err);
      showError('Failed to update lending status');
    }
  };

  const openEditExpenseModal = (expense) => {
    setEditingExpense(expense);
    resetExpenseForm({
      name: expense.name,
      category: expense.category,
      amount: expense.amount,
      date: expense.date.split('T')[0],
      notes: expense.notes || ''
    });
    setShowExpenseModal(true);
  };

  const openEditBorrowingModal = (borrowing) => {
    setEditingBorrowing(borrowing);
    resetBorrowingForm({
      lenderName: borrowing.lenderName,
      amount: borrowing.amount,
      date: borrowing.date.split('T')[0],
      notes: borrowing.notes || ''
    });
    setShowBorrowingModal(true);
  };

  const openEditLendingModal = (lending) => {
    setEditingLending(lending);
    resetLendingForm({
      borrowerName: lending.borrowerName,
      amount: lending.amount,
      date: lending.date.split('T')[0],
      notes: lending.notes || ''
    });
    setShowLendingModal(true);
  };

  const chartData = summary ? Object.entries(summary.byCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  })) : [];

  // Date navigation functions
  const findLatestTransactionDate = (items) => {
    if (items.length === 0) {
      return new Date().toISOString().split('T')[0];
    }
    
    const dates = items.map(item => new Date(item.date).toISOString().split('T')[0]);
    dates.sort((a, b) => new Date(b) - new Date(a)); // Sort descending (latest first)
    return dates[0];
  };

  const findLastAvailableDate = (items, startDate, direction = 'prev', maxDays = 365) => {
    if (items.length === 0) {
      return startDate; // No items available
    }
    
    const date = new Date(startDate);
    
    for (let i = 1; i <= maxDays; i++) {
      if (direction === 'prev') {
        date.setDate(date.getDate() - 1);
      } else {
        date.setDate(date.getDate() + 1);
      }
      
      const dateString = date.toISOString().split('T')[0];
      const itemsOnDate = filterByDate(items, dateString);
      
      if (itemsOnDate.length > 0) {
        return dateString;
      }
    }
    
    // If no transactions found, return the original date
    return startDate;
  };

  const navigateDate = (currentDate, setCurrentDate, direction) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    const newDate = date.toISOString().split('T')[0];
    
    // Determine which items to check based on the current section
    let itemsToCheck = [];
    let sectionName = '';
    if (setCurrentDate === setCurrentExpenseDate) {
      itemsToCheck = expenses;
      sectionName = 'expenses';
    } else if (setCurrentDate === setCurrentBorrowingDate) {
      itemsToCheck = borrowings;
      sectionName = 'borrowings';
    } else if (setCurrentDate === setCurrentLendingDate) {
      itemsToCheck = lendings;
      sectionName = 'lendings';
    }
    
    // Check if there are any items at all
    if (itemsToCheck.length === 0) {
      showError(`No ${sectionName} found. Add some ${sectionName} to use navigation.`);
      return;
    }
    
    // Check if the new date has any transactions
    const itemsOnNewDate = filterByDate(itemsToCheck, newDate);
    
    if (itemsOnNewDate.length > 0) {
      // Found transactions on the next/previous day
      setCurrentDate(newDate);
    } else {
      // No transactions on next/previous day, find the last available date
      const lastAvailableDate = findLastAvailableDate(itemsToCheck, newDate, direction);
      
      if (lastAvailableDate === newDate) {
        // No transactions found in this direction
        const directionText = direction === 'next' ? 'later' : 'earlier';
        showError(`No ${directionText} ${sectionName} found.`);
        return;
      }
      
      if (lastAvailableDate !== newDate) {
        // We jumped to a different date, show notification
        const jumpedDate = formatDateDisplay(lastAvailableDate);
        showSuccess(`Jumped to ${jumpedDate} - the last available day with ${sectionName}`);
      }
      
      setCurrentDate(lastAvailableDate);
    }
  };

  const filterByDate = (items, targetDate) => {
    return items.filter(item => {
      const itemDate = new Date(item.date).toISOString().split('T')[0];
      return itemDate === targetDate;
    });
  };

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    }
  };

  // Analytics data processing functions
  const processExpenseAnalytics = () => {
    if (!expenses || expenses.length === 0) return { daily: [], weekly: [], monthly: [] };
    
    // Filter only positive amount expenses (actual expenses, not lending income)
    const validExpenses = expenses.filter(expense => expense.amount > 0);

    // Daily expenses for last 30 days
    const dailyData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayExpenses = validExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const expenseDateStr = expenseDate.toISOString().split('T')[0];
        return expenseDateStr === dateStr;
      });
      
      const total = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      dailyData.push({
        date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        fullDate: dateStr,
        amount: total,
        count: dayExpenses.length
      });
    }

    // Weekly expenses for last 12 weeks
    const weeklyData = [];
    for (let i = 11; i >= 0; i--) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (i * 7) - startDate.getDay());
      startDate.setHours(0, 0, 0, 0); // Set to start of day
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999); // Set to end of day

      const weekExpenses = validExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });

      const total = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      weeklyData.push({
        week: `${startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
        amount: total,
        count: weekExpenses.length
      });
    }

    // Monthly expenses for last 12 months
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthExpenses = validExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const expenseMonthYear = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
        return expenseMonthYear === monthYear;
      });

      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      monthlyData.push({
        month: date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        amount: total,
        count: monthExpenses.length
      });
    }

    return { daily: dailyData, weekly: weeklyData, monthly: monthlyData };
  };

  const analyticsData = processExpenseAnalytics();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!budget || !summary) {
    return <div className="text-center text-gray-500">Budget not found</div>;
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link 
            to="/dashboard"
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {months[budget.monthNumber - 1]} {budget.year} Budget
            </h1>
            <p className="text-gray-600 mt-1">Track your monthly income, expenses, and borrowings</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="stat-card bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm text-green-600">Income</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(summary.income)}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-r from-red-50 to-pink-50 border-red-100">
          <div className="flex items-center">
            <BanknotesIcon className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm text-red-600">Expenses</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-100">
          <div className="flex items-center">
            <ChartPieIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm text-blue-600">Remaining</p>
              <p className={`text-2xl font-bold ${summary.remaining >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {formatCurrency(summary.remaining)}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-100">
          <div className="flex items-center">
            <BanknotesIcon className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm text-yellow-600">Borrowings</p>
              <p className="text-2xl font-bold text-yellow-700">
                {formatCurrency(summary.totalBorrowings)}
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
          <div className="flex items-center">
            <HandRaisedIcon className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm text-purple-600">Money Lent</p>
              <p className="text-2xl font-bold text-purple-700">
                {formatCurrency(summary.totalLendings || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Expenses Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                <button
                  onClick={() => navigateDate(currentExpenseDate, setCurrentExpenseDate, 'prev')}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Previous day with expenses (auto-skips empty days)"
                >
                  <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
                  {formatDateDisplay(currentExpenseDate)}
                </span>
                <button
                  onClick={() => navigateDate(currentExpenseDate, setCurrentExpenseDate, 'next')}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Next day with expenses (auto-skips empty days)"
                >
                  <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingExpense(null);
                resetExpenseForm({
                  date: new Date().toISOString().split('T')[0]
                });
                setShowExpenseModal(true);
              }}
              className="btn-primary flex items-center text-sm"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Expense
            </button>
          </div>

          <div className="card">
            {(() => {
              const filteredExpenses = filterByDate(expenses, currentExpenseDate);
              return filteredExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <BanknotesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses for {formatDateDisplay(currentExpenseDate)}</h3>
                  <p className="text-gray-500 mb-4">Use the arrows to navigate to other days or add an expense for this day</p>
                  <button
                    onClick={() => {
                      setEditingExpense(null);
                      resetExpenseForm({
                        date: currentExpenseDate
                      });
                      setShowExpenseModal(true);
                    }}
                    className="btn-primary flex items-center mx-auto"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Expense for {formatDateDisplay(currentExpenseDate)}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredExpenses.map((expense) => {
                  // Check if this is a lending repayment income (negative amount)
                  const isLendingRepayment = expense.amount < 0 && expense.name.includes('Loan Repayment from');
                  // Check if this is a lending expense (positive amount for money lent out)
                  const isLendingExpense = expense.amount > 0 && expense.name.includes('Money lent to');
                  const displayAmount = isLendingRepayment ? Math.abs(expense.amount) : expense.amount;
                  
                  return (
                    <div key={expense._id} className={`flex items-center justify-between p-4 border rounded-lg hover:shadow-sm ${
                      isLendingRepayment 
                        ? 'border-green-100 bg-green-50' 
                        : isLendingExpense 
                        ? 'border-orange-100 bg-orange-50'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{expense.name}</h4>
                          <span className={`text-lg font-semibold ${
                            isLendingRepayment ? 'text-green-600' : isLendingExpense ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {isLendingRepayment ? '+' : ''}{formatCurrency(displayAmount)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            isLendingRepayment 
                              ? 'bg-green-100 text-green-700' 
                              : isLendingExpense
                              ? 'bg-orange-100 text-orange-700'
                              : 'text-gray-500'
                          }`}>
                            {isLendingRepayment ? 'Income from Lending' : isLendingExpense ? 'Money Lent Out' : expense.category}
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(expense.date).toLocaleDateString()}
                          </span>
                        </div>
                        {expense.notes && (
                          <p className="text-sm text-gray-600 mt-1">{expense.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => openEditExpenseModal(expense)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          </div>

          {/* Borrowings Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900">Borrowings</h2>
                <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                  <button
                    onClick={() => navigateDate(currentBorrowingDate, setCurrentBorrowingDate, 'prev')}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Previous day with borrowings (auto-skips empty days)"
                  >
                    <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
                    {formatDateDisplay(currentBorrowingDate)}
                  </span>
                  <button
                    onClick={() => navigateDate(currentBorrowingDate, setCurrentBorrowingDate, 'next')}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Next day with borrowings (auto-skips empty days)"
                  >
                    <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingBorrowing(null);
                  resetBorrowingForm({
                    date: new Date().toISOString().split('T')[0]
                  });
                  setShowBorrowingModal(true);
                }}
                className="btn-primary flex items-center text-sm"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Borrowing
              </button>
            </div>

            <div className="card">
              {(() => {
                const filteredBorrowings = filterByDate(borrowings, currentBorrowingDate);
                return filteredBorrowings.length === 0 ? (
                  <div className="text-center py-8">
                    <BanknotesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No borrowings for {formatDateDisplay(currentBorrowingDate)}</h3>
                    <p className="text-gray-500 mb-4">Use the arrows to navigate to other days or add a borrowing for this day</p>
                    <button
                      onClick={() => {
                        setEditingBorrowing(null);
                        resetBorrowingForm({
                          date: currentBorrowingDate
                        });
                        setShowBorrowingModal(true);
                      }}
                      className="btn-primary flex items-center mx-auto"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Borrowing for {formatDateDisplay(currentBorrowingDate)}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBorrowings.map((borrowing) => (
                    <div key={borrowing._id} className={`flex items-center justify-between p-4 border rounded-lg ${borrowing.isRepaid ? 'border-green-200 bg-green-50' : 'border-gray-100'} hover:shadow-sm`}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{borrowing.lenderName}</h4>
                          <span className={`text-lg font-semibold ${borrowing.isRepaid ? 'text-green-600 line-through' : 'text-yellow-600'}`}>
                            {formatCurrency(borrowing.amount)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`text-sm px-2 py-1 rounded-full ${borrowing.isRepaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {borrowing.isRepaid ? 'Repaid' : 'Pending'}
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(borrowing.date).toLocaleDateString()}
                          </span>
                        </div>
                        {borrowing.notes && (
                          <p className="text-sm text-gray-600 mt-1">{borrowing.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleToggleRepaid(borrowing)}
                          className={`p-2 rounded-lg ${borrowing.isRepaid ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                          title={borrowing.isRepaid ? 'Mark as unpaid' : 'Mark as repaid'}
                        >
                          {borrowing.isRepaid ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditBorrowingModal(borrowing)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBorrowing(borrowing._id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            </div>
          </div>

          {/* Lendings Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900">Money Lent Out</h2>
                <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                  <button
                    onClick={() => navigateDate(currentLendingDate, setCurrentLendingDate, 'prev')}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Previous day with lendings (auto-skips empty days)"
                  >
                    <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
                    {formatDateDisplay(currentLendingDate)}
                  </span>
                  <button
                    onClick={() => navigateDate(currentLendingDate, setCurrentLendingDate, 'next')}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Next day with lendings (auto-skips empty days)"
                  >
                    <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingLending(null);
                  resetLendingForm({
                    date: new Date().toISOString().split('T')[0]
                  });
                  setShowLendingModal(true);
                }}
                className="btn-primary flex items-center text-sm"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Lending
              </button>
            </div>

            <div className="card">
              {(() => {
                const filteredLendings = filterByDate(lendings, currentLendingDate);
                return filteredLendings.length === 0 ? (
                  <div className="text-center py-8">
                    <HandRaisedIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No lendings for {formatDateDisplay(currentLendingDate)}</h3>
                    <p className="text-gray-500 mb-4">Use the arrows to navigate to other days or add a lending for this day</p>
                    <button
                      onClick={() => {
                        setEditingLending(null);
                        resetLendingForm({
                          date: currentLendingDate
                        });
                        setShowLendingModal(true);
                      }}
                      className="btn-primary flex items-center mx-auto"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Lending for {formatDateDisplay(currentLendingDate)}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredLendings.map((lending) => (
                    <div key={lending._id} className={`flex items-center justify-between p-4 border rounded-lg ${lending.isRepaid ? 'border-green-200 bg-green-50' : 'border-gray-100'} hover:shadow-sm`}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{lending.borrowerName}</h4>
                          <span className={`text-lg font-semibold ${lending.isRepaid ? 'text-green-600 line-through' : 'text-purple-600'}`}>
                            {formatCurrency(lending.amount)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`text-sm px-2 py-1 rounded-full ${lending.isRepaid ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                            {lending.isRepaid ? 'Repaid' : 'Pending'}
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(lending.date).toLocaleDateString()}
                          </span>
                        </div>
                        {lending.notes && (
                          <p className="text-sm text-gray-600 mt-1">{lending.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleToggleLendingRepaid(lending)}
                          className={`p-2 rounded-lg ${lending.isRepaid ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                          title={lending.isRepaid ? 'Mark as unpaid' : 'Mark as repaid'}
                        >
                          {lending.isRepaid ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditLendingModal(lending)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLending(lending._id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="lg:col-span-1">
          <h2 className="heading-md text-gray-900 mb-4 sm:mb-6">Expense Breakdown</h2>
          <div className="card">
            {chartData.length === 0 ? (
              <EmptyState
                icon={ChartPieIcon}
                title="No data to display"
                description="Add some expenses to see the breakdown"
              />
            ) : (
              <>
                <div className="h-48 sm:h-56 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={isMobile ? 30 : 40}
                        outerRadius={isMobile ? 60 : 80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                        contentStyle={{
                          fontSize: isMobile ? '12px' : '14px',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2">
                  {chartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between py-1">
                      <div className="flex items-center">
                        <div 
                          className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="mobile-text-sm text-gray-600 truncate pr-2">{entry.name}</span>
                      </div>
                      <span className="mobile-text-sm font-medium text-right">
                        {formatCurrency(entry.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expense Analytics Section */}
      <div className="mt-6 sm:mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h2 className="heading-lg text-gray-900">Expense Analytics</h2>
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
            <button
              onClick={() => setAnalyticsView('daily')}
              className={`px-3 py-2 rounded-lg mobile-text-sm font-medium transition-colors whitespace-nowrap ${
                analyticsView === 'daily'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setAnalyticsView('weekly')}
              className={`px-3 py-2 rounded-lg mobile-text-sm font-medium transition-colors whitespace-nowrap ${
                analyticsView === 'weekly'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setAnalyticsView('monthly')}
              className={`px-3 py-2 rounded-lg mobile-text-sm font-medium transition-colors whitespace-nowrap ${
                analyticsView === 'monthly'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="mobile-grid-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Trend Chart */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
              <h3 className="heading-md text-gray-900">
                {analyticsView === 'daily' ? 'Daily' : analyticsView === 'weekly' ? 'Weekly' : 'Monthly'} Expense Trends
              </h3>
              <span className="mobile-text-sm text-gray-500">
                {analyticsView === 'daily' ? 'Last 30 days' : analyticsView === 'weekly' ? 'Last 12 weeks' : 'Last 12 months'}
              </span>
            </div>
            
            <div className="h-64 sm:h-72 lg:h-80 chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={analyticsData[analyticsView]} 
                  margin={{ 
                    top: 5, 
                    right: isMobile ? 10 : 30, 
                    left: isMobile ? 10 : 20, 
                    bottom: isMobile ? 20 : 5 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey={analyticsView === 'daily' ? 'date' : analyticsView === 'weekly' ? 'week' : 'month'}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : analyticsView === 'weekly' ? -45 : 0}
                    textAnchor={isMobile || analyticsView === 'weekly' ? 'end' : 'middle'}
                    height={isMobile || analyticsView === 'weekly' ? 60 : 30}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tickFormatter={(value) => isMobile ? `₹${(value/1000).toFixed(0)}k` : `₹${value.toLocaleString('en-IN')}`}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    width={isMobile ? 50 : 80}
                  />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                    labelFormatter={(label) => analyticsView === 'daily' ? `Date: ${label}` : analyticsView === 'weekly' ? `Week: ${label}` : `Month: ${label}`}
                    contentStyle={{
                      fontSize: isMobile ? '12px' : '14px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#3b82f6" 
                    strokeWidth={isMobile ? 1.5 : 2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: isMobile ? 3 : 4 }}
                    activeDot={{ r: isMobile ? 4 : 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
              <h3 className="heading-md text-gray-900">
                {analyticsView === 'daily' ? 'Daily' : analyticsView === 'weekly' ? 'Weekly' : 'Monthly'} Expense Volume
              </h3>
              <span className="mobile-text-sm text-gray-500">
                Amount & Transaction Count
              </span>
            </div>
            
            <div className="h-64 sm:h-72 lg:h-80 chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={analyticsData[analyticsView]} 
                  margin={{ 
                    top: 5, 
                    right: isMobile ? 10 : 30, 
                    left: isMobile ? 10 : 20, 
                    bottom: isMobile ? 20 : 5 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey={analyticsView === 'daily' ? 'date' : analyticsView === 'weekly' ? 'week' : 'month'}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : analyticsView === 'weekly' ? -45 : 0}
                    textAnchor={isMobile || analyticsView === 'weekly' ? 'end' : 'middle'}
                    height={isMobile || analyticsView === 'weekly' ? 60 : 30}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    yAxisId="amount"
                    orientation="left"
                    tickFormatter={(value) => isMobile ? `₹${(value/1000).toFixed(0)}k` : `₹${value.toLocaleString('en-IN')}`}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    width={isMobile ? 50 : 80}
                  />
                  <YAxis 
                    yAxisId="count"
                    orientation="right"
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    width={isMobile ? 30 : 50}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'amount' ? `₹${value.toLocaleString('en-IN')}` : `${value} transactions`,
                      name === 'amount' ? 'Total Amount' : 'Transaction Count'
                    ]}
                    labelFormatter={(label) => analyticsView === 'daily' ? `Date: ${label}` : analyticsView === 'weekly' ? `Week: ${label}` : `Month: ${label}`}
                    contentStyle={{
                      fontSize: isMobile ? '12px' : '14px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
                  <Bar yAxisId="amount" dataKey="amount" fill="#3b82f6" name="amount" />
                  <Bar yAxisId="count" dataKey="count" fill="#10b981" name="count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mobile-grid-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8">
          <div className="stat-card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <div className="text-center">
              <p className="mobile-text-sm text-blue-600 mb-1">
                {analyticsView === 'daily' ? 'Daily' : analyticsView === 'weekly' ? 'Weekly' : 'Monthly'} Average
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-700">
                {formatCurrency(
                  analyticsData[analyticsView].length > 0
                    ? analyticsData[analyticsView].reduce((sum, item) => sum + item.amount, 0) / analyticsData[analyticsView].length
                    : 0
                )}
              </p>
            </div>
          </div>
          
          <div className="stat-card bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
            <div className="text-center">
              <p className="mobile-text-sm text-green-600 mb-1">Highest {analyticsView.charAt(0).toUpperCase() + analyticsView.slice(1)}</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-700">
                {formatCurrency(
                  analyticsData[analyticsView].length > 0
                    ? Math.max(...analyticsData[analyticsView].map(item => item.amount))
                    : 0
                )}
              </p>
            </div>
          </div>
          
          <div className="stat-card bg-gradient-to-r from-orange-50 to-red-50 border-orange-100">
            <div className="text-center">
              <p className="text-sm text-orange-600 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-orange-700">
                {analyticsData[analyticsView].reduce((sum, item) => sum + item.count, 0)}
              </p>
            </div>
          </div>
          
          <div className="stat-card bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
            <div className="text-center">
              <p className="text-sm text-purple-600 mb-1">Active Days</p>
              <p className="text-2xl font-bold text-purple-700">
                {analyticsData[analyticsView].filter(item => item.amount > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
          resetExpenseForm();
        }}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        size="medium"
      >
        <form onSubmit={handleExpenseForm(handleExpenseSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expense Name
            </label>
            <input
              {...registerExpense('name', { required: 'Expense name is required' })}
              type="text"
              className={`input-field ${expenseErrors.name ? 'border-red-300' : ''}`}
              placeholder="e.g., Grocery shopping"
            />
            {expenseErrors.name && (
              <p className="mt-1 text-sm text-red-600">{expenseErrors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                {...registerExpense('category', { required: 'Category is required' })}
                className={`input-field ${expenseErrors.category ? 'border-red-300' : ''}`}
              >
                <option value="">Select category</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {expenseErrors.category && (
                <p className="mt-1 text-sm text-red-600">{expenseErrors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  {...registerExpense('amount', {
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.01"
                  className={`input-field pl-8 ${expenseErrors.amount ? 'border-red-300' : ''}`}
                  placeholder="1000"
                />
              </div>
              {expenseErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{expenseErrors.amount.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              {...registerExpense('date', { required: 'Date is required' })}
              type="date"
              className={`input-field ${expenseErrors.date ? 'border-red-300' : ''}`}
            />
            {expenseErrors.date && (
              <p className="mt-1 text-sm text-red-600">{expenseErrors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              {...registerExpense('notes')}
              rows={3}
              className="input-field resize-none"
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowExpenseModal(false);
                setEditingExpense(null);
                resetExpenseForm();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  {editingExpense ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingExpense ? 'Update Expense' : 'Add Expense'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Borrowing Modal */}
      <Modal
        isOpen={showBorrowingModal}
        onClose={() => {
          setShowBorrowingModal(false);
          setEditingBorrowing(null);
          resetBorrowingForm();
        }}
        title={editingBorrowing ? 'Edit Borrowing' : 'Add Borrowing'}
        size="medium"
      >
        <form onSubmit={handleBorrowingForm(handleBorrowingSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lender Name
            </label>
            <input
              {...registerBorrowing('lenderName', { required: 'Lender name is required' })}
              type="text"
              className={`input-field ${borrowingErrors.lenderName ? 'border-red-300' : ''}`}
              placeholder="e.g., John Doe or Credit Card"
            />
            {borrowingErrors.lenderName && (
              <p className="mt-1 text-sm text-red-600">{borrowingErrors.lenderName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  {...registerBorrowing('amount', {
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.01"
                  className={`input-field pl-8 ${borrowingErrors.amount ? 'border-red-300' : ''}`}
                  placeholder="5000"
                />
              </div>
              {borrowingErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{borrowingErrors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                {...registerBorrowing('date', { required: 'Date is required' })}
                type="date"
                className={`input-field ${borrowingErrors.date ? 'border-red-300' : ''}`}
              />
              {borrowingErrors.date && (
                <p className="mt-1 text-sm text-red-600">{borrowingErrors.date.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              {...registerBorrowing('notes')}
              rows={3}
              className="input-field resize-none"
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowBorrowingModal(false);
                setEditingBorrowing(null);
                resetBorrowingForm();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  {editingBorrowing ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingBorrowing ? 'Update Borrowing' : 'Add Borrowing'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Lending Modal */}
      <Modal
        isOpen={showLendingModal}
        onClose={() => {
          setShowLendingModal(false);
          setEditingLending(null);
          resetLendingForm();
        }}
        title={editingLending ? 'Edit Lending' : 'Add Lending'}
        size="medium"
      >
        <form onSubmit={handleLendingForm(handleLendingSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Borrower Name
            </label>
            <input
              {...registerLending('borrowerName', { required: 'Borrower name is required' })}
              type="text"
              className={`input-field ${lendingErrors.borrowerName ? 'border-red-300' : ''}`}
              placeholder="e.g., Rahul Sharma or Friend's Name"
            />
            {lendingErrors.borrowerName && (
              <p className="mt-1 text-sm text-red-600">{lendingErrors.borrowerName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  {...registerLending('amount', {
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.01"
                  className={`input-field pl-8 ${lendingErrors.amount ? 'border-red-300' : ''}`}
                  placeholder="5000"
                />
              </div>
              {lendingErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{lendingErrors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                {...registerLending('date', { required: 'Date is required' })}
                type="date"
                className={`input-field ${lendingErrors.date ? 'border-red-300' : ''}`}
              />
              {lendingErrors.date && (
                <p className="mt-1 text-sm text-red-600">{lendingErrors.date.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              {...registerLending('notes')}
              rows={3}
              className="input-field resize-none"
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowLendingModal(false);
                setEditingLending(null);
                resetLendingForm();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  {editingLending ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingLending ? 'Update Lending' : 'Add Lending'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BudgetDetail;
