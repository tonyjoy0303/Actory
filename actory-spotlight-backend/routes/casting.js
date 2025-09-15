
const express = require('express');
const castingController = require('../controllers/casting');

const router = express.Router({ mergeParams: true });

// Re-route into other resource routers
const videoRouter = require('./videos');

const { protect, authorize } = require('../middleware/auth');

router.use('/:castingCallId/videos', videoRouter);

router
  .route('/')
  .get(castingController.getCastingCalls)
  .post(protect, authorize('Producer'), castingController.createCastingCall);

router
  .route('/:id')
  .get(castingController.getCastingCall)
  .put(protect, authorize('Producer'), castingController.updateCastingCall)
  .delete(protect, authorize('Producer'), castingController.deleteCastingCall);

module.exports = router;