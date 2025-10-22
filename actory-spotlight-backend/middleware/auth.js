const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  // Set token from cookie
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Fallback: allow token via query for cases like file streams from iframes or blob fetches
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this_in_production';
    const decoded = jwt.verify(token, jwtSecret);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

// Optional auth - doesn't require authentication but sets user if token is valid
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  // Set token from cookie
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Fallback: allow token via query for cases like file streams from iframes or blob fetches
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  // If no token, continue without setting req.user
  if (!token) {
    return next();
  }

  try {
    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this_in_production';
    const decoded = jwt.verify(token, jwtSecret);

    req.user = await User.findById(decoded.id);

    // Continue even if user not found (token might be invalid)
    next();
  } catch (err) {
    // Continue without setting req.user if token is invalid
    next();
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `User role ${req.user.role} is not authorized to access this route`});
    }
    next();
  };
};