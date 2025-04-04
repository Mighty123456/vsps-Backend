// User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  company: String,
  address: String,
  profileImage: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
    lastUpdated: { type: Date },
    default: { type: String, default: '' }
  },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  passwordHistory: [{ type: String }],
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  otp: {
    code: String,
    expiresAt: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const hashedPassword = await bcrypt.hash(this.password, 10);

    // Store previous passwords (limit to last 5)
    if (this.passwordHistory.length >= 5) {
      this.passwordHistory.shift(); // Remove the oldest password
    }
    this.passwordHistory.push(hashedPassword);

    this.password = hashedPassword;
  }
  next();
});

// Method to update profile image
userSchema.methods.updateProfileImage = async function(imageUrl, publicId = '') {
  this.profileImage = {
    url: imageUrl,
    publicId: publicId,
    lastUpdated: new Date(),
    default: this.profileImage.default
  };
  return this.save();
};

// Method to get profile image URL
userSchema.methods.getProfileImageUrl = function() {
  // Add debug logging
  console.log('Profile image URL:', this.profileImage.url);
  return this.profileImage.url || this.profileImage.default || 'https://your-default-avatar-url.com/default.png';
};

// Method to remove profile image
userSchema.methods.removeProfileImage = async function() {
  this.profileImage = {
    url: '',
    publicId: '',
    lastUpdated: new Date(),
    default: this.profileImage.default
  };
  return this.save();
};

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);