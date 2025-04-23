const express = require('express');
const bookingController = require('../controllers/bookingController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Configure multer storage for Samuh Lagan files
const samuhLaganStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/samuh-lagan');
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const samuhLaganUpload = multer({ 
  storage: samuhLaganStorage,
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf)$/)) {
      return cb(new Error('Only image and PDF files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Configure multer storage for Student Award files
const studentAwardStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/student-awards');
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const studentAwardUpload = multer({ 
  storage: studentAwardStorage,
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf)$/)) {
      return cb(new Error('Only image and PDF files are allowed!'), false);
    }
    cb(null, true);
  }
});


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

// Samuh Lagan specific routes
router.post('/samuh-lagan/submit', 
  samuhLaganUpload.fields([
    { name: 'bridePhoto', maxCount: 1 },
    { name: 'groomPhoto', maxCount: 1 },
    { name: 'brideDocuments', maxCount: 5 },
    { name: 'groomDocuments', maxCount: 5 }
  ]), 
  bookingController.submitSamuhLaganRequest
);
router.get('/samuh-lagan', bookingController.getAllSamuhLaganRequests);
router.get('/samuh-lagan/:id', bookingController.getSamuhLaganRequestById);
router.put('/samuh-lagan/approve/:requestId', bookingController.approveSamuhLaganRequest);
router.put('/samuh-lagan/reject/:requestId', bookingController.rejectSamuhLaganRequest);
router.put('/samuh-lagan/confirm/:requestId', bookingController.confirmSamuhLaganRequest);

// Student Award Registration routes
router.post('/student-awards/register', 
  studentAwardUpload.single('marksheet'), 
  bookingController.submitStudentAwardRequest
);

router.get('/student-awards', bookingController.getAllStudentAwardRequests);
router.get('/student-awards/:id', bookingController.getStudentAwardRequestById);
router.put('/student-awards/approve/:requestId', bookingController.approveStudentAwardRequest);
router.put('/student-awards/reject/:requestId', bookingController.rejectStudentAwardRequest);

module.exports = router;