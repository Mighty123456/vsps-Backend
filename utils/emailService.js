const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter with your Gmail credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, // asthavetcare@gmail.com
    pass: process.env.EMAIL_PASS  // Changed from EMAIL_PASSWORD to EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log('Email service error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

const emailTemplates = {
  bookingRequest: (userName, date) => ({
    subject: 'Booking Request Received',
    html: `
      <h2>Thank you for your booking request!</h2>
      <p>Dear ${userName},</p>
      <p>We have received your booking request for ${date}. Our team will review it and notify you soon.</p>
    `
  }),

  bookingApproved: (userName, date) => ({
    subject: 'Wadi Booking Payment Details',
    html: `
      <h2>Booking Payment Details</h2>
      <p>Dear ${userName},</p>
      <p>Your booking request for ${date} has been received.</p>
      <p>You need to pay amount (Samaj Member) / amount (Non-Samaj Member).</p>
      <p>Please complete the payment in cash at our office.</p>
      <p>Your booking will be confirmed after payment.</p>
    `
  }),

  bookingRejected: (userName, date, reason) => ({
    subject: 'Booking Request Rejected',
    html: `
      <h2>Booking Request Status Update</h2>
      <p>Dear ${userName},</p>
      <p>Unfortunately, your booking request for ${date} has been rejected due to: ${reason}</p>
      <p>Please try selecting another date.</p>
    `
  }),

  paymentSuccess: (userName, date, receiptUrl) => ({
    subject: 'Payment Successful - Booking Confirmed',
    html: `
      <h2>Payment Successful!</h2>
      <p>Dear ${userName},</p>
      <p>Your payment has been received successfully. Your booking for ${date} is now confirmed.</p>
      <p>You can download your receipt <a href="${receiptUrl}">here</a>.</p>
    `
  }),

  eventReminder: (userName, date, eventDetails) => ({
    subject: `Reminder: Your Upcoming Event on ${date}`,
    html: `
      <h2>Event Reminder</h2>
      <p>Dear ${userName},</p>
      <p>This is a reminder about your upcoming event on ${date}.</p>
      <h3>Event Details:</h3>
      ${eventDetails}
    `
  }),

  bookingConfirmed: (userName, date) => ({
    subject: 'Booking Confirmed Successfully',
    html: `
      <h2>Booking Confirmation</h2>
      <p>Dear ${userName},</p>
      <p>Your booking for ${date} has been confirmed successfully.</p>
      <p>Thank you for choosing our services.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
    `
  })
};

const sendEmail = async (to, template, data) => {
  try {
    const emailContent = emailTemplates[template](data.name, data.date, data.reason);
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    });
    console.log(`Email sent successfully: ${template}`);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = { sendEmail }; 