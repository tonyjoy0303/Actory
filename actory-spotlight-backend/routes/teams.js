const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createTeam,
  getMyTeams,
  getTeamById,
  removeMember,
  leaveTeam,
  updateTeam,
  deleteTeam
} = require('../controllers/teams');

const router = express.Router();

router.use(protect, authorize('Producer', 'ProductionTeam', 'Admin'));

router.post('/', createTeam);
router.get('/', getMyTeams);
router.get('/:id', getTeamById);
router.delete('/:id/members/:memberId', removeMember);
router.post('/:id/leave', leaveTeam);
router.put('/:id', updateTeam);
router.delete('/:id', deleteTeam);

module.exports = router;
