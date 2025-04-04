// server/controllers/bookingController.js
const Booking = require('../models/Booking');
const { sendEmail } = require('../utils/emailService');

// Submit a new booking request
exports.submitBookingRequest = async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();

    // Send confirmation email
    await sendEmail(booking.email, 'bookingRequest', {
      name: booking.name,
      date: booking.date.toLocaleDateString()
    });

    res.status(201).json({ message: 'Booking request submitted successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting booking request', error: error.message });
  }
};

// Approve a booking
exports.approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    // Find and update the booking status to 'Approved'
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'Approved' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Send approval email with payment details
    try {
      await sendEmail(booking.email, 'bookingApproved', {
        name: booking.name,
        date: booking.date.toLocaleDateString()
      });
      console.log('Booking Confirmation Email sent successfully');
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    res.status(200).json({
      message: 'Booking approved successfully',
      booking
    });

  } catch (error) {
    console.error('Error in approveBooking:', error);
    res.status(500).json({
      message: 'Error approving booking',
      error: error.message
    });
  }
};

// Reject a booking
exports.rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rejectionReason } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'Rejected', rejectionReason },
      { new: true }
    );

    // Send rejection email
    await sendEmail(booking.email, 'bookingRejected', {
      name: booking.name,
      date: booking.date.toLocaleDateString(),
      reason: rejectionReason
    });

    res.status(200).json({ message: 'Booking rejected successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting booking', error: error.message });
  }
};

// Confirm payment for a booking
exports.confirmPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'Booked',
        paymentStatus: 'Completed'
      },
      { new: true }
    );

    // Generate receipt URL (implement your receipt generation logic)
    const receiptUrl = `${process.env.RECEIPT_URL}/${bookingId}`;

    // Send payment confirmation email
    await sendEmail(booking.email, 'paymentSuccess', {
      name: booking.name,
      date: booking.date.toLocaleDateString(),
      receiptUrl
    });

    res.status(200).json({ message: 'Payment confirmed successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming payment', error: error.message });
  }
};

// Fetch all bookings (for admin panel)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    console.log('getUserBookings called for user:', req.user.email);
    
    const bookings = await Booking.find({ email: req.user.email })
      .sort({ createdAt: -1 })
      .select('-__v');
    
    console.log(`Found ${bookings.length} bookings for user ${req.user.email}`);
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    res.status(500).json({ message: 'Error fetching user bookings', error: error.message });
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      _id: req.params.id,
      email: req.user.email
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'Pending' && booking.status !== 'Approved') {
      return res.status(400).json({ 
        message: 'Only pending or approved bookings can be cancelled' 
      });
    }

    booking.status = 'Cancelled';
    await booking.save();

    // Send cancellation email
    await sendEmail(booking.email, 'bookingCancelled', {
      name: booking.name,
      date: booking.date.toLocaleDateString()
    });

    res.status(200).json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking', error: error.message });
  }
};

// Update document upload controller
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Create the full URL for the uploaded document
    const documentUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    // Ensure the URL is properly formatted
    const formattedUrl = documentUrl.replace(/\/+/g, '/');
    
    // Determine document type based on filename or content
    let documentType = 'Other';
    const filename = req.file.originalname.toLowerCase();
    
    if (filename.includes('aadhar') || filename.includes('aadhaar')) {
      documentType = 'Aadhar Card';
    } else if (filename.includes('pan')) {
      documentType = 'PAN Card';
    } else if (filename.includes('passport')) {
      documentType = 'Passport';
    } else if (filename.includes('invitation') || filename.includes('announcement')) {
      documentType = 'Event Invitation';
    } else if (filename.includes('letterhead') || filename.includes('organization')) {
      documentType = 'Organization Letterhead';
    } else if (filename.includes('birth')) {
      documentType = 'Birth Certificate';
    } else if (filename.includes('marriage')) {
      documentType = 'Marriage Certificate';
    }
    
    res.status(200).json({ 
      message: 'Document uploaded successfully',
      documentUrl: formattedUrl,
      documentType: documentType
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ 
      message: 'Error uploading document', 
      error: error.message 
    });
  }
};

// Add or update the updateBooking controller method
exports.updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updateData = req.body;

    // Validate the data
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    if (updateData.guestCount) {
      updateData.guestCount = parseInt(updateData.guestCount);
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      message: 'Error updating booking',
      error: error.message
    });
  }
};

// Confirm booking
exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'Booked' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Send confirmation email to user
    try {
      await sendEmail(booking.email, 'bookingConfirmed', {
        name: booking.name,
        date: booking.date.toLocaleDateString()
      });
      console.log('Booking confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.status(200).json({
      message: 'Booking confirmed successfully and confirmation email sent',
      booking
    });

  } catch (error) {
    console.error('Error in confirmBooking:', error);
    res.status(500).json({
      message: 'Error confirming booking',
      error: error.message
    });
  }
};