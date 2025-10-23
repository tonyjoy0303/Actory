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
  // URL to the actor's portfolio PDF (required for audition submissions)
  portfolioUrl: {
    type: String,
    required: function() { return this.type === 'audition'; },
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
  skills: {
    type: [String],
    required: function() { return this.type === 'audition'; },
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Please add at least one skill',
    },
  },
  permanentAddress: {
    type: String,
    required: function() { return this.type === 'audition'; },
    trim: true,
  },
  livingCity: {
    type: String,
    required: function() { return this.type === 'audition'; },
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: function() { return this.type === 'audition'; },
  },
  phoneNumber: {
    type: String,
    required: function() { return this.type === 'audition'; },
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending',
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Video', VideoSchema);