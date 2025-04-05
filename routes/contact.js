const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/Contact');
const { authMiddleware } = require('../middleware/authMiddleware'); 
const { sendContactConfirmationEmail } = require('../utils/email');

router.post('/', authMiddleware, async (req, res) => {
  const { name, email, subject, message } = req.body;
  const userId = req.user.id; 

  try {
    const newMessage = new ContactMessage({
      userId,
      name,
      email,
      subject,
      message,
    });

    await newMessage.save();


    const adminEmail = process.env.ADMIN_EMAIL; 
    await sendContactConfirmationEmail(email, adminEmail, name, message);

    res.status(201).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message. Please try again.' });
  }
});

module.exports = router;