const express = require('express');
const bookingController = require('../controllers/bookingController');
const multer = require('multer');
const path = require('path');
const router = express.Router();


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });


router.post('/submit', bookingController.submitBookingRequest);


router.get('/', bookingController.getAllBookings);


router.put('/approve/:bookingId', bookingController.approveBooking);


router.put('/reject/:bookingId', bookingController.rejectBooking);

router.put('/confirm-payment/:bookingId', bookingController.confirmPayment);


router.post('/test-email', async (req, res) => {
  try {
    console.log('Testing email with:', {
      emailUser: process.env.EMAIL_USER,
      emailPassExists: !!process.env.EMAIL_PASS
    });

    await sendEmail(
      process.env.ADMIN_EMAIL, 
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


router.post('/upload-document', upload.single('document'), bookingController.uploadDocument);


router.put('/update/:bookingId', bookingController.updateBooking);


router.put('/confirm-booking/:bookingId', bookingController.confirmBooking);

module.exports = router;