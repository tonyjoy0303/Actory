const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  conversationId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Create conversation ID from sorted user IDs to ensure consistency
MessageSchema.pre('save', function(next) {
  try {
    console.log('Pre-save hook triggered:', { sender: this.sender, recipient: this.recipient, conversationId: this.conversationId });
    if (!this.conversationId) {
      if (!this.sender || !this.recipient) {
        console.error('Missing sender or recipient:', { sender: this.sender, recipient: this.recipient });
        return next(new Error('Sender and recipient are required'));
      }

      // Convert to string regardless of type
      const senderId = this.sender.toString();
      const recipientId = this.recipient.toString();

      console.log('Creating conversationId:', { senderId, recipientId });
      const ids = [senderId, recipientId].sort();
      this.conversationId = ids.join('_');
      console.log('ConversationId created:', this.conversationId);
    } else {
      console.log('ConversationId already set:', this.conversationId);
    }
    next();
  } catch (error) {
    console.error('Error in Message pre-save hook:', error);
    next(error);
  }
});

// Index for efficient queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, recipient: 1 });
MessageSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Message', MessageSchema);