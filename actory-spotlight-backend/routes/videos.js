const express = require('express');
const videosController = require('../controllers/videos');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, authorize('Producer'), videosController.getVideos)
  .post(protect, authorize('Actor'), videosController.addVideo);

router
    .route('/:id')
    .delete(protect, authorize('Actor'), videosController.deleteVideo);

module.exports = router;