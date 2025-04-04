const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const authMiddleware = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token received:', token.substring(0, 10) + '...');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded, user ID:', decoded.id);

      // Attach user to request object
      req.user = await User.findById(decoded.id).select('-password');
      console.log('User found:', req.user ? req.user.email : 'No user found');

      if (!req.user) {
        console.log('User not found in database');
        return res.status(401).json({ msg: 'User not found' });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ msg: 'Not authorized' });
    }
  }

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied. Admins only.' });
  }
};

module.exports = { authMiddleware, adminMiddleware };


