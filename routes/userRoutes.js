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
router.put('/password', auth, userController.updatePassword);
router.put('/notifications', auth, userController.updateNotifications);
router.put('/profile-image', auth, upload.single('image'), userController.updateProfileImage);
router.delete('/profile-image', auth, userController.removeProfileImage);

// Admin routes
router.get('/all', auth, userController.getAllUsers);
router.delete('/:id', auth, userController.deleteUser);
router.put('/:id', auth, userController.updateUser);
router.get('/dashboard-stats', auth, userController.getDashboardStats);

// Booking routes for user
router.get('/bookings', auth, bookingController.getUserBookings);
router.post('/bookings/:id/cancel', auth, bookingController.cancelBooking);

module.exports = router; 