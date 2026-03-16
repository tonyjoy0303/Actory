/**
 * 🤖 Casting Submissions Controller  
 * Handles submission retrieval, AI analysis, and re-analysis
 */

const Video = require('../models/Video');
const CastingCall = require('../models/CastingCall');
const ProductionTeam = require('../models/ProductionTeam');
const {
  safeAnalyzeVideo,
  validateVideoFile,
  validateEmotion,
} = require('../utils/aiServiceClient');

// Simple console-based logger
const logger = {
  info: (msg) => console.log(`[SUBMISSIONS] ${msg}`),
  error: (msg) => console.error(`[SUBMISSIONS ERROR] ${msg}`),
  warn: (msg) => console.warn(`[SUBMISSIONS WARN] ${msg}`),
};

/**
 * Helper: Check if user is authorized for casting (write access)
 * @param {Object} castingCall - Casting document
 * @param {string} userId - User ID
 * @returns {boolean} - True if authorized
 */
async function isAuthorizedForCasting(castingCall, userId) {
  const requesterId = String(userId);

  // Producer always allowed
  if (castingCall.producer && castingCall.producer.toString() === requesterId) {
    return true;
  }

  // If no team, only producer could authorize
  if (!castingCall.team) {
    return false;
  }

  const team = await ProductionTeam.findById(castingCall.team);
  if (!team) {
    return false;
  }

  const isOwner = team.owner && team.owner.toString() === requesterId;
  const member = team.members.find(m => m.user && m.user.toString() === requesterId);

  // Owner or non-Viewer members have write access
  return isOwner || (member && member.role !== 'Viewer');
}

/**
 * @desc    Get all submissions for a casting call
 * @route   GET /api/v1/castings/:castingId/submissions
 * @access  Private (Producer, Team Members)
 * 
 * @query   sort - Sort by field (e.g., 'overallScore')
 * @query   filter - Filter by emotion match percentage
 * 
 * Returns: Array of submissions sorted by overallScore (descending)
 */
const getSubmissions = async (req, res, next) => {
  try {
    const { castingId } = req.params;
    const { sort = 'overallScore', filter } = req.query;

    // Validate casting exists
    const casting = await CastingCall.findById(castingId);
    if (!casting) {
      return res.status(404).json({
        success: false,
        message: 'Casting call not found',
      });
    }

    // Check authorization
    const authorized = await isAuthorizedForCasting(casting, req.user._id);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these submissions',
      });
    }

    logger.info(`Fetching submissions for casting ${castingId}`);

    // Build query to get all submissions for this casting
    let query = Video.find({ castingCall: castingId, type: 'audition' })
      .populate('actor', 'name email gender profileImage')
      .select(
        'actor videoUrl castingCall status aiAnalysis qualityAssessment createdAt portfolioUrl idProofUrl webcamPhotoUrl skills age height weight phoneNumber email permanentAddress livingCity dateOfBirth'
      )
      .lean();

    // Apply sorting
    if (sort === 'overallScore') {
      query = query.sort({ 'aiAnalysis.overallPerformanceScore': -1, 'aiAnalysis.overallScore': -1 });
    } else if (sort === 'newest') {
      query = query.sort({ createdAt: -1 });
    } else if (sort === 'oldest') {
      query = query.sort({ createdAt: 1 });
    }

    const submissions = await query.exec();

    // Apply filtering if provided
    let filtered = submissions;
    if (filter) {
      const minScore = parseInt(filter, 10);
      filtered = submissions.filter(
        s => (s.aiAnalysis?.overallPerformanceScore ?? s.aiAnalysis?.overallScore ?? 0) >= minScore
      );
    }

    logger.info(`Found ${filtered.length} submissions for casting ${castingId}`);

    // Format response
    const formattedSubmissions = filtered.map(submission => ({
      _id: submission._id,
      actor: submission.actor,
      videoUrl: submission.videoUrl,
      status: submission.status,
      createdAt: submission.createdAt,
      // Personal Details
      age: submission.age,
      height: submission.height,
      weight: submission.weight,
      skills: submission.skills,
      phoneNumber: submission.phoneNumber,
      email: submission.email,
      permanentAddress: submission.permanentAddress,
      livingCity: submission.livingCity,
      dateOfBirth: submission.dateOfBirth,
      // Media Files
      portfolioUrl: submission.portfolioUrl,
      idProofUrl: submission.idProofUrl,
      webcamPhotoUrl: submission.webcamPhotoUrl,
      // AI Analysis fields
      aiAnalyzed: submission.aiAnalysis?.analyzed || false,
      analyzedAt: submission.aiAnalysis?.analyzedAt,
      requiredEmotion: submission.aiAnalysis?.requiredEmotion || casting.requiredEmotion,
      detectedEmotion: submission.aiAnalysis?.detectedEmotion,
      emotionScores: submission.aiAnalysis?.emotionScores || null,
      emotionMatchScore: submission.aiAnalysis?.emotionMatchScore || 0,
      emotionConsistency: submission.aiAnalysis?.emotionConsistency || 0,
      expressionIntensity: submission.aiAnalysis?.expressionIntensity || 0,
      faceVisibility: submission.aiAnalysis?.faceVisibility || 0,
      overallPerformanceScore: submission.aiAnalysis?.overallPerformanceScore || 0,
      emotionTimeline: submission.aiAnalysis?.emotionTimeline || [],
      confidence: submission.aiAnalysis?.confidence || 0,
      overallScore: submission.aiAnalysis?.overallPerformanceScore || submission.aiAnalysis?.overallScore || 0,
      feedback: submission.aiAnalysis?.feedback,
      framesAnalyzed: submission.aiAnalysis?.framesAnalyzed || 0,
      faceEmotion: submission.aiAnalysis?.faceEmotion || submission.aiAnalysis?.detectedEmotion || null,
      voiceEmotion: submission.aiAnalysis?.voiceEmotion || 'neutral',
      faceConfidence: submission.aiAnalysis?.faceConfidence || 0,
      voiceConfidence: submission.aiAnalysis?.voiceConfidence || 0,
      combinedEmotionConfidence: submission.aiAnalysis?.combinedEmotionConfidence || 0,
      // Quality assessment
      qualityScore: submission.qualityAssessment?.score || 0,
    }));

    res.status(200).json({
      success: true,
      count: formattedSubmissions.length,
      data: formattedSubmissions,
    });
  } catch (error) {
    logger.error(`Error fetching submissions: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Error fetching submissions: ${error.message}`,
    });
  }
};

/**
 * @desc    Re-analyze a single submission
 * @route   POST /api/v1/auditions/:auditionId/reanalyze
 * @access  Private (Producer, Team Members)
 * 
 * Re-runs the AI analysis and updates the audition document
 */
const reanalyzeSubmission = async (req, res, next) => {
  try {
    const { auditionId } = req.params;

    // Find the audition/video
    const audition = await Video.findById(auditionId);
    if (!audition) {
      return res.status(404).json({
        success: false,
        message: 'Audition not found',
      });
    }

    // Find associated casting
    const casting = await CastingCall.findById(audition.castingCall);
    if (!casting) {
      return res.status(404).json({
        success: false,
        message: 'Associated casting call not found',
      });
    }

    // Check authorization
    const authorized = await isAuthorizedForCasting(casting, req.user._id);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to re-analyze this submission',
      });
    }

    // Validate video file
    if (!audition.videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Video URL not found for this audition',
      });
    }

    logger.info(`Re-analyzing audition ${auditionId}`);

    // Run AI analysis
    const analysisResult = await safeAnalyzeVideo(
      audition.videoUrl,
      casting.requiredEmotion || 'neutral'
    );
    const analysisData = analysisResult.data || analysisResult;

    if (!analysisResult.success) {
      logger.error(`Analysis failed: ${analysisResult.error}`);
      // Update audition with error
      audition.aiAnalysis = {
        ...audition.aiAnalysis,
        analyzed: false,
        error: analysisResult.error,
        analyzedAt: new Date(),
      };
      await audition.save();

      return res.status(500).json({
        success: false,
        message: 'Analysis failed: ' + analysisResult.error,
      });
    }

    // Update audition with AI results
    audition.aiAnalysis = {
      analyzed: true,
      requiredEmotion: analysisData.requiredEmotion,
      detectedEmotion: analysisData.detectedEmotion,
      emotionScores: analysisData.emotionScores,
      emotionMatchScore: analysisData.emotionMatchScore,
      emotionConsistency: analysisData.emotionConsistency || 0,
      expressionIntensity: analysisData.expressionIntensity || 0,
      faceVisibility: analysisData.faceVisibility || 0,
      overallPerformanceScore: analysisData.overallPerformanceScore || 0,
      emotionTimeline: analysisData.emotionTimeline || [],
      confidence: analysisData.confidence || analysisData.combinedEmotionConfidence || 0,
      overallScore: analysisData.overallPerformanceScore || analysisData.overallScore || analysisData.emotionMatchScore || 0,
      feedback: analysisData.feedback,
      framesAnalyzed: analysisData.framesAnalyzed || 0,
      faceEmotion: analysisData.faceEmotion || analysisData.detectedEmotion || null,
      voiceEmotion: analysisData.voiceEmotion || 'neutral',
      faceConfidence: analysisData.faceConfidence || 0,
      voiceConfidence: analysisData.voiceConfidence || 0,
      combinedEmotionConfidence: analysisData.combinedEmotionConfidence || 0,
      analyzedAt: new Date(),
      error: null,
    };

    await audition.save();

    logger.info(`Audition ${auditionId} re-analyzed successfully`);

    res.status(200).json({
      success: true,
      message: 'Audition re-analyzed successfully',
      data: {
        _id: audition._id,
        aiAnalysis: audition.aiAnalysis,
      },
    });
  } catch (error) {
    logger.error(`Error re-analyzing submission: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Error re-analyzing submission: ${error.message}`,
    });
  }
};

/**
 * @desc    Get submission details with full AI analysis
 * @route   GET /api/v1/auditions/:auditionId
 * @access  Private (Producer, Team Members)
 */
const getSubmissionDetails = async (req, res, next) => {
  try {
    const { auditionId } = req.params;

    const audition = await Video.findById(auditionId)
      .populate('actor', 'name email gender profileImage')
      .populate('castingCall', 'roleTitle description requiredEmotion');

    if (!audition) {
      return res.status(404).json({
        success: false,
        message: 'Audition not found',
      });
    }

    // Check authorization
    const authorized = await isAuthorizedForCasting(audition.castingCall, req.user._id);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this audition',
      });
    }

    res.status(200).json({
      success: true,
      data: audition,
    });
  } catch (error) {
    logger.error(`Error fetching audition details: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Error fetching audition details: ${error.message}`,
    });
  }
};

/**
 * @desc    Update submission status (accept/reject)
 * @route   PUT /api/v1/submissions/:submissionId/status
 * @access  Private (Producer, Team Members)
 * @body    { status: 'Accepted' | 'Rejected' }
 */
const updateSubmissionStatus = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "Accepted" or "Rejected"',
      });
    }

    // Find submission
    const submission = await Video.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    // Check authorization
    if (!submission.castingCall) {
      return res.status(400).json({
        success: false,
        message: 'This is not an audition submission',
      });
    }

    const casting = await CastingCall.findById(submission.castingCall);
    if (!casting) {
      return res.status(404).json({
        success: false,
        message: 'Casting call not found',
      });
    }

    const authorized = await isAuthorizedForCasting(casting, req.user._id);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this submission',
      });
    }

    // Update status
    submission.status = status;
    await submission.save();

    logger.info(`Submission ${submissionId} status updated to ${status}`);

    res.status(200).json({
      success: true,
      message: `Submission ${status.toLowerCase()}`,
      data: {
        _id: submission._id,
        status: submission.status,
      },
    });
  } catch (error) {
    logger.error(`Error updating submission status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Error updating submission status: ${error.message}`,
    });
  }
};

module.exports = {
  getSubmissions,
  reanalyzeSubmission,
  getSubmissionDetails,
  updateSubmissionStatus,
};
