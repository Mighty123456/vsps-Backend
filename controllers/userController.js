const User = require('../models/User');

const userController = {
  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .select('-password -passwordHistory -verificationToken -resetPasswordToken -otp');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { username, phone, company, address } = req.body;
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update fields if provided
      if (username) user.username = username;
      if (phone) user.phone = phone;
      if (company) user.company = company;
      if (address) user.address = address;

      await user.save();

      const updatedUser = await User.findById(req.user.id)
        .select('-password -passwordHistory -verificationToken -resetPasswordToken -otp');

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update password
  updatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password update error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update notifications
  updateNotifications: async (req, res) => {
    try {
      const { notifications } = req.body;
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.notifications = notifications;
      await user.save();

      res.json({
        message: 'Notifications updated successfully',
        notifications: user.notifications
      });
    } catch (error) {
      console.error('Notifications update error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update profile image
  updateProfileImage: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      // Convert the file to base64 for storage
      const base64Image = req.file.buffer.toString('base64');
      const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      console.log('Image mime type:', req.file.mimetype); // Debug log
      console.log('Base64 image length:', base64Image.length); // Debug log

      // Update the user's profile image
      await user.updateProfileImage(imageUrl);

      // Get the updated image URL
      const updatedImageUrl = user.getProfileImageUrl();
      console.log('Updated image URL:', updatedImageUrl); // Debug log

      res.json({
        message: 'Profile image updated successfully',
        profileImage: updatedImageUrl
      });
    } catch (error) {
      console.error('Profile image update error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Remove profile image
  removeProfileImage: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await user.removeProfileImage();

      res.json({
        message: 'Profile image removed successfully',
        profileImage: user.getProfileImageUrl()
      });
    } catch (error) {
      console.error('Profile image removal error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      // Only allow admins to fetch all users
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
      }
  
      const users = await User.find({})
        .select('-password -passwordHistory -verificationToken -resetPasswordToken -otp');
      
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
      }

      const userId = req.params.id;
      
      if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (userId === req.user.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      await User.findByIdAndDelete(userId);
      res.json({ 
        message: 'User deleted successfully',
        deletedUserId: userId 
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    }
  },

  // Update user (admin)
  updateUser: async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
      }

      const userId = req.params.id;
      
      if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }

      const { username, email, role, isVerified } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required' });
      }

      if (role && !['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
      }

      user.username = username;
      user.email = email;
      if (role) user.role = role;
      if (typeof isVerified === 'boolean') user.isVerified = isVerified;

      await user.save();

      const updatedUser = await User.findById(userId)
        .select('-password -passwordHistory -verificationToken -resetPasswordToken -otp');

      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Server error',
        error: error.message 
      });
    }
  }
};

module.exports = userController; 