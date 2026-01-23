const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  sendInvitation,
  acceptInvitation,
  rejectInvitation,
  getMyInvitations
} = require('../controllers/teamInvitations');

const router = express.Router();

router.use(protect, authorize('Producer', 'ProductionTeam', 'Admin'));

router.post('/send', sendInvitation);
router.post('/accept', acceptInvitation);
router.post('/reject', rejectInvitation);
router.get('/pending', getMyInvitations);

module.exports = router;
