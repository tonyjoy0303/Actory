const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PendingUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name must be at most 50 characters']
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
  role: {
    type: String,
    enum: ['Actor', 'Producer', 'Admin'],
    default: 'Actor'
  },
  phone: {
    type: String,
    required: false
  },
  location: {
    type: String,
    required: false
  },
  // Actor-specific
  age: { type: Number, min: 1, max: 120 },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
  experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'experienced', 'professional'] },
  bio: { type: String, maxlength: 500 },
  profileImage: { type: String },
  // Producer-specific
  companyName: { type: String },
  website: { type: String },
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
    // Auto-delete after 5 minutes if not verified
    expires: 300
  }
});

// Encrypt password before saving
PendingUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('PendingUser', PendingUserSchema);
