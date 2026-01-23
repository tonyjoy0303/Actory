const Notification = require('../models/Notification');

let emitFn = null;

const serialize = (notification) => {
  if (!notification) return null;
  const obj = notification.toObject({ getters: true, virtuals: false });
  delete obj.__v;
  return obj;
};

function setNotificationEmitter(fn) {
  emitFn = fn;
}

async function createNotification(payload) {
  const notification = await Notification.create(payload);
  const clientPayload = serialize(notification);
  if (emitFn && clientPayload) {
    emitFn(String(notification.user), clientPayload);
  }
  return notification;
}

async function markAsRead(userId, notificationId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
}

async function markAllAsRead(userId) {
  console.log(`[DEBUG] markAllAsRead - UserID: ${userId}`);
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  console.log(`[DEBUG] markAllAsRead Result:`, result);
  return result;
}

module.exports = {
  setNotificationEmitter,
  createNotification,
  markAsRead,
  markAllAsRead
};
