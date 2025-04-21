const mongoose = require('mongoose');

const samuhLaganSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Bride Details
  bride: {
    name: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    contactNumber: { type: String, required: true },
    address: { type: String, required: true },
    photo: { type: String },
    documents: [{ type: String }]
  },
  // Groom Details
  groom: {
    name: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    contactNumber: { type: String, required: true },
    address: { type: String, required: true },
    photo: { type: String },
    documents: [{ type: String }]
  },
  // Ceremony Details
  ceremonyDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'confirmed', 'rejected'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  rejectionReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
samuhLaganSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
samuhLaganSchema.index({ user: 1 });
samuhLaganSchema.index({ status: 1 });
samuhLaganSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SamuhLagan', samuhLaganSchema); 