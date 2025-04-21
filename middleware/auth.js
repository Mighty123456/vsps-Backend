const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  try {
    console.log('Checking admin auth...');
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);
    
    if (!decoded.role) {
      console.log('No role found in token');
      return res.status(403).json({ message: 'No role found in token' });
    }
    
    if (decoded.role !== 'admin') {
      console.log('User is not an admin, role:', decoded.role);
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    req.user = decoded;
    console.log('Admin auth successful');
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: error.stack 
    });
  }
};

// New middleware for regular user authentication
const userAuth = (req, res, next) => {
  try {
    console.log('Checking user auth...');
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', decoded);
    
    if (!decoded.role) {
      console.log('No role found in token');
      return res.status(403).json({ message: 'No role found in token' });
    }
    
    // Allow both regular users and admins
    if (decoded.role !== 'user' && decoded.role !== 'admin') {
      console.log('User has invalid role, role:', decoded.role);
      return res.status(403).json({ message: 'Access denied. Invalid user role.' });
    }

    req.user = decoded;
    console.log('User auth successful');
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: error.stack 
    });
  }
};

module.exports = { adminAuth, userAuth }; 