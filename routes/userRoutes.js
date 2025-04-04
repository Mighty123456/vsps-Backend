const express = require('express');
const router = express.Router();
const { authMiddleware: auth } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const bookingController = require('../controllers/bookingController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Profile routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.put('/profile/password', auth, userController.updatePassword);
router.put('/profile/notifications', auth, userController.updateNotifications);

// Booking routes for user
router.get('/bookings', auth, bookingController.getUserBookings);
router.post('/bookings/:id/cancel', auth, bookingController.cancelBooking);

router.get('/all', auth, userController.getAllUsers);

// Add these new routes
router.put('/:id', auth, userController.updateUser);
router.delete('/:id', auth, userController.deleteUser);

// Add this new route for profile image upload
router.post('/profile/image', auth, upload.single('profileImage'), userController.updateProfileImage);

module.exports = router; 