const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
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
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  // Track the last state change for current completed status
  lastStateChangeAt: {
    type: Date
  },
  // Count total times this question was marked as completed
  completionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create compound index to ensure one progress entry per user-question pair
userProgressSchema.index({ user: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);
