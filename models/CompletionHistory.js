const mongoose = require('mongoose');

const completionHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  completedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Store the date in YYYY-MM-DD format for easy grouping
  dateKey: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
completionHistorySchema.index({ user: 1, question: 1, dateKey: 1 }, { unique: true });
completionHistorySchema.index({ user: 1, dateKey: 1 });

// Pre-save hook to automatically set dateKey from completedAt
completionHistorySchema.pre('save', function(next) {
  if (this.completedAt) {
    this.dateKey = new Date(this.completedAt).toISOString().split('T')[0];
  }
  next();
});

module.exports = mongoose.model('CompletionHistory', completionHistorySchema);
