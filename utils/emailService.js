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
  }),

  samuhLaganRequest: (userName, date) => ({
    subject: 'Samuh Lagan Request Received',
    html: `
      <h2>Thank you for your Samuh Lagan request!</h2>
      <p>Dear ${userName},</p>
      <p>We have received your Samuh Lagan request for ${date}. Our team will review it and notify you soon.</p>
      <p>Please note that this is a special ceremony and requires additional documentation.</p>
    `
  }),

  samuhLaganApproved: (userName, date) => ({
    subject: 'Samuh Lagan Request Approved - Payment Instructions',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9333EA; text-align: center;">Samuh Lagan Request Approved</h2>
        <p>Dear ${userName},</p>
        <p>We are pleased to inform you that your Samuh Lagan request for <strong>${date}</strong> has been approved.</p>
        
        <div style="background-color: #F3E8FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #7E22CE; margin-top: 0;">Payment Instructions</h3>
          <p><strong>Please complete the payment at our office:</strong></p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li>📍 Office Address: [Your Office Address]</li>
            <li>⏰ Office Hours: [Office Hours]</li>
            <li>💰 Payment Methods Accepted: Cash/Card</li>
          </ul>
          <p><strong>Payment Amount:</strong></p>
          <ul>
            <li>Samaj Members: ₹[Amount]</li>
            <li>Non-Samaj Members: ₹[Amount]</li>
          </ul>
        </div>

        <p><strong>Important Notes:</strong></p>
        <ul>
          <li>Please bring valid ID proof when visiting the office</li>
          <li>Your booking will be confirmed only after payment</li>
          <li>Payment should be made within 3 working days</li>
        </ul>

        <p>If you have any questions, please contact us:</p>
        <p>📞 Phone: [Your Phone Number]<br>
           📧 Email: [Your Email]</p>
      </div>
    `
  }),

  samuhLaganRejected: (userName, date, reason) => ({
    subject: 'Samuh Lagan Request Rejected',
    html: `
      <h2>Samuh Lagan Request Status Update</h2>
      <p>Dear ${userName},</p>
      <p>Unfortunately, your Samuh Lagan request for ${date} has been rejected.</p>
      <p>Reason: ${reason}</p>
      <p>Please contact us for more information or try selecting another date.</p>
    `
  }),

  samuhLaganConfirmed: (userName, date) => ({
    subject: 'Samuh Lagan Booking Confirmed - Payment Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9333EA; text-align: center;">Samuh Lagan Booking Confirmed!</h2>
        <p>Dear ${userName},</p>
        <p>We are pleased to confirm that your payment has been received and your Samuh Lagan ceremony for <strong>${date}</strong> has been confirmed.</p>

        <div style="background-color: #F3E8FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #7E22CE; margin-top: 0;">Important Information</h3>
          <p><strong>Ceremony Details:</strong></p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li>📅 Date: ${date}</li>
            <li>📍 Venue: [Venue Name]</li>
            <li>⏰ Reporting Time: [Time]</li>
            <li>📋 Ceremony Time: [Time]</li>
          </ul>
        </div>

        <div style="background-color: #FAF5FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #7E22CE; margin-top: 0;">Required Documents</h3>
          <p>Please ensure to bring the following documents on the day of the ceremony:</p>
          <ul>
            <li>Original ID proofs of bride and groom</li>
            <li>Birth certificates</li>
            <li>Address proofs</li>
            <li>Photographs as submitted</li>
            <li>Any additional documents submitted during registration</li>
          </ul>
        </div>

        <p><strong>Additional Notes:</strong></p>
        <ul>
          <li>Please arrive at least 30 minutes before the ceremony time</li>
          <li>Dress code: [Dress Code Details]</li>
          <li>Maximum number of guests allowed: [Number]</li>
        </ul>

        <p>If you need any clarification or have questions, please contact us:</p>
        <p>📞 Phone: [Your Phone Number]<br>
           📧 Email: [Your Email]</p>

        <p style="text-align: center; margin-top: 30px; color: #6B21A8;">
          Thank you for choosing our services. We look forward to hosting your ceremony.
        </p>
      </div>
    `
  }),

  studentAwardRequest: (userName, date) => ({
    subject: 'Student Award Registration Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9333EA; text-align: center;">Thank you for your Student Award Registration!</h2>
        <p>Dear ${userName},</p>
        <p>We have received your registration for the Student Award. Our team will review your application and notify you soon.</p>
        <p>Please note that this is a special recognition for academic excellence.</p>
      </div>
    `
  }),

  studentAwardApproved: (userName, date) => ({
    subject: 'Student Award Application Approved',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9333EA; text-align: center;">Student Award Application Approved</h2>
        <p>Dear ${userName},</p>
        <p>We are pleased to inform you that your Student Award application has been approved.</p>
        
        <div style="background-color: #F3E8FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #7E22CE; margin-top: 0;">Important Information</h3>
          <p><strong>Award Ceremony Details:</strong></p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li>📅 Date: ${date}</li>
            <li>📍 Venue: Wadi (Samaj) Hall</li>
            <li>⏰ Reporting Time: 10:00 AM</li>
          </ul>
        </div>

        <p><strong>Required Documents:</strong></p>
        <ul>
          <li>Original marksheet</li>
          <li>School ID card</li>
          <li>Any additional documents submitted during registration</li>
        </ul>

        <p>If you need any clarification or have questions, please contact us:</p>
        <p>📞 Phone: [Your Phone Number]<br>
           📧 Email: [Your Email]</p>
      </div>
    `
  }),

  studentAwardRejected: (userName, date, reason) => ({
    subject: 'Student Award Application Rejected',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9333EA; text-align: center;">Student Award Application Status Update</h2>
        <p>Dear ${userName},</p>
        <p>Unfortunately, your Student Award application has been rejected.</p>
        <p>Reason: ${reason || 'Not provided'}</p>
        <p>Please contact us for more information.</p>
      </div>
    `
  })
};

const sendEmail = async (to, template, data) => {
  try {
    // Validate recipient email
    if (!to) {
      console.error('No recipient email provided');
      return null;
    }

    // Validate template exists
    if (!emailTemplates[template]) {
      console.error(`Email template '${template}' not found`);
      return null;
    }

    // Validate required data
    if (!data || !data.name) {
      console.error('Required email data missing');
      return null;
    }

    const emailContent = emailTemplates[template](data.name, data.date, data.reason);
    
    // Log email attempt
    console.log('Attempting to send email:', {
      to,
      template,
      subject: emailContent.subject
    });

    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    });

    console.log(`Email sent successfully: ${template}`, result);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    // Don't throw the error, just return null
    return null;
  }
};

module.exports = { sendEmail }; 