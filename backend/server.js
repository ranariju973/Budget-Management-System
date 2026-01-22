const express = require('express');

const cors = require('cors');
const dotenv = require('dotenv');


// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const budgetRoutes = require('./routes/budgets');
const expenseRoutes = require('./routes/expenses');
const borrowingRoutes = require('./routes/borrowings');
const lendingRoutes = require('./routes/lendings');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    // Specific production frontend URL
    'https://budget-management-system-frontend.onrender.com',
    // Add production frontend URL patterns
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.netlify\.app$/,
    /^https:\/\/.*\.onrender\.com$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200 // For legacy mobile browsers
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Firebase Admin Initialization
const admin = require('firebase-admin');
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS) : null;

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    // Fallback to default credentials (useful for GCP environments or if GOOGLE_APPLICATION_CREDENTIALS env var is set to path)
    // For local dev without a key file, this might warn.
    admin.initializeApp({
        projectId: 'budget-management-demo-app' 
    });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/borrowings', borrowingRoutes);
app.use('/api/lendings', lendingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Budget Management API is running with Firebase!' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.statusCode || 500).json({
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
// Force restart

