const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Default user email for auth-less mode
const DEFAULT_USER_EMAIL = 'default@ecogram.local';

// Get or create the default user
const getDefaultUser = async () => {
  let user = await User.findOne({ email: DEFAULT_USER_EMAIL });
  if (!user) {
    user = await User.create({
      username: 'Coach',
      email: DEFAULT_USER_EMAIL,
      password: 'default-no-login-required'
    });
    console.log('Default user created for auth-less mode');
  }
  return user;
};

// Protect routes - uses default user when no auth token (auth disabled)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (req.user) {
        return next();
      }
    } catch (error) {
      // Token invalid, fall through to default user
    }
  }

  // No valid token - use default user (auth disabled mode)
  try {
    req.user = await getDefaultUser();
    next();
  } catch (error) {
    console.error('Failed to get default user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Optional authentication - uses default user if no token (auth disabled mode)
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (req.user) {
        return next();
      }
    } catch (error) {
      // Token invalid, fall through to default user
    }
  }

  // Use default user when no valid token
  try {
    req.user = await getDefaultUser();
  } catch (error) {
    req.user = null;
  }
  next();
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

module.exports = { protect, optionalAuth, generateToken };
