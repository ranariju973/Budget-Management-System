const express = require('express');
const admin = require('firebase-admin');
const verifyToken = require('../middleware/firebaseAuth');

const router = express.Router();
const db = admin.firestore();

// @route   POST /api/auth/sync
// @desc    Sync user data from Firebase Auth to Firestore (if new user)
// @access  Private (Valid Token Required)
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user; // properties from decoded token
    
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      // Create new user profile in Firestore
      const newUser = {
        name: name || email.split('@')[0],
        email,
        picture,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await userRef.set(newUser);
      return res.status(201).json({ 
        message: 'User profile created', 
        user: { id: uid, ...newUser } 
      });
    }

    // User exists, maybe update last login?
    await userRef.update({ 
      lastLogin: admin.firestore.FieldValue.serverTimestamp() 
    });

    res.json({ 
      message: 'User synced', 
      user: { id: uid, ...doc.data() } 
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Error syncing user' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
        // Fallback if doc doesn't exist but they have a valid token (rare, but possible if sync failed)
        // We can check auth directly
        const userRecord = await admin.auth().getUser(req.user.uid);
        return res.json({
            user: {
                id: req.user.uid,
                email: userRecord.email,
                name: userRecord.displayName
            }
        });
    }

    res.json({
        user: { id: doc.id, ...doc.data() }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Legacy routes (stubbed out or removed)
// We remove login/register/logout because that's handled client-side by Firebase SDK directly.
// But we might want to keep the paths returning 404 or 400 to avoid confusion if frontend calls them.

module.exports = router;
