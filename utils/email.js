const nodemailer = require('nodemailer');

// Create a transporter object using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to send a contact confirmation email
const sendContactConfirmationEmail = async (userEmail, adminEmail, userName, message) => {
  // Email to user - sent FROM admin TO user
  const userMailOptions = {
    from: {
      name: 'Community Web Team', // Add a friendly name
      address: process.env.EMAIL_USER // Admin's email address
    },
    to: userEmail,
    subject: 'Thank you for contacting us',
    html: `
      <h2>Thank you for reaching out!</h2>
      <p>Dear ${userName},</p>
      <p>We have received your message and will get back to you as soon as possible.</p>
      <p>Your message:</p>
      <blockquote>${message}</blockquote>
      <p>Best regards,<br>Community Web Team</p>
    `
  };

  // Email to admin - sent FROM system TO admin
  const adminMailOptions = {
    from: {
      name: `${userName} via Contact Form`, // Show who sent the message
      address: process.env.EMAIL_USER
    },
    replyTo: userEmail, // Add reply-to field so admin can reply directly
    to: adminEmail,
    subject: 'New Contact Form Submission',
    html: `
      <h2>New Contact Form Submission</h2>
      <p>From: ${userName} (${userEmail})</p>
      <p>Message:</p>
      <blockquote>${message}</blockquote>
      <hr>
      <p><small>To reply to this message, simply reply to this email.</small></p>
    `
  };

  try {
    // Send both emails
    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(adminMailOptions);
    console.log('Confirmation emails sent successfully');
  } catch (error) {
    console.error('Error sending confirmation emails:', error);
    throw error;
  }
};

module.exports = { sendContactConfirmationEmail };