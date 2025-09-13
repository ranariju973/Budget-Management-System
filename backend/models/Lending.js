const mongoose = require('mongoose');

const lendingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    required: true
  },
  borrowerName: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  isRepaid: {
    type: Boolean,
    default: false
  },
  repaidDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
lendingSchema.index({ userId: 1, budgetId: 1 });
lendingSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Lending', lendingSchema);
