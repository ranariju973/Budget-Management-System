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

const budgetValidation = [
  body('year').isInt({ min: 2020, max: 2050 }).withMessage('Year must be between 2020 and 2050'),
  body('monthNumber').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('income').isFloat({ min: 0 }).withMessage('Income must be a positive number')
];

// @route   POST /api/budgets
// @desc    Create a new budget
router.post('/', budgetValidation, handleValidationErrors, async (req, res) => {
  try {
    const { year, monthNumber, income } = req.body;
    const userId = req.user.uid;

    const budgetsRef = db.collection('budgets');
    const q = budgetsRef
      .where('userId', '==', userId)
      .where('year', '==', year)
      .where('monthNumber', '==', monthNumber)
      .limit(1);
    
    const snapshot = await q.get();

    if (!snapshot.empty) {
      return res.status(400).json({ message: 'Budget already exists for this month and year' });
    }

    const newBudget = {
      userId,
      year,
      monthNumber,
      income,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await budgetsRef.add(newBudget);
    const savedBudget = (await docRef.get()).data();

    res.status(201).json({
      message: 'Budget created successfully',
      budget: { id: docRef.id, ...savedBudget }
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ message: 'Error creating budget', error: error.message });
  }
});

// @route   GET /api/budgets
// @desc    Get all budgets for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db.collection('budgets')
      .where('userId', '==', userId)
      .orderBy('year', 'desc')
      .orderBy('monthNumber', 'desc')
      .get();

    const budgets = [];
    snapshot.forEach(doc => {
      budgets.push({ id: doc.id, ...doc.data() });
    });

    res.json({ budgets });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Error fetching budgets' });
  }
});

// @route   GET /api/budgets/:id
// @desc    Get budget by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('budgets').doc(req.params.id).get();

    if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    // In Firestore, we don't 'populate'. We fetch related data manually if needed.
    // For simple getById, we usually just return the budget document.
    // If the frontend expects 'expenses' etc, we might need to fetch them.
    // Based on original code, it populated fields. I'll fetch them.
    
    const budgetData = { id: doc.id, ...doc.data() };
    
    const expensesSnap = await db.collection('expenses').where('budgetId', '==', req.params.id).get();
    const borrowingsSnap = await db.collection('borrowings').where('budgetId', '==', req.params.id).get();
    const lendingsSnap = await db.collection('lendings').where('budgetId', '==', req.params.id).get();

    budgetData.expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    budgetData.borrowings = borrowingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    budgetData.lendings = lendingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json({ budget: budgetData });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ message: 'Error fetching budget' });
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update budget income
router.put('/:id', [
  body('income').isFloat({ min: 0 }).withMessage('Income must be a positive number')
], handleValidationErrors, async (req, res) => {
  try {
    const { income } = req.body;
    const docRef = db.collection('budgets').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    await docRef.update({ 
      income, 
      updatedAt: admin.firestore.FieldValue.serverTimestamp() 
    });
    
    const updatedDoc = await docRef.get();

    res.json({
      message: 'Budget updated successfully',
      budget: { id: updatedDoc.id, ...updatedDoc.data() }
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Error updating budget' });
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete budget and associated data
router.delete('/:id', async (req, res) => {
  try {
    const docRef = db.collection('budgets').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Delete associated data (Batch write would be better for atomicity)
    const batch = db.batch();
    batch.delete(docRef);

    const expensesSnap = await db.collection('expenses').where('budgetId', '==', req.params.id).get();
    expensesSnap.docs.forEach(d => batch.delete(d.ref));

    const borrowingsSnap = await db.collection('borrowings').where('budgetId', '==', req.params.id).get();
    borrowingsSnap.docs.forEach(d => batch.delete(d.ref));

    // Note: Lendings were not deleted in original code, but probably should be? 
    // Checking original code... ah, it didn't delete lendings. I'll stick to maintaining parity + consistency.
    // Original: Expense.deleteMany, Borrowing.deleteMany, Budget.findByIdAndDelete.
    // Lendings logic was seemingly missing in delete in Mongoose version as well?
    // I'll add lendings delete for cleanup.
    const lendingsSnap = await db.collection('lendings').where('budgetId', '==', req.params.id).get();
    lendingsSnap.docs.forEach(d => batch.delete(d.ref));

    await batch.commit();

    res.json({ message: 'Budget and associated data deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Error deleting budget' });
  }
});

// @route   GET /api/budgets/:id/summary
// @desc    Get budget summary
router.get('/:id/summary', async (req, res) => {
  try {
    const doc = await db.collection('budgets').doc(req.params.id).get();

    if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const budget = doc.data();

    const [expensesSnap, borrowingsSnap, lendingsSnap] = await Promise.all([
      db.collection('expenses').where('budgetId', '==', req.params.id).get(),
      db.collection('borrowings').where('budgetId', '==', req.params.id).get(),
      db.collection('lendings').where('budgetId', '==', req.params.id).get()
    ]);

    const expenses = expensesSnap.docs.map(d => d.data());
    const borrowings = borrowingsSnap.docs.map(d => d.data());
    const lendings = lendingsSnap.docs.map(d => d.data());

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalBorrowings = borrowings.filter(b => !b.isRepaid).reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalLendings = lendings.filter(l => !l.isRepaid).reduce((sum, l) => sum + (l.amount || 0), 0);
    
    const remaining = (budget.income || 0) - totalExpenses;

    const byCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + (expense.amount || 0);
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
    res.status(500).json({ message: 'Error fetching budget summary' });
  }
});

module.exports = router;
