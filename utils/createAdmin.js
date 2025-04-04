const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const createAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL; // Admin email from .env
  const adminPassword = process.env.ADMIN_PASSWORD; // Admin password from .env

  if (!adminEmail || !adminPassword) {
    console.error('Admin email or password not set in .env');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user without hashing password
    const adminUser = new User({
      username: 'admin',
      email: adminEmail,
      password: adminPassword, // Storing as plain text (Not Recommended)
      isVerified: true,
      role: 'admin',
    });

    // Save admin user to the database
    await adminUser.save();
    console.log('Admin user created successfully without password hashing');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
