// server/routes/bookingRoutes.js
const express = require('express');
const bookingController = require('../controllers/bookingController');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Submit a booking request
router.post('/submit', bookingController.submitBookingRequest);

// Get all bookings
router.get('/', bookingController.getAllBookings);

// Approve a booking
router.put('/approve/:bookingId', bookingController.approveBooking);

// Reject a booking
router.put('/reject/:bookingId', bookingController.rejectBooking);

// Confirm payment for a booking
router.put('/confirm-payment/:bookingId', bookingController.confirmPayment);

// Test email route
router.post('/test-email', async (req, res) => {
  try {
    console.log('Testing email with:', {
      emailUser: process.env.EMAIL_USER,
      emailPassExists: !!process.env.EMAIL_PASS
    });

    await sendEmail(
      process.env.ADMIN_EMAIL, // Send test email to admin
      'bookingRequest',
      {
        name: 'Test User',
        date: new Date().toLocaleDateString()
      }
    );
    res.status(200).json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      message: 'Failed to send test email', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Document upload route
router.post('/upload-document', upload.single('document'), bookingController.uploadDocument);

// Update booking route
router.put('/update/:bookingId', bookingController.updateBooking);

// Confirm booking
router.put('/confirm-booking/:bookingId', bookingController.confirmBooking);

module.exports = router;