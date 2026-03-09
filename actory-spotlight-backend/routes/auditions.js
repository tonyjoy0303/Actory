/**
 * Auditions API Routes
 * 
 * Routes for handling audition submissions with AI emotion analysis
 */

const express = require('express');
const router = express.Router();
const auditionsController = require('../controllers/auditionsController');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/auditions/submit
 * @desc    Submit audition with video (triggers AI analysis)
 * @access  Private (Actor)
 */
router.post('/submit', protect, auditionsController.submitAudition);

/**
 * @route   GET /api/castings/:castingId/submissions
 * @desc    Get all submissions for a casting (recruiter view)
 * @access  Private (Recruiter)
 */
router.get('/castings/:castingId/submissions', protect, auditionsController.getSubmissions);

/**
 * @route   GET /api/auditions/:auditionId
 * @desc    Get single submission details
 * @access  Private
 */
router.get('/:auditionId', protect, auditionsController.getSubmissionDetails);

/**
 * @route   GET /api/ai/health
 * @desc    Check AI service health status
 * @access  Public
 */
router.get('/ai/health', auditionsController.checkAIStatus);

module.exports = router;
