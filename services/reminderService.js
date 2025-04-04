const cron = require('node-cron');
const Booking = require('../models/Booking');
const { sendEmail } = require('../utils/emailService');

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const bookings = await Booking.find({ status: 'Booked' });
    const now = new Date();

    for (const booking of bookings) {
      const eventDate = new Date(booking.date);
      const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

      // One week reminder
      if (daysUntilEvent === 7 && !booking.remindersSent.oneWeek) {
        await sendEmail(booking.email, 'eventReminder', {
          name: booking.name,
          date: booking.date.toLocaleDateString(),
          eventDetails: `
            Event Type: ${booking.eventType}
            Time: ${booking.startTime} - ${booking.endTime}
            Guest Count: ${booking.guestCount}
          `
        });

        await Booking.findByIdAndUpdate(booking._id, {
          'remindersSent.oneWeek': true
        });
      }

      // One day reminder
      if (daysUntilEvent === 1 && !booking.remindersSent.oneDay) {
        await sendEmail(booking.email, 'eventReminder', {
          name: booking.name,
          date: booking.date.toLocaleDateString(),
          eventDetails: `
            Event Type: ${booking.eventType}
            Time: ${booking.startTime} - ${booking.endTime}
            Guest Count: ${booking.guestCount}
          `
        });

        await Booking.findByIdAndUpdate(booking._id, {
          'remindersSent.oneDay': true
        });
      }
    }
  } catch (error) {
    console.error('Error sending reminders:', error);
  }
}); 