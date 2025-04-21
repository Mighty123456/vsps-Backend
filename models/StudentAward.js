const mongoose = require('mongoose');

const studentAwardSchema = new mongoose.Schema({
  // Student Information
  name: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  
  // Academic Details
  schoolName: {
    type: String,
    required: true
  },
  standard: {
    type: String,
    required: true
  },
  boardName: {
    type: String,
    required: true
  },
  examYear: {
    type: String,
    required: true
  },
  totalPercentage: {
    type: String,
    required: true
  },
  rank: {
    type: String,
    enum: ['first', 'second', 'third', 'none'],
    default: 'none'
  },
  marksheet: {
    type: String,
    required: true
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add method to check eligibility
studentAwardSchema.methods.isEligible = function() {
  const percentage = this.totalPercentage;
  const hasValidRank = ['first', 'second', 'third'].includes(this.rank);
  return percentage >= 85 || hasValidRank;
};

module.exports = mongoose.model('StudentAward', studentAwardSchema); 