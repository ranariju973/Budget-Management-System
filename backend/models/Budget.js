const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later'],
    max: [2050, 'Year cannot exceed 2050']
  },
  monthNumber: {
    type: Number,
    required: [true, 'Month number is required'],
    min: [1, 'Month must be between 1-12'],
    max: [12, 'Month must be between 1-12']
  },
  income: {
    type: Number,
    required: [true, 'Income is required'],
    min: [0, 'Income cannot be negative'],
    default: 0
  }
}, {
  timestamps: true
});

// Create compound index to ensure one budget per user per month/year
budgetSchema.index({ userId: 1, year: 1, monthNumber: 1 }, { unique: true });

// Virtual for month name
budgetSchema.virtual('monthName').get(function() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[this.monthNumber - 1];
});

// Virtual populate for expenses and borrowings
budgetSchema.virtual('expenses', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'budgetId'
});

budgetSchema.virtual('borrowings', {
  ref: 'Borrowing',
  localField: '_id',
  foreignField: 'budgetId'
});

budgetSchema.virtual('lendings', {
  ref: 'Lending',
  localField: '_id',
  foreignField: 'budgetId'
});

budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Budget', budgetSchema);
