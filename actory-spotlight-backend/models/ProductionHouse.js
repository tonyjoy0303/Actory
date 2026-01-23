const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ProductionHouseSchema = new mongoose.Schema({
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
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: String,
  emailVerificationOTPExpire: Date,
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        if (!v) return false;
        return /^\+?[0-9\-\s]{7,15}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  website: {
    type: String
  },
  photo: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required']
  },
  bio: {
    type: String,
    maxlength: 500
  },
  // User role
  role: {
    type: String,
    default: 'ProductionTeam',
    enum: ['ProductionTeam']
  },
  // Production house specific fields
  establishedYear: {
    type: Number
  },
  teamSize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+']
  },
  specializations: [{
    type: String
  }],
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },
  
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt before saving
ProductionHouseSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
ProductionHouseSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
ProductionHouseSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Sign JWT and return
ProductionHouseSchema.methods.getSignedJwtToken = function() {
  const jwt = require('jsonwebtoken');
  const jwtSecret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this_in_production';
  const jwtExpire = process.env.JWT_EXPIRE || '30d';
  
  return jwt.sign({ id: this._id, type: 'ProductionHouse' }, jwtSecret, {
    expiresIn: jwtExpire,
  });
};

module.exports = mongoose.model('ProductionHouse', ProductionHouseSchema);
