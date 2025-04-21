const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send SMS using Twilio
 * @param {Object} options - SMS options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.message - Message content
 * @returns {Promise} - Twilio message promise
 */
const sendSMS = async ({ to, message }) => {
  try {
    const response = await client.messages.create({
      body: message,
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    return response;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

module.exports = {
  sendSMS
}; 