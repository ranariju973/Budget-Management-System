const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
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

// Expense validation rules
const expenseValidation = [
  body('budgetId')
    .isMongoId()
    .withMessage('Invalid budget ID'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Expense name must be between 1 and 100 characters'),
  body('category')
    .isIn([
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
    ])
    .withMessage('Please select a valid category'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('date')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post('/', expenseValidation, handleValidationErrors, async (req, res) => {
  try {
    const { budgetId, name, category, amount, date, notes } = req.body;

    // Verify budget belongs to user
    const budget = await Budget.findOne({
      _id: budgetId,
      userId: req.user.userId
    });

    if (!budget) {
      return res.status(404).json({
        message: 'Budget not found'
      });
    }

    const expense = new Expense({
      userId: req.user.userId,
      budgetId,
      name,
      category,
      amount,
      date,
      notes
    });

    await expense.save();

    res.status(201).json({
      message: 'Expense created successfully',
      expense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      message: 'Error creating expense',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/expenses
// @desc    Get expenses by budget ID
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { budgetId, category, startDate, endDate } = req.query;

    let query = { userId: req.user.userId };

    if (budgetId) {
      // Verify budget belongs to user
      const budget = await Budget.findOne({
        _id: budgetId,
        userId: req.user.userId
      });

      if (!budget) {
        return res.status(404).json({
          message: 'Budget not found'
        });
      }

      query.budgetId = budgetId;
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .populate('budgetId', 'year monthNumber monthName');

    res.json({
      expenses
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      message: 'Error fetching expenses'
    });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get expense by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.userId
    }).populate('budgetId', 'year monthNumber monthName');

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found'
      });
    }

    res.json({
      expense
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      message: 'Error fetching expense'
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Expense name must be between 1 and 100 characters'),
  body('category')
    .optional()
    .isIn([
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
    ])
    .withMessage('Please select a valid category'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    ).populate('budgetId', 'year monthNumber monthName');

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found'
      });
    }

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      message: 'Error updating expense'
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found'
      });
    }

    res.json({
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      message: 'Error deleting expense'
    });
  }
});

module.exports = router;
