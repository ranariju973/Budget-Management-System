const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Borrowing = require('../models/Borrowing');
const Lending = require('../models/Lending');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Budget validation rules
const budgetValidation = [
  body('year')
    .isInt({ min: 2020, max: 2050 })
    .withMessage('Year must be between 2020 and 2050'),
  body('monthNumber')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  body('income')
    .isFloat({ min: 0 })
    .withMessage('Income must be a positive number')
];

// @route   POST /api/budgets
// @desc    Create a new budget
// @access  Private
router.post('/', budgetValidation, handleValidationErrors, async (req, res) => {
  try {
    const { year, monthNumber, income } = req.body;

    // Check if budget already exists for this month/year
    const existingBudget = await Budget.findOne({
      userId: req.user.userId,
      year,
      monthNumber
    });

    if (existingBudget) {
      return res.status(400).json({
        message: 'Budget already exists for this month and year'
      });
    }

    const budget = new Budget({
      userId: req.user.userId,
      year,
      monthNumber,
      income
    });

    await budget.save();

    res.status(201).json({
      message: 'Budget created successfully',
      budget
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({
      message: 'Error creating budget',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/budgets
// @desc    Get all budgets for user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.userId })
      .sort({ year: -1, monthNumber: -1 })
      .populate('expenses')
      .populate('borrowings')
      .populate('lendings');

    res.json({
      budgets
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      message: 'Error fetching budgets'
    });
  }
});

// @route   GET /api/budgets/:id
// @desc    Get budget by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user.userId
    }).populate('expenses').populate('borrowings').populate('lendings');

    if (!budget) {
      return res.status(404).json({
        message: 'Budget not found'
      });
    }

    res.json({
      budget
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({
      message: 'Error fetching budget'
    });
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update budget income
// @access  Private
router.put('/:id', [
  body('income').isFloat({ min: 0 }).withMessage('Income must be a positive number')
], handleValidationErrors, async (req, res) => {
  try {
    const { income } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { income },
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({
        message: 'Budget not found'
      });
    }

    res.json({
      message: 'Budget updated successfully',
      budget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({
      message: 'Error updating budget'
    });
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete budget and associated expenses/borrowings
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!budget) {
      return res.status(404).json({
        message: 'Budget not found'
      });
    }

    // Delete associated expenses and borrowings
    await Promise.all([
      Expense.deleteMany({ budgetId: req.params.id }),
      Borrowing.deleteMany({ budgetId: req.params.id }),
      Budget.findByIdAndDelete(req.params.id)
    ]);

    res.json({
      message: 'Budget and associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      message: 'Error deleting budget'
    });
  }
});

// @route   GET /api/budgets/:id/summary
// @desc    Get budget summary with expenses and borrowings totals
// @access  Private
router.get('/:id/summary', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!budget) {
      return res.status(404).json({
        message: 'Budget not found'
      });
    }

    // Get expenses, borrowings, and lendings
    const [expenses, borrowings, lendings] = await Promise.all([
      Expense.find({ budgetId: req.params.id }),
      Borrowing.find({ budgetId: req.params.id }),
      Lending.find({ budgetId: req.params.id })
    ]);

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    // Only count unpaid borrowings in the total
    const totalBorrowings = borrowings
      .filter(borrowing => !borrowing.isRepaid)
      .reduce((sum, borrowing) => sum + borrowing.amount, 0);
    // Only count unpaid lendings in the total
    const totalLendings = lendings
      .filter(lending => !lending.isRepaid)
      .reduce((sum, lending) => sum + lending.amount, 0);
    const remaining = budget.income - totalExpenses;

    // Group expenses by category
    const byCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    res.json({
      summary: {
        income: budget.income,
        totalExpenses,
        remaining,
        totalBorrowings,
        totalLendings,
        byCategory,
        expenseCount: expenses.length,
        borrowingCount: borrowings.length,
        lendingCount: lendings.length
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      message: 'Error fetching budget summary'
    });
  }
});

module.exports = router;
