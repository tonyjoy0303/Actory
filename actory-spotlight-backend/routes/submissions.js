/**
 * 🤖 Casting Submissions Routes
 * Routes for viewing and managing audition submissions with AI analysis
 */

const express = require('express');
const {
  getSubmissions,
  reanalyzeSubmission,
  getSubmissionDetails,
  updateSubmissionStatus,
} = require('../controllers/submissions');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/v1/submissions/:castingId/submissions
 * @desc    Get all submissions for a casting with AI analysis
 * @query   sort=overallScore (or 'newest', 'oldest')
 * @query   filter=50 (minimum score to filter)
 * @access  Private (Recruiter/Producer)
 */
router.get('/:castingId/submissions', protect, getSubmissions);

/**
 * @route   GET /api/v1/auditions/:auditionId
 * @desc    Get detailed submission with full AI analysis
 * @access  Private (Recruiter/Producer)
 */
router.get('/audition/:auditionId', protect, getSubmissionDetails);

/**
 * @route   POST /api/v1/auditions/:auditionId/reanalyze
 * @desc    Re-analyze a single audition submission
 * @access  Private (Recruiter/Producer)
 */
router.post('/audition/:auditionId/reanalyze', protect, reanalyzeSubmission);

/**
 * @route   PUT /api/v1/submissions/:submissionId/status
 * @desc    Update submission status (accept/reject)
 * @body    { status: 'Accepted' | 'Rejected' }
 * @access  Private (Recruiter/Producer)
 */
router.put('/:submissionId/status', protect, updateSubmissionStatus);

module.exports = router;
