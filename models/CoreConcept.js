const mongoose = require('mongoose');

const coreConceptSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    enum: ['Computer Networks', 'DBMS', 'Operating System', 'System Design', 'OOP', 'Computer Architecture']
  },
  subTopic: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sequenceNo: {
    type: Number,
    default: 0
  },
  youtubeLink: {
    type: String,
    default: ''
  },
  notesLink: {
    type: String,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
coreConceptSchema.index({ topic: 1, subTopic: 1 });

module.exports = mongoose.model('CoreConcept', coreConceptSchema);
