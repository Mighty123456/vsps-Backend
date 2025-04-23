// server/controllers/bookingController.js
const express = require('express');
const Booking = require('../models/Booking');
const SamuhLagan = require('../models/SamuhLagan');
const StudentAward = require('../models/StudentAward');
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

    // First check if the booking exists
    const existingBooking = await Booking.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update the booking status
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'Rejected', rejectionReason },
      { new: true }
    );

    // Send rejection email - wrap in try-catch to prevent email errors from failing the whole request
    try {
      await sendEmail(booking.email, 'bookingRejected', {
        name: booking.name,
        date: booking.date.toLocaleDateString(),
        reason: rejectionReason
      });
      console.log('Rejection email sent successfully');
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Continue with the response even if email fails
    }

    res.status(200).json({ message: 'Booking rejected successfully', booking });
  } catch (error) {
    console.error('Error in rejectBooking:', error);
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
    // Use the correct base URL for the client
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.BASE_URL || 'http://localhost:3000'
      : 'http://localhost:3000';
    
    // Ensure the baseUrl has the correct protocol
    const formattedBaseUrl = baseUrl.startsWith('http://') || baseUrl.startsWith('https://') 
      ? baseUrl 
      : `http://${baseUrl}`;
    
    const documentUrl = `${formattedBaseUrl}/uploads/${req.file.filename}`;
    
    // Ensure the URL is properly formatted
    const formattedUrl = documentUrl.replace(/\/+/g, '/');
    
    console.log('Document uploaded:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      url: formattedUrl
    });
    
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

// Submit a new Samuh Lagan request
exports.submitSamuhLaganRequest = async (req, res) => {
  try {
    console.log('Received Samuh Lagan request:', {
      body: req.body,
      files: req.files
    });

    // Handle file uploads
    const files = req.files;
    if (!files) {
      console.error('No files received in request');
      return res.status(400).json({ 
        message: 'No files received in request',
        error: 'Files are required'
      });
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.BASE_URL 
      : 'http://localhost:3000';

    // Process bride's files
    const bridePhoto = files.bridePhoto ? files.bridePhoto[0] : null;
    const brideDocuments = files.brideDocuments || [];
    
    // Process groom's files
    const groomPhoto = files.groomPhoto ? files.groomPhoto[0] : null;
    const groomDocuments = files.groomDocuments || [];

    console.log('Processed files:', {
      bridePhoto,
      brideDocuments,
      groomPhoto,
      groomDocuments
    });

    // Create the Samuh Lagan request with file paths
    const samuhLaganData = {
      user: req.body.user,
      bride: {
        name: req.body['bride.name'],
        fatherName: req.body['bride.fatherName'],
        motherName: req.body['bride.motherName'],
        age: parseInt(req.body['bride.age']),
        contactNumber: req.body['bride.contactNumber'],
        email: req.body['bride.email'],
        address: req.body['bride.address'],
        photo: bridePhoto ? `${baseUrl}/uploads/samuh-lagan/${bridePhoto.filename}` : null,
        documents: brideDocuments.map(doc => `${baseUrl}/uploads/samuh-lagan/${doc.filename}`)
      },
      groom: {
        name: req.body['groom.name'],
        fatherName: req.body['groom.fatherName'],
        motherName: req.body['groom.motherName'],
        age: parseInt(req.body['groom.age']),
        contactNumber: req.body['groom.contactNumber'],
        email: req.body['groom.email'],
        address: req.body['groom.address'],
        photo: groomPhoto ? `${baseUrl}/uploads/samuh-lagan/${groomPhoto.filename}` : null,
        documents: groomDocuments.map(doc => `${baseUrl}/uploads/samuh-lagan/${doc.filename}`)
      },
      ceremonyDate: req.body.ceremonyDate
    };

    // Validate required fields before saving
    if (!samuhLaganData.bride.name || !samuhLaganData.bride.fatherName || 
        !samuhLaganData.bride.motherName || !samuhLaganData.bride.age || 
        !samuhLaganData.bride.contactNumber || !samuhLaganData.bride.email || 
        !samuhLaganData.bride.address) {
      return res.status(400).json({
        message: 'Missing required bride details'
      });
    }

    if (!samuhLaganData.groom.name || !samuhLaganData.groom.fatherName || 
        !samuhLaganData.groom.motherName || !samuhLaganData.groom.age || 
        !samuhLaganData.groom.contactNumber || !samuhLaganData.groom.email || 
        !samuhLaganData.groom.address) {
      return res.status(400).json({
        message: 'Missing required groom details'
      });
    }

    console.log('Creating Samuh Lagan with data:', samuhLaganData);

    const samuhLagan = new SamuhLagan(samuhLaganData);
    await samuhLagan.save();

    // Send thank you emails to both bride and groom
    try {
      console.log('Sending thank you emails to:', {
        brideEmail: samuhLaganData.bride.email,
        brideName: samuhLaganData.bride.name,
        groomEmail: samuhLaganData.groom.email,
        groomName: samuhLaganData.groom.name
      });

      // Send email to bride
      if (samuhLaganData.bride.email) {
        console.log(`Sending thank you email to bride: ${samuhLaganData.bride.email}`);
        await sendEmail(samuhLaganData.bride.email, 'samuhLaganRequest', {
          name: samuhLaganData.bride.name,
          date: new Date(samuhLaganData.ceremonyDate).toLocaleDateString()
        });
        console.log(`Successfully sent thank you email to bride: ${samuhLaganData.bride.email}`);
      }

      // Send email to groom
      if (samuhLaganData.groom.email) {
        console.log(`Sending thank you email to groom: ${samuhLaganData.groom.email}`);
        await sendEmail(samuhLaganData.groom.email, 'samuhLaganRequest', {
          name: samuhLaganData.groom.name,
          date: new Date(samuhLaganData.ceremonyDate).toLocaleDateString()
        });
        console.log(`Successfully sent thank you email to groom: ${samuhLaganData.groom.email}`);
      }

      console.log('All thank you emails sent successfully');
    } catch (emailError) {
      console.error('Failed to send thank you emails:', emailError);
      // Continue with the response even if email fails
    }

    res.status(201).json({ 
      success: true,
      message: 'Samuh Lagan request submitted successfully', 
      samuhLagan 
    });
  } catch (error) {
    console.error('Error submitting Samuh Lagan request:', error);
    res.status(500).json({ 
      message: 'Error submitting Samuh Lagan request', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all Samuh Lagan requests
exports.getAllSamuhLaganRequests = async (req, res) => {
  try {
    const requests = await SamuhLagan.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Samuh Lagan requests', error: error.message });
  }
};

// Approve a Samuh Lagan request
exports.approveSamuhLaganRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Find the request and populate bride and groom details
    const request = await SamuhLagan.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Update the status
    request.status = 'approved';
    await request.save();

    // Send approval email with payment instructions
    try {
      // Send to both bride and groom
      const recipients = [request.bride.email, request.groom.email].filter(Boolean);
      
      console.log('Sending approval emails to:', {
        brideEmail: request.bride.email,
        brideName: request.bride.name,
        groomEmail: request.groom.email,
        groomName: request.groom.name
      });

      // Send email to bride
      if (request.bride.email) {
        console.log(`Sending approval email to bride: ${request.bride.email}`);
        await sendEmail(request.bride.email, 'samuhLaganApproved', {
          name: request.bride.name,
          date: request.ceremonyDate.toLocaleDateString(),
        });
        console.log(`Successfully sent approval email to bride: ${request.bride.email}`);
      }

      // Send email to groom
      if (request.groom.email) {
        console.log(`Sending approval email to groom: ${request.groom.email}`);
        await sendEmail(request.groom.email, 'samuhLaganApproved', {
          name: request.groom.name,
          date: request.ceremonyDate.toLocaleDateString(),
        });
        console.log(`Successfully sent approval email to groom: ${request.groom.email}`);
      }

      console.log('All approval emails sent successfully');
    } catch (emailError) {
      console.error('Failed to send approval emails:', emailError);
      // Continue with the response even if email fails
    }

    res.status(200).json({ 
      message: 'Request approved successfully and payment instructions sent', 
      request,
      emailsSentTo: [request.bride.email, request.groom.email].filter(Boolean)
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ 
      message: 'Error approving request', 
      error: error.message 
    });
  }
};

// Reject a Samuh Lagan request
exports.rejectSamuhLaganRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;

    const request = await SamuhLagan.findByIdAndUpdate(
      requestId,
      { 
        status: 'rejected',
        rejectionReason 
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Send rejection email
    await sendEmail(request.user.email, 'samuhLaganRejected', {
      name: request.bride.name,
      date: request.ceremonyDate.toLocaleDateString(),
      reason: rejectionReason
    });

    res.status(200).json({ message: 'Request rejected successfully', request });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting request', error: error.message });
  }
};

// Confirm a Samuh Lagan request after payment
exports.confirmSamuhLaganRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Find the request and update status
    const request = await SamuhLagan.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Update both status and payment status
    request.status = 'confirmed';
    request.paymentStatus = 'paid';
    await request.save();

    // Send confirmation emails
    try {
      console.log('Sending confirmation emails to:', {
        brideEmail: request.bride.email,
        brideName: request.bride.name,
        groomEmail: request.groom.email,
        groomName: request.groom.name
      });

      // Send email to bride
      if (request.bride.email) {
        console.log(`Sending confirmation email to bride: ${request.bride.email}`);
        await sendEmail(request.bride.email, 'samuhLaganConfirmed', {
          name: request.bride.name,
          date: request.ceremonyDate.toLocaleDateString()
        });
        console.log(`Successfully sent confirmation email to bride: ${request.bride.email}`);
      }

      // Send email to groom
      if (request.groom.email) {
        console.log(`Sending confirmation email to groom: ${request.groom.email}`);
        await sendEmail(request.groom.email, 'samuhLaganConfirmed', {
          name: request.groom.name,
          date: request.ceremonyDate.toLocaleDateString()
        });
        console.log(`Successfully sent confirmation email to groom: ${request.groom.email}`);
      }

      console.log('All confirmation emails sent successfully');
    } catch (emailError) {
      console.error('Failed to send confirmation emails:', emailError);
      // Continue with the response even if email fails
    }

    res.status(200).json({ 
      message: 'Request confirmed successfully and confirmation emails sent', 
      request,
      emailsSentTo: [request.bride.email, request.groom.email].filter(Boolean)
    });
  } catch (error) {
    console.error('Error confirming request:', error);
    res.status(500).json({ 
      message: 'Error confirming request', 
      error: error.message 
    });
  }
};

// Get a single Samuh Lagan request by ID
exports.getSamuhLaganRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await SamuhLagan.findById(id)
      .populate('user', 'name email');
    
    if (!request) {
      return res.status(404).json({ message: 'Samuh Lagan request not found' });
    }
    
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Samuh Lagan request', error: error.message });
  }
};

// Submit a new Student Award request
exports.submitStudentAwardRequest = async (req, res) => {
  try {
    console.log('Received Student Award request:', {
      body: req.body,
      file: req.file
    });

    // Handle file upload
    if (!req.file) {
      return res.status(400).json({ 
        message: 'Marksheet is required',
        error: 'No file uploaded'
      });
    }

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.BASE_URL 
      : 'http://localhost:3000';

    // Create the Student Award request with file path
    const studentAwardData = {
      user: req.body.user,
      name: req.body.name,
      contactNumber: req.body.contactNumber,
      email: req.body.email,
      address: req.body.address,
      schoolName: req.body.schoolName,
      standard: req.body.standard,
      boardName: req.body.boardName,
      examYear: req.body.examYear,
      totalPercentage: req.body.totalPercentage,
      rank: req.body.rank || 'none',
      marksheet: `${baseUrl}/uploads/student-awards/${req.file.filename}`
    };

    // Validate required fields
    const requiredFields = [
      'name', 'contactNumber', 'email', 'address', 
      'schoolName', 'standard', 'boardName', 
      'examYear', 'totalPercentage'
    ];

    const missingFields = requiredFields.filter(field => !studentAwardData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: missingFields
      });
    }

    // Validate percentage
    const percentage = parseFloat(studentAwardData.totalPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        message: 'Invalid percentage value',
        error: 'Percentage must be between 0 and 100'
      });
    }

    // Validate rank if provided
    if (studentAwardData.rank) {
      // Convert rank to lowercase and remove 'st', 'nd', 'rd' suffixes
      const normalizedRank = studentAwardData.rank.toLowerCase().replace(/(st|nd|rd)$/, '');
      if (!['1', '2', '3', 'none'].includes(normalizedRank)) {
        return res.status(400).json({
          message: 'Invalid rank value',
          error: 'Rank must be 1st, 2nd, 3rd, or none'
        });
      }
      // Convert to the format expected by the model
      studentAwardData.rank = normalizedRank === 'none' ? 'none' : 
        normalizedRank === '1' ? 'first' :
        normalizedRank === '2' ? 'second' :
        'third';
    } else {
      studentAwardData.rank = 'none';
    }

    console.log('Creating Student Award with data:', studentAwardData);

    const studentAward = new StudentAward(studentAwardData);
    await studentAward.save();

    // Send thank you email
    try {
      console.log('Sending thank you email to:', {
        email: studentAwardData.email,
        name: studentAwardData.name
      });

      await sendEmail(studentAwardData.email, 'studentAwardRequest', {
        name: studentAwardData.name,
        date: new Date().toLocaleDateString()
      });

      console.log('Successfully sent thank you email');
    } catch (emailError) {
      console.error('Failed to send thank you email:', emailError);
      // Continue with the response even if email fails
    }

    res.status(201).json({ 
      success: true,
      message: 'Student Award request submitted successfully', 
      studentAward 
    });
  } catch (error) {
    console.error('Error submitting Student Award request:', error);
    res.status(500).json({ 
      message: 'Error submitting Student Award request', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all Student Award requests
exports.getAllStudentAwardRequests = async (req, res) => {
  try {
    console.log('Fetching all student award requests');
    const requests = await StudentAward.find()
      .sort({ createdAt: -1 });
    
    console.log(`Found ${requests.length} student award requests`);
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error in getAllStudentAwardRequests:', error);
    res.status(500).json({ 
      message: 'Error fetching Student Award requests', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get a single Student Award request by ID
exports.getStudentAwardRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching student award request with ID:', id);
    
    const request = await StudentAward.findById(id);
    
    if (!request) {
      console.log('Student award request not found');
      return res.status(404).json({ message: 'Student Award request not found' });
    }
    
    console.log('Found student award request:', request);
    res.status(200).json(request);
  } catch (error) {
    console.error('Error in getStudentAwardRequestById:', error);
    res.status(500).json({ 
      message: 'Error fetching Student Award request', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Approve a Student Award request
exports.approveStudentAwardRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log('Approving student award request with ID:', requestId);
    
    // Find the request first
    const request = await StudentAward.findById(requestId);
    if (!request) {
      console.log('Student award request not found');
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if already approved
    if (request.status === 'approved') {
      console.log('Request already approved');
      return res.status(400).json({ message: 'Request is already approved' });
    }

    // Update the status while preserving all other fields
    const updatedRequest = await StudentAward.findByIdAndUpdate(
      requestId,
      { $set: { status: 'approved' } },
      { new: true, runValidators: true }
    );

    console.log('Student award request approved successfully');

    // Send approval email
    try {
      console.log('Sending approval email to:', {
        email: updatedRequest.email,
        name: updatedRequest.name
      });

      await sendEmail(updatedRequest.email, 'studentAwardApproved', {
        name: updatedRequest.name,
        date: new Date().toLocaleDateString()
      });

      console.log('Successfully sent approval email');
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Continue with the response even if email fails
    }

    res.status(200).json({ 
      success: true,
      message: 'Request approved successfully and approval email sent', 
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error in approveStudentAwardRequest:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error approving request', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Reject a Student Award request
exports.rejectStudentAwardRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;
    console.log('Rejecting student award request with ID:', requestId);

    // Find the request first
    const request = await StudentAward.findById(requestId);
    if (!request) {
      console.log('Student award request not found');
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if already rejected
    if (request.status === 'rejected') {
      console.log('Request already rejected');
      return res.status(400).json({ message: 'Request is already rejected' });
    }

    // Update the status and reason while preserving all other fields
    const updatedRequest = await StudentAward.findByIdAndUpdate(
      requestId,
      { 
        $set: { 
          status: 'rejected',
          rejectionReason 
        }
      },
      { new: true, runValidators: true }
    );

    console.log('Student award request rejected successfully');

    // Send rejection email
    try {
      await sendEmail(updatedRequest.email, 'studentAwardRejected', {
        name: updatedRequest.name,
        date: new Date().toLocaleDateString(),
        reason: rejectionReason
      });
      console.log('Successfully sent rejection email');
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Continue with the response even if email fails
    }

    res.status(200).json({ 
      success: true,
      message: 'Request rejected successfully', 
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error in rejectStudentAwardRequest:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error rejecting request', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};