const express = require('express');
const {
  getVideos,
  addVideo,
  getMyVideos,
  updateStatus,
  deleteVideo,
  getMyProfileVideos,
  uploadProfileVideo,
  deleteProfileVideo
} = require('../controllers/videos');

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router({ mergeParams: true });

// ==============================
// Profile Videos
// ==============================

// @route   GET /api/v1/videos/profile
// @desc    Get current user's profile videos
// @access  Private (Actor)
router.get('/profile', protect, authorize('Actor'), getMyProfileVideos);

// @route   POST /api/v1/profile/videos
// @desc    Upload a profile video
// @access  Private (Actor)
router.post('/profile/videos',
  protect,
  authorize('Actor'),
  upload.single('video'),
  uploadProfileVideo
);

// @route   DELETE /api/v1/videos/profile/videos/:id
// @desc    Delete a profile video
// @access  Private (Actor)
router.delete('/profile/videos/:id', protect, authorize('Actor'), deleteProfileVideo);

// ==============================
// Audition Videos
// ==============================

// @route   GET /api/v1/videos/mine
// @desc    Get current user's audition submissions
// @access  Private (Actor)
router.get('/mine', protect, authorize('Actor'), getMyVideos);

// @route   PATCH /api/v1/videos/:id/status
// @desc    Update submission status (Accept/Reject)
// @access  Private (Producer)
router.patch('/:id/status', protect, authorize('Producer'), updateStatus);

// @route   DELETE /api/v1/videos/:id
// @desc    Delete a video
// @access  Private (Video owner or Admin)
router.delete('/:id', protect, authorize('Actor', 'Admin'), deleteVideo);

// ==============================
// Casting Call Videos
// ==============================

// @route   GET /api/v1/videos
// @desc    Get all videos for a casting call
// @access  Private (Producer of the call only)
router.get('/', 
  protect, 
  authorize('Producer'), 
  getVideos
);

// @route   POST /api/v1/videos
// @desc    Submit a video for a casting call
// @access  Private (Actor)
router.post('/',
  protect,
  authorize('Actor'),
  upload.single('video'),
  addVideo
);

module.exports = router;