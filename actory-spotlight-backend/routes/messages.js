const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    console.log('Send message request:', { recipientId, contentLength: content?.length, userId: req.user._id, userIdType: typeof req.user._id });

    if (!recipientId || !content) {
      return res.status(400).json({ success: false, message: 'Recipient and content are required' });
    }

    // Validate recipientId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ success: false, message: 'Invalid recipient ID' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    // Prevent sending message to self
    if (req.user._id.toString() === recipientId) {
      return res.status(400).json({ success: false, message: 'Cannot send message to yourself' });
    }

    // Create conversation ID
    const senderId = req.user._id.toString();
    const recipientIdStr = recipientId;
    const ids = [senderId, recipientIdStr].sort();
    const conversationId = ids.join('_');

    // Create message
    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      content: content.trim(),
      conversationId: conversationId
    });

    console.log('Message created:', message._id);

    // Populate sender and recipient info for response
    try {
      await message.populate('sender', 'name profileImage');
      await message.populate('recipient', 'name profileImage');
    } catch (populateError) {
      console.error('Error populating message:', populateError);
      // Continue without population if it fails
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    // Find all conversations for the user
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { recipient: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', req.user._id] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { lastMessage: '$lastMessage' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$lastMessage.sender'] },
                    { $eq: ['$_id', '$$lastMessage.recipient'] }
                  ]
                }
              }
            },
            {
              $match: {
                $expr: { $ne: ['$_id', req.user._id] }
              }
            }
          ],
          as: 'otherUser'
        }
      },
      {
        $unwind: '$otherUser'
      },
      {
        $project: {
          _id: 0,
          conversationId: '$_id',
          otherUser: {
            _id: '$otherUser._id',
            name: '$otherUser.name',
            profileImage: '$otherUser.profileImage',
            role: '$otherUser.role'
          },
          lastMessage: {
            _id: '$lastMessage._id',
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            isRead: '$lastMessage.isRead'
          },
          unreadCount: 1,
          messageCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/messages/:conversationId
// @desc    Get messages in a conversation
// @access  Private
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify user is part of this conversation
    if (!conversationId.includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        recipient: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Get messages
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name profileImage')
      .populate('recipient', 'name profileImage')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/:messageId/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the recipient
    if (message.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get count of distinct senders with unread messages for user
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const result = await Message.aggregate([
      {
        $match: {
          recipient: req.user._id,
          isRead: false
        }
      },
      {
        $group: {
          _id: '$sender'
        }
      },
      {
        $count: 'count'
      }
    ]);

    const count = result.length > 0 ? result[0].count : 0;

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;