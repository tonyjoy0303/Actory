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
    required: true,
  },
  // Added physical attributes
  height: {
    type: Number,
    required: [true, 'Please provide your height (in cm)'],
    min: [50, 'Height seems too low'],
    max: [300, 'Height seems too high'],
  },
  weight: {
    type: Number,
    required: [true, 'Please provide your weight (in kg)'],
    min: [10, 'Weight seems too low'],
    max: [500, 'Weight seems too high'],
  },
  age: {
    type: Number,
    required: [true, 'Please provide your age'],
    min: [1, 'Age seems too low'],
    max: [120, 'Age seems too high'],
  },
  skintone: {
    type: String,
    required: [true, 'Please provide your skintone'],
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