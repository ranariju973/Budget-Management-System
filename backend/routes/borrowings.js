const express = require('express');
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');
const verifyToken = require('../middleware/firebaseAuth');

const router = express.Router();
const db = admin.firestore();

router.use(verifyToken);

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  next();
};

const borrowingValidation = [
  body('budgetId').notEmpty().withMessage('Budget ID is required'),
  body('lenderName').trim().isLength({ min: 1, max: 100 }),
  body('amount').isFloat({ min: 0.01 }),
  body('date').isISO8601().toDate(),
  body('notes').optional().trim().isLength({ max: 500 })
];

// @route   POST /api/borrowings
router.post('/', borrowingValidation, handleValidationErrors, async (req, res) => {
  try {
    const { budgetId, lenderName, amount, date, notes } = req.body;
    const userId = req.user.uid;

    const budgetDoc = await db.collection('budgets').doc(budgetId).get();
    if (!budgetDoc.exists || budgetDoc.data().userId !== userId) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const newBorrowing = {
      userId,
      budgetId,
      lenderName,
      amount,
      date: admin.firestore.Timestamp.fromDate(new Date(date)),
      notes,
      isRepaid: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('borrowings').add(newBorrowing);
    const savedBorrowing = (await docRef.get()).data();
    if(savedBorrowing.date) savedBorrowing.date = savedBorrowing.date.toDate();

    res.status(201).json({
      message: 'Borrowing created successfully',
      borrowing: { id: docRef.id, ...savedBorrowing }
    });
  } catch (error) {
    console.error('Create borrowing error:', error);
    res.status(500).json({ message: 'Error creating borrowing' });
  }
});

// @route   GET /api/borrowings
router.get('/', async (req, res) => {
  try {
    const { budgetId, isRepaid } = req.query;
    const userId = req.user.uid;

    let query = db.collection('borrowings').where('userId', '==', userId);

    if (budgetId) {
        // Validation check
        const budgetDoc = await db.collection('budgets').doc(budgetId).get();
        if (!budgetDoc.exists || budgetDoc.data().userId !== userId) {
            return res.status(404).json({ message: 'Budget not found' });
        }
        query = query.where('budgetId', '==', budgetId);
    }
    if (isRepaid !== undefined) {
      query = query.where('isRepaid', '==', isRepaid === 'true');
    }

    const snapshot = await query.get();
    const borrowings = [];
    snapshot.forEach(doc => {
        const d = doc.data();
        if(d.date) d.date = d.date.toDate();
        if(d.repaidDate) d.repaidDate = d.repaidDate.toDate();
        borrowings.push({ id: doc.id, ...d });
    });

    borrowings.sort((a, b) => b.date - a.date);

    // Populate budgets
    const budgetIds = [...new Set(borrowings.map(b => b.budgetId))];
    const budgetMap = {};
    if (budgetIds.length > 0) {
        const budgetSnapshots = await db.getAll(...budgetIds.map(id => db.collection('budgets').doc(id)));
        budgetSnapshots.forEach(doc => { if (doc.exists) budgetMap[doc.id] = doc.data(); });
    }

    const populatedBorrowings = borrowings.map(b => ({
        ...b,
        budgetId: budgetMap[b.budgetId] ? { id: b.budgetId, year: budgetMap[b.budgetId].year, monthNumber: budgetMap[b.budgetId].monthNumber } : b.budgetId
    }));

    res.json({ borrowings: populatedBorrowings });
  } catch (error) {
    console.error('Get borrowings error:', error);
    res.status(500).json({ message: 'Error fetching borrowings' });
  }
});

// @route   GET /api/borrowings/:id
router.get('/:id', async (req, res) => {
    try {
        const doc = await db.collection('borrowings').doc(req.params.id).get();
        if (!doc.exists || doc.data().userId !== req.user.uid) return res.status(404).json({ message: 'Borrowing not found' });
        
        const data = doc.data();
        if(data.date) data.date = data.date.toDate();
        if(data.repaidDate) data.repaidDate = data.repaidDate.toDate();

        const budgetDoc = await db.collection('budgets').doc(data.budgetId).get();
        let budgetData = data.budgetId;
        if(budgetDoc.exists) {
            const b = budgetDoc.data();
            budgetData = { id: budgetDoc.id, year: b.year, monthNumber: b.monthNumber };
        }

        res.json({ borrowing: { id: doc.id, ...data, budgetId: budgetData } });
    } catch(e) {
        res.status(500).json({ message: 'Error fetching borrowing' });
    }
});

// @route   PUT /api/borrowings/:id
router.put('/:id', [
    body('amount').optional().isFloat({ min: 0.01 }),
    body('date').optional().isISO8601().toDate(),
    body('isRepaid').optional().isBoolean(),
    body('repaidDate').optional().isISO8601().toDate()
], handleValidationErrors, async (req, res) => {
  try {
    const docRef = db.collection('borrowings').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.user.uid) return res.status(404).json({ message: 'Borrowing not found' });

    const updates = { ...req.body };
    if (updates.date) updates.date = admin.firestore.Timestamp.fromDate(new Date(updates.date));
    if (updates.repaidDate) updates.repaidDate = admin.firestore.Timestamp.fromDate(new Date(updates.repaidDate));

    if (updates.isRepaid === true && !updates.repaidDate) {
        updates.repaidDate = admin.firestore.Timestamp.now();
    }
    if (updates.isRepaid === false) {
        updates.repaidDate = null;
    }

    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    const data = updatedDoc.data();
    if(data.date) data.date = data.date.toDate();
    if(data.repaidDate) data.repaidDate = data.repaidDate.toDate();
    
    // Populate budget (simplified)
    const budgetDoc = await db.collection('budgets').doc(data.budgetId).get();
    let budgetData = data.budgetId;
    if(budgetDoc.exists) {
         const b = budgetDoc.data();
         budgetData = { id: budgetDoc.id, year: b.year, monthNumber: b.monthNumber };
    }

    res.json({ message: 'Borrowing updated successfully', borrowing: { id: updatedDoc.id, ...data, budgetId: budgetData } });
  } catch (error) {
    console.error('Update borrowing error:', error);
    res.status(500).json({ message: 'Error updating borrowing' });
  }
});

// @route   DELETE /api/borrowings/:id
router.delete('/:id', async (req, res) => {
  try {
    const docRef = db.collection('borrowings').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== req.user.uid) return res.status(404).json({ message: 'Borrowing not found' });
    
    await docRef.delete();
    res.json({ message: 'Borrowing deleted successfully' });
  } catch (error) {
    console.error('Delete borrowing error:', error);
    res.status(500).json({ message: 'Error deleting borrowing' });
  }
});

// @route   PUT /api/borrowings/:id/repay
router.put('/:id/repay', async (req, res) => {
    try {
        const docRef = db.collection('borrowings').doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists || doc.data().userId !== req.user.uid) return res.status(404).json({ message: 'Borrowing not found' });
        
        const borrowing = doc.data();
        
        await docRef.update({
            isRepaid: true,
            repaidDate: admin.firestore.Timestamp.now()
        });

        const updatedDoc = await docRef.get();
        const data = updatedDoc.data();
        if(data.date) data.date = data.date.toDate();
        if(data.repaidDate) data.repaidDate = data.repaidDate.toDate();

        // Populate budget
        const budgetDoc = await db.collection('budgets').doc(data.budgetId).get();
        let budgetData = data.budgetId;
        if(budgetDoc.exists) {
            const b = budgetDoc.data();
            budgetData = { id: budgetDoc.id, year: b.year, monthNumber: b.monthNumber };
        }

        // Automatic expense creation
        try {
            const repaymentExpense = {
                userId: req.user.uid,
                budgetId: data.budgetId,
                name: `Loan Repayment to ${borrowing.lenderName}`,
                category: 'Bills & Utilities',
                amount: borrowing.amount,
                date: admin.firestore.Timestamp.now(),
                notes: `Automatic expense for repaying loan to ${borrowing.lenderName}`,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('expenses').add(repaymentExpense);
            console.log(`Auto-created expense for repayment`);
        } catch (e) {
            console.error('Error creating auto-expense', e);
        }

        res.json({ message: 'Borrowing marked as repaid and expense created', borrowing: { id: updatedDoc.id, ...data, budgetId: budgetData } });

    } catch(error) {
        console.error('Repay error', error);
        res.status(500).json({ message: 'Error marking repaid' });
    }
});

module.exports = router;
