const mongoose = require('mongoose');

const PendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Actor', 'Producer', 'Admin'], default: 'Actor' },
  phone: { type: String },
  location: { type: String },
  age: { type: Number },
  gender: { type: String },
  experienceLevel: { type: String },
  bio: { type: String },
  profileImage: { type: String },
  companyName: { type: String },
  website: { type: String },
  otp: { type: String, required: true },
  expireAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// TTL index to auto-remove pending registrations after expiration
PendingUserSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingUser', PendingUserSchema);
