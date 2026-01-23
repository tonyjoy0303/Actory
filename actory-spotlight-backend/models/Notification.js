const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 140
    },
    message: {
      type: String,
      maxlength: 500
    },
    type: {
      type: String,
      enum: ['invite', 'project', 'audition', 'team', 'system'],
      default: 'system'
    },
    relatedId: {
      type: mongoose.Schema.Types.Mixed
    },
    relatedType: {
      type: String
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
