const express = require('express');
const videosController = require('../controllers/videos');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

// Actor's own submissions
router.get('/mine', protect, authorize('Actor'), videosController.getMyVideos);

// Update submission status (Accept/Reject/Pending)
router.patch('/:id/status', protect, authorize('Producer'), videosController.updateStatus);

router
  .route('/')
  .get(protect, authorize('Producer'), videosController.getVideos)
  .post(protect, authorize('Actor'), videosController.addVideo);

router
    .route('/:id')
    .delete(protect, authorize('Actor'), videosController.deleteVideo);

module.exports = router;