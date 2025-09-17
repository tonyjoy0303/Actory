const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name must be at most 50 characters'],
    validate: {
      validator: function(v) {
        return /\S/.test(v);
      },
      message: 'Name cannot be blank'
    }
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
      'Please add a valid email',
    ],
  },
  phone: {
    type: String,
    required: false, // Will be conditionally required below using custom validator
    validate: {
      validator: function(v) {
        if (!v) return true; // optional unless role mandates
        // Accepts international formats with + and spaces/dashes
        return /^\+?[0-9\-\s]{7,15}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  role: {
    type: String,
    enum: ['Actor', 'Producer', 'Admin'],
    default: 'Actor',
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false, // Do not return password by default
  },
  // Common optional fields
  photo: { type: String, default: '' },
  location: { type: String },

  // Actor-specific
  age: { type: Number, min: 1, max: 120 },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
  experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'experienced', 'professional'] },
  bio: { type: String, maxlength: 500 },
  profileImage: { type: String },

  // Producer-specific
  companyName: { type: String },
  website: { type: String },

  resetPasswordToken: String,
  resetPasswordExpire: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Conditional required validations by role
UserSchema.path('phone').validate(function(value) {
  if (this.role === 'Actor' || this.role === 'Producer') {
    return !!value; // required for both actor and producer
  }
  return true;
}, 'Phone number is required');

UserSchema.path('location').validate(function(value) {
  if (this.role === 'Actor' || this.role === 'Producer') {
    return !!value; // required for both actor and producer
  }
  return true;
}, 'Location is required');

UserSchema.path('companyName').validate(function(value) {
  if (this.role === 'Producer') {
    return !!value;
  }
  return true;
}, 'Company name is required');

UserSchema.path('age').validate(function(value) {
  if (this.role === 'Actor') {
    return typeof value === 'number' && value >= 1 && value <= 120;
  }
  return true;
}, 'Age is required and must be between 1 and 120');

UserSchema.path('gender').validate(function(value) {
  if (this.role === 'Actor') {
    return !!value;
  }
  return true;
}, 'Gender is required');

UserSchema.path('experienceLevel').validate(function(value) {
  if (this.role === 'Actor') {
    return !!value;
  }
  return true;
}, 'Experience level is required');

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);