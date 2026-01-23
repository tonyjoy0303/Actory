const Notification = require('../models/Notification');
const {
  markAsRead,
  markAllAsRead
} = require('../utils/notificationService');

// GET /api/v1/notifications
exports.getNotifications = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const page = Math.max(1, Number(req.query.page) || 1);
    const skip = (page - 1) * limit;

    const [data, total, unreadCount] = await Promise.all([
      Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ user: req.user._id }),
      Notification.countDocuments({ user: req.user._id, isRead: false })
    ]);

    // Manually populate TeamInvitation status
    const notificationsWithData = await Promise.all(data.map(async (n) => {
      const doc = n.toObject();
      if (doc.relatedType === 'team-invitation') {
        const TeamInvitation = require('../models/TeamInvitation');
        const invite = await TeamInvitation.findById(doc.relatedId).select('status');
        if (invite) {
          doc.relatedId = invite; // Replace ID with object containing status
        }
      }
      return doc;
    }));

    console.log(`[DEBUG] getNotifications - UserID: ${req.user._id}, Limit: ${limit}, Page: ${page}`);
    console.log(`[DEBUG] Counts - Total: ${total}, Unread: ${unreadCount}`);

    res.json({
      success: true,
      data: notificationsWithData,
      meta: {
        total,
        page,
        limit,
        unreadCount
      }
    });
  } catch (err) {
    console.error('getNotifications error', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// PATCH /api/v1/notifications/:id/read
exports.markNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    console.log(`[DEBUG] MarkRead Request - NotifID: ${notificationId}, UserID: ${userId}`);

    // 1. Find notification without user filter first to check existence
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      console.log(`[DEBUG] Notification ${notificationId} not found in DB`);
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    console.log(`[DEBUG] Found Notification: ${notification._id}, Owner: ${notification.user}`);

    // 2. Check ownership
    if (String(notification.user) !== String(userId)) {
      console.log(`[DEBUG] User mismatch! ReqUser: ${userId} !== NotifOwner: ${notification.user}`);
      return res.status(403).json({ success: false, message: 'Not authorized for this notification' });
    }

    // 3. Update
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    console.log(`[DEBUG] Notification ${notificationId} marked as read successfully`);

    res.json({ success: true, data: notification });
  } catch (err) {
    console.error('markNotificationRead error', err);
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

// PATCH /api/v1/notifications/mark-all-read
exports.markAllNotificationsRead = async (req, res) => {
  try {
    console.log('Marking all notifications read for user:', req.user._id);
    const result = await markAllAsRead(req.user._id);
    console.log('Mark all result:', result);
    res.json({
      success: true,
      data: {
        modified: result.modifiedCount || 0,
        matched: result.matchedCount || 0,
        userId: req.user._id
      }
    });
  } catch (err) {
    console.error('markAllNotificationsRead error', err);
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
};
