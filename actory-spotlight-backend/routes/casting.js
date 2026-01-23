
const express = require('express');
const castingController = require('../controllers/casting');

const router = express.Router({ mergeParams: true });

// Re-route into other resource routers
const videoRouter = require('./videos');

const { protect, authorize } = require('../middleware/auth');

router.use('/:castingCallId/videos', videoRouter);

// Get all producer casting calls (including past ones)
router.route('/producer')
  .get(protect, authorize('Producer', 'ProductionTeam'), castingController.getProducerCastingCalls);

// Get team casting calls (all castings for team's projects)
router.route('/team/:teamId')
  .get(protect, castingController.getTeamCastingCalls);

router
  .route('/')
  .get(castingController.getCastingCalls)
  .post(protect, authorize('Producer', 'ProductionTeam'), castingController.createCastingCall);

router
  .route('/:id')
  .get(castingController.getCastingCall)
  .put(protect, authorize('Producer', 'ProductionTeam'), castingController.updateCastingCall)
  .delete(protect, authorize('Producer', 'ProductionTeam'), castingController.deleteCastingCall);

module.exports = router;