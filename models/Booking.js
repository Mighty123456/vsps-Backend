const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  guestCount: {
    type: Number,
    required: true
  },
  additionalServices: [{ type: String }],
  // community: {
  //   type: String,
  //   default: ''
  // },
  additionalNotes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Booked', 'Rejected'],
    default: 'Pending'
  },
  rejectionReason: { type: String },
  eventDocument: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['Aadhar Card', 'PAN Card', 'Passport', 'Event Invitation', 'Organization Letterhead', 'Birth Certificate', 'Marriage Certificate', 'Other'],
    default: 'Other'
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);