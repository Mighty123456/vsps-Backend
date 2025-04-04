const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send OTP email
const sendOTPEmail = async (email, otp, type = 'registration') => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let subject, heading;
  if (type === 'registration') {
    subject = 'Email Verification OTP';
    heading = 'Verify Your Email';
  } else {
    subject = 'Password Reset OTP';
    heading = 'Reset Your Password';
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6B46C1; text-align: center;">${heading}</h2>
        <p style="text-align: center; color: #4B5563;">Your ${type === 'registration' ? 'verification' : 'reset'} OTP is:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h1 style="letter-spacing: 8px; font-size: 32px; margin: 0; color: #4B5563;">${otp}</h1>
        </div>
        <p style="color: #4B5563; text-align: center;">This OTP will expire in 10 minutes.</p>
        ${type === 'registration' 
          ? '<p style="color: #6B7280; text-align: center; font-size: 14px;">Please use this OTP to verify your email address.</p>'
          : '<p style="color: #6B7280; text-align: center; font-size: 14px;">If you did not request this password reset, please ignore this email.</p>'
        }
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Registration controller
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user = new User({
      username,
      email,
      password,
      otp: {
        code: otp,
        expiresAt: otpExpiry
      }
    });

    await user.save();

    // Send OTP email with type 'registration'
    await sendOTPEmail(email, otp, 'registration');

    res.status(201).json({ 
      msg: 'Registration successful. Please verify your email with OTP',
      email: email
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Verify OTP controller
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    console.log('Verifying OTP:', { email, otp }); // Debug log

    const user = await User.findOne({
      email,
      'otp.code': otp,
      'otp.expiresAt': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.status(200).json({ msg: 'Email verified successfully' });
  } catch (err) {
    console.error('OTP Verification Error:', err);
    res.status(500).json({ msg: 'Failed to verify OTP' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Login attempt for email:', email); // Debug log

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email); // Debug log
      return res.status(400).json({ msg: 'User not found' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      console.log('User not verified:', email); // Debug log
      return res.status(400).json({ msg: 'Please verify your email to login' });
    }

    // Debug: Manually verify the password
    const isMatchManual = await bcrypt.compare(password, user.password);
    console.log('Manual password match:', isMatchManual); // Debug log

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Invalid password for email:', email); // Debug log
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    console.log('Login successful for email:', email); // Debug log
    res.status(200).json({ token, role: user.role });
  } catch (err) {
    console.error('Error during login:', err); // Debug log
    res.status(500).json({ msg: 'Server error' });
  }
};

// Forgot Password controller
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user
    user.otp = {
      code: otp,
      expiresAt: otpExpiry
    };
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.status(200).json({ 
      msg: 'OTP sent successfully',
      email: email
    });
  } catch (err) {
    console.error('Error in forgotPassword:', err);
    res.status(500).json({ msg: 'Failed to send OTP' });
  }
};

// Resend OTP controller
exports.resendOTP = async (req, res) => {
  const { email, type = 'email' } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user's OTP
    user.otp = {
      code: otp,
      expiresAt: otpExpiry
    };
    await user.save();

    // Send new OTP email
    await sendOTPEmail(email, otp, type);

    res.status(200).json({ 
      msg: 'OTP resent successfully',
      email: email
    });
  } catch (err) {
    console.error('Resend OTP Error:', err);
    res.status(500).json({ msg: 'Failed to resend OTP' });
  }
};

// Verify Reset Password OTP
exports.verifyResetOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({
      email,
      'otp.code': otp,
      'otp.expiresAt': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Clear OTP after successful verification
    user.otp = undefined;
    await user.save();

    res.status(200).json({ 
      msg: 'OTP verified successfully',
      token: resetToken 
    });
  } catch (err) {
    console.error('Reset OTP Verification Error:', err);
    res.status(500).json({ msg: 'Failed to verify OTP' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ msg: 'Invalid reset token' });
    }

    // Update password
    user.password = password;
    await user.save();

    res.status(200).json({ msg: 'Password reset successful' });
  } catch (err) {
    console.error('Password Reset Error:', err);
    res.status(500).json({ msg: 'Failed to reset password' });
  }
};