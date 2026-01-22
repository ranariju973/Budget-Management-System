const express = require('express');
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');
const verifyToken = require('../middleware/firebaseAuth');

const router = express.Router();
const db = admin.firestore();

// Apply auth middleware
router.use(verifyToken);

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

const expenseValidation = [
  body('budgetId').notEmpty().withMessage('Budget ID is required'), // Firestore IDs are strings
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('category').isIn([
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities',
    'Healthcare', 'Education', 'Travel', 'Personal Care', 'Home & Garden', 'Sports & Fitness', 'Other'
  ]),
  body('amount').isFloat({ min: 0.01 }),
  body('date').isISO8601().toDate(),
  body('notes').optional().trim().isLength({ max: 500 })
];

// @route   POST /api/expenses
router.post('/', expenseValidation, handleValidationErrors, async (req, res) => {
  try {
    const { budgetId, name, category, amount, date, notes } = req.body;
    const userId = req.user.uid;

    // Verify budget
    const budgetDoc = await db.collection('budgets').doc(budgetId).get();
    if (!budgetDoc.exists || budgetDoc.data().userId !== userId) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const newExpense = {
      userId,
      budgetId,
      name,
      category,
      amount,
      date: admin.firestore.Timestamp.fromDate(new Date(date)),
      notes,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('expenses').add(newExpense);
    const savedExpense = (await docRef.get()).data();
    
    // Map timestamp back to date for response
    if (savedExpense.date) savedExpense.date = savedExpense.date.toDate();

    res.status(201).json({
      message: 'Expense created successfully',
      expense: { id: docRef.id, ...savedExpense }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Error creating expense' });
  }
});

// @route   GET /api/expenses
router.get('/', async (req, res) => {
  try {
    const { budgetId, category, startDate, endDate } = req.query;
    const userId = req.user.uid;

    let query = db.collection('expenses').where('userId', '==', userId);

    if (budgetId) {
      // Check budget ownership if budgetId is provided
      const budgetDoc = await db.collection('budgets').doc(budgetId).get();
      if (!budgetDoc.exists || budgetDoc.data().userId !== userId) {
         return res.status(404).json({ message: 'Budget not found' });
      }
      query = query.where('budgetId', '==', budgetId);
    }

    if (category) {
      query = query.where('category', '==', category);
    }
    
    // Note: Firestore requires composite indexes for multiple field queries + range queries
    // We will apply remaining filters in memory if index not creating, or try to apply them
    // Sorting by date descending
    
    const snapshot = await query.get();
    let expenses = [];
    
    snapshot.forEach(doc => {
        const data = doc.data();
        // Convert timestamp
        expenses.push({ 
            id: doc.id, 
            ...data, 
            date: data.date ? data.date.toDate() : null 
        });
    });

    // InMemory filtering for date range if needed (simplifies indexing requirements for now)
    if (startDate) {
        const start = new Date(startDate);
        expenses = expenses.filter(e => e.date >= start);
    }
    if (endDate) {
        const end = new Date(endDate);
        expenses = expenses.filter(e => e.date <= end);
    }

    // Sort in memory
    expenses.sort((a, b) => b.date - a.date);

    // Populate budget info manually (if needed by frontend)
    // Minimizing reads: Fetch needed distinct budgets
    const budgetIds = [...new Set(expenses.map(e => e.budgetId))];
    const budgetMap = {};
    if (budgetIds.length > 0) {
        const budgetRefs = budgetIds.map(id => db.collection('budgets').doc(id));
        // Firestore getAll can fetch multiple
        const budgetSnapshots = await db.getAll(...budgetRefs);
        budgetSnapshots.forEach(doc => {
            if (doc.exists) budgetMap[doc.id] = doc.data();
        });
    }

    expenses = expenses.map(e => ({
        ...e,
        budgetId: budgetMap[e.budgetId] ? { 
            _id: e.budgetId, // maintain mongo compatibility if frontend needs it
            id: e.budgetId, 
            year: budgetMap[e.budgetId].year,
            monthNumber: budgetMap[e.budgetId].monthNumber,
            // monthName virtual? we can compute it if needed or let frontend handle it
        } : e.budgetId
    }));

    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Error fetching expenses' });
  }
});

// @route   GET /api/expenses/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('expenses').doc(req.params.id).get();

    if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const data = doc.data();
    if(data.date) data.date = data.date.toDate();

    // Populate budget
    const budgetDoc = await db.collection('budgets').doc(data.budgetId).get();
    let budgetData = data.budgetId;
    if (budgetDoc.exists) {
        const b = budgetDoc.data();
        budgetData = { id: budgetDoc.id, year: b.year, monthNumber: b.monthNumber };
    }

    res.json({ expense: { id: doc.id, ...data, budgetId: budgetData } });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Error fetching expense' });
  }
});

// @route   PUT /api/expenses/:id
router.put('/:id', [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('date').optional().isISO8601().toDate(),
    body('notes').optional().trim().isLength({ max: 500 })
], handleValidationErrors, async (req, res) => {
  try {
    const docRef = db.collection('expenses').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const updates = { ...req.body };
    if (updates.date) updates.date = admin.firestore.Timestamp.fromDate(new Date(updates.date));
    
    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    const data = updatedDoc.data();
    if(data.date) data.date = data.date.toDate();

    // Populate budget
    const budgetDoc = await db.collection('budgets').doc(data.budgetId).get();
    let budgetData = data.budgetId;
    if (budgetDoc.exists) {
        const b = budgetDoc.data();
        budgetData = { id: budgetDoc.id, year: b.year, monthNumber: b.monthNumber };
    }

    res.json({ message: 'Expense updated successfully', expense: { id: updatedDoc.id, ...data, budgetId: budgetData } });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Error updating expense' });
  }
});

// @route   DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const docRef = db.collection('expenses').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await docRef.delete();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Error deleting expense' });
  }
});

module.exports = router;
