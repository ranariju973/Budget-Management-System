const mongoose = require('mongoose');

const borrowingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    required: [true, 'Budget ID is required']
  },
  lenderName: {
    type: String,
    required: [true, 'Lender name is required'],
    trim: true,
    maxLength: [100, 'Lender name cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxLength: [500, 'Notes cannot exceed 500 characters']
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
borrowingSchema.index({ userId: 1, budgetId: 1, date: -1 });
borrowingSchema.index({ isRepaid: 1 });

module.exports = mongoose.model('Borrowing', borrowingSchema);
