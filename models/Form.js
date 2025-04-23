const mongoose = require('mongoose');

// Drop any existing indexes on the forms collection
mongoose.connection.once('open', async () => {
  try {
    await mongoose.connection.db.collection('forms').dropIndexes();
    console.log('Dropped all indexes on forms collection');
  } catch (err) {
    console.error('Error dropping indexes:', err);
  }
});

const formSchema = new mongoose.Schema({
  formType: {
    type: String,
    required: true,
    enum: ['samuhLagan', 'studentAwards'],
    unique: true
  },
  active: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  eventDate: {
    type: Date,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to check if form is currently active based on time constraints
formSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  
  // If form is not active, return false
  if (!this.active) return false;
  
  // If no time constraints are set, return the active status
  if (!this.startTime && !this.endTime) return true;
  
  // Check if current time is within the allowed range
  const isAfterStart = !this.startTime || now >= this.startTime;
  const isBeforeEnd = !this.endTime || now <= this.endTime;
  
  return isAfterStart && isBeforeEnd;
};

module.exports = mongoose.model('Form', formSchema); 