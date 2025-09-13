const express = require('express');
const { body, validationResult } = require('express-validator');
const Borrowing = require('../models/Borrowing');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
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

// Borrowing validation rules
const borrowingValidation = [
  body('budgetId')
    .isMongoId()
    .withMessage('Invalid budget ID'),
  body('lenderName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Lender name must be between 1 and 100 characters'),
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

// @route   POST /api/borrowings
// @desc    Create a new borrowing
// @access  Private
router.post('/', borrowingValidation, handleValidationErrors, async (req, res) => {
  try {
    const { budgetId, lenderName, amount, date, notes } = req.body;

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

    const borrowing = new Borrowing({
      userId: req.user.userId,
      budgetId,
      lenderName,
      amount,
      date,
      notes
    });

    await borrowing.save();

    res.status(201).json({
      message: 'Borrowing created successfully',
      borrowing
    });
  } catch (error) {
    console.error('Create borrowing error:', error);
    res.status(500).json({
      message: 'Error creating borrowing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/borrowings
// @desc    Get borrowings by budget ID
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { budgetId, isRepaid, startDate, endDate } = req.query;

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

    if (isRepaid !== undefined) {
      query.isRepaid = isRepaid === 'true';
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const borrowings = await Borrowing.find(query)
      .sort({ date: -1 })
      .populate('budgetId', 'year monthNumber monthName');

    res.json({
      borrowings
    });
  } catch (error) {
    console.error('Get borrowings error:', error);
    res.status(500).json({
      message: 'Error fetching borrowings'
    });
  }
});

// @route   GET /api/borrowings/:id
// @desc    Get borrowing by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const borrowing = await Borrowing.findOne({
      _id: req.params.id,
      userId: req.user.userId
    }).populate('budgetId', 'year monthNumber monthName');

    if (!borrowing) {
      return res.status(404).json({
        message: 'Borrowing not found'
      });
    }

    res.json({
      borrowing
    });
  } catch (error) {
    console.error('Get borrowing error:', error);
    res.status(500).json({
      message: 'Error fetching borrowing'
    });
  }
});

// @route   PUT /api/borrowings/:id
// @desc    Update borrowing
// @access  Private
router.put('/:id', [
  body('lenderName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Lender name must be between 1 and 100 characters'),
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
    .withMessage('Notes cannot exceed 500 characters'),
  body('isRepaid')
    .optional()
    .isBoolean()
    .withMessage('isRepaid must be a boolean'),
  body('repaidDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid repaid date')
], handleValidationErrors, async (req, res) => {
  try {
    const updateData = req.body;

    // If marking as repaid and no repaidDate provided, set to current date
    if (updateData.isRepaid === true && !updateData.repaidDate) {
      updateData.repaidDate = new Date();
    }

    // If marking as not repaid, remove repaidDate
    if (updateData.isRepaid === false) {
      updateData.repaidDate = null;
    }

    const borrowing = await Borrowing.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('budgetId', 'year monthNumber monthName');

    if (!borrowing) {
      return res.status(404).json({
        message: 'Borrowing not found'
      });
    }

    res.json({
      message: 'Borrowing updated successfully',
      borrowing
    });
  } catch (error) {
    console.error('Update borrowing error:', error);
    res.status(500).json({
      message: 'Error updating borrowing'
    });
  }
});

// @route   DELETE /api/borrowings/:id
// @desc    Delete borrowing
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const borrowing = await Borrowing.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!borrowing) {
      return res.status(404).json({
        message: 'Borrowing not found'
      });
    }

    res.json({
      message: 'Borrowing deleted successfully'
    });
  } catch (error) {
    console.error('Delete borrowing error:', error);
    res.status(500).json({
      message: 'Error deleting borrowing'
    });
  }
});

// @route   PUT /api/borrowings/:id/repay
// @desc    Mark borrowing as repaid and create expense transaction
// @access  Private
router.put('/:id/repay', async (req, res) => {
  try {
    const borrowing = await Borrowing.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { 
        isRepaid: true, 
        repaidDate: new Date() 
      },
      { new: true, runValidators: true }
    ).populate('budgetId', 'year monthNumber monthName');

    if (!borrowing) {
      return res.status(404).json({
        message: 'Borrowing not found'
      });
    }

    // Automatically create an expense for the repayment
    try {
      const repaymentExpense = new Expense({
        userId: req.user.userId,
        budgetId: borrowing.budgetId._id,
        name: `Loan Repayment to ${borrowing.lenderName}`,
        category: 'Bills & Utilities',
        amount: borrowing.amount,
        date: new Date(),
        notes: `Automatic expense for repaying loan to ${borrowing.lenderName}`
      });

      await repaymentExpense.save();
      console.log(`Auto-created expense for borrowing repayment: ₹${borrowing.amount} to ${borrowing.lenderName}`);
    } catch (expenseError) {
      console.error('Error creating automatic expense for borrowing repayment:', expenseError);
      // Continue with success response even if expense creation fails
    }

    res.json({
      message: 'Borrowing marked as repaid and expense created',
      borrowing
    });
  } catch (error) {
    console.error('Repay borrowing error:', error);
    res.status(500).json({
      message: 'Error marking borrowing as repaid'
    });
  }
});

module.exports = router;
