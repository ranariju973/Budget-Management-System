const express = require('express');
const router = express.Router();
const Lending = require('../models/Lending');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');

// Create a new lending
router.post('/',
  auth,
  [
    body('budgetId').isMongoId().withMessage('Valid budget ID is required'),
    body('borrowerName').trim().notEmpty().withMessage('Borrower name is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('notes').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.array() 
        });
      }

      const { budgetId, borrowerName, amount, date, notes } = req.body;

      // Verify budget belongs to user
      const budget = await Budget.findOne({ _id: budgetId, userId: req.user.userId });
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }

      const lending = new Lending({
        userId: req.user.userId,
        budgetId,
        borrowerName,
        amount: parseFloat(amount),
        date: new Date(date),
        notes
      });

      await lending.save();

      // Automatically create an expense entry for the money lent out
      const lendingExpense = new Expense({
        userId: req.user.userId,
        budgetId,
        name: `Money lent to ${borrowerName}`,
        category: 'Other',
        amount: parseFloat(amount),
        date: new Date(date),
        notes: `Automatic expense for lending: ${notes || 'Money lent out'}`
      });

      await lendingExpense.save();

      res.status(201).json({ 
        message: 'Lending created successfully with automatic expense entry',
        lending,
        expense: lendingExpense
      });
    } catch (error) {
      console.error('Error creating lending:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get all lendings for a user
router.get('/', auth, async (req, res) => {
  try {
    const {
      budgetId,
      isRepaid,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = { userId: req.user.userId };

    if (budgetId) {
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

    // Execute query with pagination and sorting
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [lendings, total] = await Promise.all([
      Lending.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('budgetId', 'year monthNumber'),
      Lending.countDocuments(query)
    ]);

    res.json({
      lendings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching lendings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get lending by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const lending = await Lending.findOne({ 
      _id: req.params.id, 
      userId: req.user.userId 
    }).populate('budgetId', 'year monthNumber');

    if (!lending) {
      return res.status(404).json({ message: 'Lending not found' });
    }

    res.json({ lending });
  } catch (error) {
    console.error('Error fetching lending:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update lending
router.put('/:id',
  auth,
  [
    body('borrowerName').optional().trim().notEmpty().withMessage('Borrower name cannot be empty'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('date').optional().isISO8601().withMessage('Valid date is required'),
    body('notes').optional().trim(),
    body('isRepaid').optional().isBoolean(),
    body('repaidDate').optional().isISO8601().withMessage('Valid repaid date is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: errors.array() 
        });
      }

      const updateData = { ...req.body };
      
      // Convert date strings to Date objects if present
      if (updateData.date) updateData.date = new Date(updateData.date);
      if (updateData.repaidDate) updateData.repaidDate = new Date(updateData.repaidDate);
      if (updateData.amount) updateData.amount = parseFloat(updateData.amount);

      // Get the current lending to check if repayment status is changing
      const currentLending = await Lending.findOne({ _id: req.params.id, userId: req.user.userId });
      if (!currentLending) {
        return res.status(404).json({ message: 'Lending not found' });
      }

      // Handle repayment status changes
      if (updateData.hasOwnProperty('isRepaid') && updateData.isRepaid !== currentLending.isRepaid) {
        if (updateData.isRepaid === false && currentLending.isRepaid === true) {
          // Being marked as unpaid - remove the repayment income
          try {
            await Expense.findOneAndDelete({
              userId: req.user.userId,
              budgetId: currentLending.budgetId,
              name: `Loan Repayment from ${currentLending.borrowerName}`,
              amount: -currentLending.amount // Negative amount (income)
            });
            console.log(`Removed repayment income for ${currentLending.borrowerName}`);
          } catch (expenseError) {
            console.error('Error removing repayment income:', expenseError);
          }
          updateData.repaidDate = null;
        }
      }

      const lending = await Lending.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.userId },
        updateData,
        { new: true, runValidators: true }
      );

      res.json({ 
        message: 'Lending updated successfully',
        lending 
      });
    } catch (error) {
      console.error('Error updating lending:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Mark lending as repaid and create income transaction
router.put('/:id/repay', auth, async (req, res) => {
  try {
    const lending = await Lending.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { 
        isRepaid: true, 
        repaidDate: new Date() 
      },
      { new: true }
    ).populate('budgetId', 'year monthNumber monthName');

    if (!lending) {
      return res.status(404).json({ message: 'Lending not found' });
    }

    // Automatically create a "negative expense" (income) for the repayment
    try {
      const repaymentIncome = new Expense({
        userId: req.user.userId,
        budgetId: lending.budgetId._id,
        name: `Loan Repayment from ${lending.borrowerName}`,
        category: 'Other',
        amount: -lending.amount, // Negative amount to represent income
        date: new Date(),
        notes: `Automatic income for loan repayment from ${lending.borrowerName}`
      });

      await repaymentIncome.save();
      console.log(`Auto-created income for lending repayment: ₹${lending.amount} from ${lending.borrowerName}`);
    } catch (incomeError) {
      console.error('Error creating automatic income for lending repayment:', incomeError);
      // Continue with success response even if income creation fails
    }

    res.json({ 
      message: 'Lending marked as repaid and income recorded',
      lending 
    });
  } catch (error) {
    console.error('Error marking lending as repaid:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete lending
router.delete('/:id', auth, async (req, res) => {
  try {
    const lending = await Lending.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.userId 
    });

    if (!lending) {
      return res.status(404).json({ message: 'Lending not found' });
    }

    // Also delete the associated lending expense
    try {
      await Expense.findOneAndDelete({
        userId: req.user.userId,
        budgetId: lending.budgetId,
        name: `Money lent to ${lending.borrowerName}`,
        amount: lending.amount
      });
      console.log(`Deleted associated lending expense for ${lending.borrowerName}`);
    } catch (expenseError) {
      console.error('Error deleting associated lending expense:', expenseError);
      // Continue with success even if expense deletion fails
    }

    res.json({ message: 'Lending and associated expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting lending:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
