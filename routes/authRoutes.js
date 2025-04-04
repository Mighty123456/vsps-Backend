const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Auth routes
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP); // This is the endpoint we're using
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/resend-otp', authController.resendOTP);
router.post('/verify-reset-otp', authController.verifyResetOTP);

module.exports = router;