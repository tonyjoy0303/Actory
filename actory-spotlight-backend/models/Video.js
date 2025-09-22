const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
  },
  videoUrl: {
    type: String,
    required: true,
  },
  cloudinaryId: {
    type: String,
    required: true,
  },
  actor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  castingCall: {
    type: mongoose.Schema.ObjectId,
    ref: 'CastingCall',
    // Make this optional for profile videos
    required: function() { return this.type === 'audition'; },
  },
  // Add type field to distinguish between profile and audition videos
  type: {
    type: String,
    enum: ['profile', 'audition'],
    default: 'audition', // Default to 'audition' for backward compatibility
    required: true,
  },
  // Added physical attributes (only required for auditions)
  height: {
    type: Number,
    required: function() { return this.type === 'audition'; },
    min: [50, 'Height seems too low'],
    max: [300, 'Height seems too high'],
  },
  weight: {
    type: Number,
    required: function() { return this.type === 'audition'; },
    min: [10, 'Weight seems too low'],
    max: [500, 'Weight seems too high'],
  },
  age: {
    type: Number,
    required: function() { return this.type === 'audition'; },
    min: [1, 'Age seems too low'],
    max: [120, 'Age seems too high'],
  },
  skintone: {
    type: String,
    required: function() { return this.type === 'audition'; },
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Video', VideoSchema);