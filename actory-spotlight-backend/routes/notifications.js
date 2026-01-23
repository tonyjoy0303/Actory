const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/notifications');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.patch('/mark-all-read', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

module.exports = router;
