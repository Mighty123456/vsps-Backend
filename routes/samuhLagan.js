const express = require('express');
const router = express.Router();
const SamuhLagan = require('../models/SamuhLagan');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

// Submit new Samuh Lagan registration
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const samuhLagan = new SamuhLagan({
      user: req.user._id,
      ...req.body
    });

    await samuhLagan.save();

    // Send thank you email
    await sendEmail({
      to: req.user.email,
      subject: 'Samuh Lagan Registration Received',
      template: 'samuhLaganThankYou',
      context: {
        userName: req.user.name,
        ceremonyDate: samuhLagan.ceremonyDate
      }
    });

    res.status(201).json({ message: 'Registration submitted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all registrations (admin only)
router.get('/', isAdmin, async (req, res) => {
  try {
    const registrations = await SamuhLagan.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's registrations
router.get('/my-registrations', isAuthenticated, async (req, res) => {
  try {
    const registrations = await SamuhLagan.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin approve registration
router.patch('/:id/approve', isAdmin, async (req, res) => {
  try {
    const registration = await SamuhLagan.findById(req.params.id)
      .populate('user', 'name email');

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    registration.status = 'approved';
    await registration.save();

    // Send approval email
    await sendEmail({
      to: registration.user.email,
      subject: 'Please Visit Wadi Office for Payment',
      template: 'samuhLaganApproval',
      context: {
        userName: registration.user.name,
        ceremonyDate: registration.ceremonyDate
      }
    });

    res.json({ message: 'Registration approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin confirm payment
router.patch('/:id/confirm-payment', isAdmin, async (req, res) => {
  try {
    const registration = await SamuhLagan.findById(req.params.id)
      .populate('user', 'name email');

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    registration.status = 'confirmed';
    registration.paymentStatus = 'paid';
    await registration.save();

    // Send confirmation email
    await sendEmail({
      to: registration.user.email,
      subject: 'Samuh Lagan Booking Confirmed',
      template: 'samuhLaganConfirmation',
      context: {
        userName: registration.user.name,
        ceremonyDate: registration.ceremonyDate
      }
    });

    res.json({ message: 'Payment confirmed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin reject registration
router.patch('/:id/reject', isAdmin, async (req, res) => {
  try {
    const registration = await SamuhLagan.findById(req.params.id)
      .populate('user', 'name email');

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    registration.status = 'rejected';
    registration.rejectionReason = req.body.reason;
    await registration.save();

    // Send rejection email
    await sendEmail({
      to: registration.user.email,
      subject: 'Samuh Lagan Registration Update',
      template: 'samuhLaganRejection',
      context: {
        userName: registration.user.name,
        reason: req.body.reason
      }
    });

    res.json({ message: 'Registration rejected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 