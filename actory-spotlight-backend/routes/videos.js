const express = require('express');
const {
  getVideos,
  addVideo,
  getMyVideos,
  updateStatus,
  deleteVideo,
  getMyProfileVideos,
  uploadProfileVideo,
  deleteProfileVideo,
  getPortfolio,
  getPortfolioFile,
  getPublicVideos,
  incrementVideoView,
  toggleVideoLike,
  addVideoComment,
  getVideoComments,
  updateVideoMetrics
} = require('../controllers/videos');

const { protect, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router({ mergeParams: true });

// ==============================
// Public Videos
// ==============================

// @route   GET /api/v1/videos/public
// @desc    Get all public videos for feeds
// @access  Public
router.get('/public', optionalAuth, getPublicVideos);

// @route   PUT /api/v1/videos/:videoId/view
// @desc    Increment video view count
// @access  Public
router.put('/:videoId/view', incrementVideoView);

// @route   PUT /api/v1/videos/:videoId/like
// @desc    Toggle like on video
// @access  Public
router.put('/:videoId/like', toggleVideoLike);

// @route   GET /api/v1/videos/:videoId/comments
// @desc    Get comments for a video
// @access  Public
router.get('/:videoId/comments', getVideoComments);

// @route   POST /api/v1/videos/:videoId/comment
// @desc    Add comment to video
// @access  Public
router.post('/:videoId/comment', addVideoComment);

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

// @route   PUT /api/v1/videos/:id/metrics
// @desc    Update video metrics and recalculate quality
// @access  Private (Producer)
router.put('/:id/metrics', protect, authorize('Producer'), updateVideoMetrics);

// @route   DELETE /api/v1/videos/:id
// @desc    Delete a video
// @access  Private (Video owner or Admin)
router.delete('/:id', protect, authorize('Actor', 'Admin'), deleteVideo);

// @route   GET /api/v1/videos/:id/portfolio
// @desc    Get a viewable portfolio URL (handles authenticated/raw)
// @access  Private (Producer or Admin)
router.get('/:id/portfolio', protect, authorize('Producer', 'Admin'), getPortfolio);

// Stream proxy for portfolio PDF (best for embedded viewers)
// Use standard auth middleware so Authorization header works consistently
// @access  Private (Producer or Admin)
router.get('/:id/portfolio/file', protect, authorize('Producer', 'Admin'), getPortfolioFile);

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
  addVideo
);

module.exports = router;