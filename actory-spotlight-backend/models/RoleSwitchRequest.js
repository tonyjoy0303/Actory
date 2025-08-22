const mongoose = require('mongoose');

const RoleSwitchRequestSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason for the role switch request.'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: {
    type: Date,
  },
});

module.exports = mongoose.model('RoleSwitchRequest', RoleSwitchRequestSchema);