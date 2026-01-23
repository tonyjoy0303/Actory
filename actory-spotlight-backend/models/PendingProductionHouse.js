const mongoose = require('mongoose');

const PendingProductionHouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a company name'],
    minlength: [2, 'Company name must be at least 2 characters'],
    maxlength: [100, 'Company name must be at most 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
      'Please add a valid email',
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  website: {
    type: String
  },
  // OTP verification
  emailVerificationOTP: {
    type: String,
    required: true
  },
  emailVerificationOTPExpire: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Auto-delete after 10 minutes if not verified
    expires: 600
  }
});

module.exports = mongoose.model('PendingProductionHouse', PendingProductionHouseSchema);
