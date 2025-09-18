const ErrorResponse = require('../utils/errorResponse');

// Middleware to check if user is an admin
const admin = (req, res, next) => {
  // Check if user exists and has admin role
  if (!req.user || req.user.role !== 'Admin') {
    return next(new ErrorResponse('Not authorized to access this route', 403));
  }
  
  // If user is an admin, proceed to the next middleware/route handler
  next();
};

module.exports = admin;