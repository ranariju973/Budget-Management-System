const express = require('express');
const admin = require('firebase-admin');
const { body, validationResult } = require('express-validator');
const verifyToken = require('../middleware/firebaseAuth');

const router = express.Router();
const db = admin.firestore();

router.use(verifyToken);

// Create lending
router.post('/', [
    body('budgetId').notEmpty().withMessage('Valid budget ID is required'),
    body('borrowerName').trim().notEmpty().withMessage('Borrower name is required'),
    body('amount').isFloat({ min: 0.01 }),
    body('date').isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if(!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed', errors: errors.array() });

        const { budgetId, borrowerName, amount, date, notes } = req.body;
        const userId = req.user.uid;

        const budgetDoc = await db.collection('budgets').doc(budgetId).get();
        if (!budgetDoc.exists || budgetDoc.data().userId !== userId) return res.status(404).json({ message: 'Budget not found' });

        const newLending = {
            userId,
            budgetId,
            borrowerName,
            amount: parseFloat(amount),
            date: admin.firestore.Timestamp.fromDate(new Date(date)),
            notes,
            isRepaid: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('lendings').add(newLending);
        
        // Auto create expense (Money lent out is an expense initially)
        try {
            const lendingExpense = {
                userId,
                budgetId,
                name: `Money lent to ${borrowerName}`,
                category: 'Other',
                amount: parseFloat(amount),
                date: admin.firestore.Timestamp.fromDate(new Date(date)),
                notes: `Automatic expense for lending: ${notes || 'Money lent out'}`,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            const expenseRef = await db.collection('expenses').add(lendingExpense);
            
            // Return response
            const savedLending = (await docRef.get()).data();
            const savedExpense = (await expenseRef.get()).data();
            if(savedLending.date) savedLending.date = savedLending.date.toDate();
            if(savedExpense.date) savedExpense.date = savedExpense.date.toDate();

            res.status(201).json({
                message: 'Lending created successfully with automatic expense entry',
                lending: { id: docRef.id, ...savedLending },
                expense: { id: expenseRef.id, ...savedExpense }
            });

        } catch(e) {
            console.error('Error creating lending expense', e);
            // If expense creation fails, we might still want to return success for lending or rollback.
            // Simplified: return success with note.
            res.status(201).json({ 
                message: 'Lending created but expense creation failed',
                lending: { id: docRef.id, ...newLending }
            });
        }
    } catch(error) {
        console.error('Error creating lending:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all lendings
router.get('/', async (req, res) => {
    try {
        const { budgetId, isRepaid, startDate, endDate } = req.query;
        let query = db.collection('lendings').where('userId', '==', req.user.uid);
        
        if (budgetId) query = query.where('budgetId', '==', budgetId);
        if (isRepaid !== undefined) query = query.where('isRepaid', '==', isRepaid === 'true');

        const snapshot = await query.get();
        let lendings = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            if(d.date) d.date = d.date.toDate();
            if(d.repaidDate) d.repaidDate = d.repaidDate.toDate();
            lendings.push({ id: doc.id, ...d });
        });

        // Date filter in memory
        if (startDate) lendings = lendings.filter(l => l.date >= new Date(startDate));
        if (endDate) lendings = lendings.filter(l => l.date <= new Date(endDate));

        lendings.sort((a,b) => b.date - a.date);

         // Populate budgets
        const budgetIds = [...new Set(lendings.map(b => b.budgetId))];
        const budgetMap = {};
        if (budgetIds.length > 0) {
            const budgetSnapshots = await db.getAll(...budgetIds.map(id => db.collection('budgets').doc(id)));
            budgetSnapshots.forEach(doc => { if (doc.exists) budgetMap[doc.id] = doc.data(); });
        }

        const populated = lendings.map(b => ({
            ...b,
            budgetId: budgetMap[b.budgetId] ? { id: b.budgetId, year: budgetMap[b.budgetId].year, monthNumber: budgetMap[b.budgetId].monthNumber } : b.budgetId
        }));

        res.json({ lendings: populated });
    } catch (error) {
        console.error('Error fetching lendings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get lending by ID
router.get('/:id', async (req, res) => {
    try {
        const doc = await db.collection('lendings').doc(req.params.id).get();
        if (!doc.exists || doc.data().userId !== req.user.uid) return res.status(404).json({ message: 'Lending not found' });
        
        const data = doc.data();
        if(data.date) data.date = data.date.toDate();
        if(data.repaidDate) data.repaidDate = data.repaidDate.toDate();

        const budgetDoc = await db.collection('budgets').doc(data.budgetId).get();
        let budgetData = data.budgetId;
        if(budgetDoc.exists) {
            const b = budgetDoc.data();
            budgetData = { id: budgetDoc.id, year: b.year, monthNumber: b.monthNumber };
        }

        res.json({ lending: { id: doc.id, ...data, budgetId: budgetData } });
    } catch(e) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Repay lending
router.put('/:id/repay', async (req, res) => {
    try {
        const docRef = db.collection('lendings').doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists || doc.data().userId !== req.user.uid) return res.status(404).json({ message: 'Lending not found' });

        const lending = doc.data();

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

        // Auto create "negative expense" (income)
        try {
            const repaymentIncome = {
                 userId: req.user.uid,
                 budgetId: lending.budgetId,
                 name: `Loan Repayment from ${lending.borrowerName}`,
                 category: 'Other',
                 amount: -lending.amount, // Negative for income
                 date: admin.firestore.Timestamp.now(),
                 notes: `Automatic income for loan repayment from ${lending.borrowerName}`,
                 createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('expenses').add(repaymentIncome);
        } catch(e) {
            console.error('Error creating repayment income', e);
        }

        res.json({ message: 'Lending marked as repaid and income recorded', lending: { id: updatedDoc.id, ...data, budgetId: budgetData } });
    } catch (error) {
        console.error('Error marking lending as repaid:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete lending
router.delete('/:id', async (req, res) => {
    try {
        const docRef = db.collection('lendings').doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists || doc.data().userId !== req.user.uid) return res.status(404).json({ message: 'Lending not found' });
        
        await docRef.delete();
        
        // Try delete associated expense? 
        // Original code tried to query expense by name/amount match.
        // We can attempt same logic using firestore query.
        try {
            const expenseSnap = await db.collection('expenses')
                .where('userId', '==', req.user.uid)
                .where('budgetId', '==', doc.data().budgetId)
                .where('name', '==', `Money lent to ${doc.data().borrowerName}`)
                .where('amount', '==', doc.data().amount)
                .limit(1)
                .get();
            
            if(!expenseSnap.empty) {
                await expenseSnap.docs[0].ref.delete();
                console.log('Deleted associated lending expense');
            }
        } catch(e) {
             console.error('Error deleting associated lending expense:', e);
        }

        res.json({ message: 'Lending deleted successfully' });
    } catch (error) {
        console.error('Error deleting lending:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
