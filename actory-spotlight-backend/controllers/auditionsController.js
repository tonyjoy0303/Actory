/**
 * Audition Submissions Controller with AI Analysis
 */

const Audition = require('../models/AuditionWithAI');
const CastingCall = require('../models/CastingCall');
const { safeAnalyzeVideo, checkAIServiceHealth } = require('../utils/aiServiceClient');
const { extractEmotionFromDescription } = require('../utils/emotionExtractor');

/**
 * Submit audition with AI emotion analysis
 * 
 * @route POST /api/auditions/submit
 */
exports.submitAudition = async (req, res) => {
  console.log('📤 [AUDITION SUBMIT] Received audition submission request');
  console.log('📤 [AUDITION SUBMIT] User:', req.user?.id, req.user?.name);
  console.log('📤 [AUDITION SUBMIT] Casting ID:', req.body?.castingId);
  console.log('📤 [AUDITION SUBMIT] Video URL:', req.body?.videoURL);
  
  try {
    const { castingId, videoURL, coverLetter, experience, availability } = req.body;
    const actorId = req.user.id;

    // Get casting details to extract required emotion
    const casting = await CastingCall.findById(castingId);
    if (!casting) {
      return res.status(404).json({ message: 'Casting not found' });
    }

    // Extract required emotion from casting description
    const requiredEmotion = extractEmotionFromDescription(casting.description) || 'neutral';

    // Create audition record
    const audition = new Audition({
      actor: actorId,
      casting: castingId,
      videoURL,
      coverLetter,
      experience,
      availability,
      requiredEmotion,
      actorName: req.user.name,
      actorEmail: req.user.email,
      actorPhone: req.user.phone
    });

    await audition.save();

    // Trigger AI analysis asynchronously (non-blocking)
    analyzeAuditionAsync(audition._id, videoURL, requiredEmotion);

    res.status(201).json({
      message: 'Audition submitted successfully. AI analysis in progress.',
      auditionId: audition._id
    });

  } catch (error) {
    console.error('Submit audition error:', error);
    res.status(500).json({ message: 'Failed to submit audition', error: error.message });
  }
};

/**
 * Get submissions for a casting (recruiter view)
 * 
 * @route GET /api/castings/:castingId/submissions
 */
exports.getSubmissions = async (req, res) => {
  try {
    const { castingId } = req.params;
    const { sortBy = 'emotionMatchScore', order = 'desc' } = req.query;

    // Verify casting exists and user has access
    const casting = await CastingCall.findById(castingId);
    if (!casting) {
      return res.status(404).json({ message: 'Casting not found' });
    }

    // Build sort object
    const sortOptions = {};
    if (sortBy === 'emotionMatchScore') {
      sortOptions.emotionMatchScore = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'submittedAt') {
      sortOptions.submittedAt = order === 'asc' ? 1 : -1;
    } else {
      sortOptions.submittedAt = -1; // Default
    }

    // Fetch submissions
    const submissions = await Audition.find({ casting: castingId })
      .populate('actor', 'name email profilePicture')
      .sort(sortOptions)
      .lean();

    // Format response
    const formattedSubmissions = submissions.map(sub => ({
      id: sub._id,
      actor: {
        id: sub.actor._id,
        name: sub.actor.name,
        email: sub.actor.email,
        profilePicture: sub.actor.profilePicture
      },
      videoURL: sub.videoURL,
      thumbnailURL: sub.thumbnailURL,
      
      // AI Analysis Data
      requiredEmotion: sub.requiredEmotion,
      detectedEmotion: sub.detectedEmotion,
      emotionScores: sub.emotionScores,
      emotionMatchScore: sub.emotionMatchScore,
      feedback: sub.feedback,
      framesAnalyzed: sub.framesAnalyzed,
      aiAnalyzed: sub.aiAnalyzed,
      aiAnalysisError: sub.aiAnalysisError,
      
      // Metadata
      submittedAt: sub.submittedAt,
      analyzedAt: sub.analyzedAt,
      status: sub.status,
      rating: sub.rating,
      recruiterNotes: sub.recruiterNotes
    }));

    res.json({
      casting: {
        id: casting._id,
        title: casting.title,
        description: casting.description
      },
      submissions: formattedSubmissions,
      total: formattedSubmissions.length
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Failed to fetch submissions', error: error.message });
  }
};

/**
 * Get single submission details
 * 
 * @route GET /api/auditions/:auditionId
 */
exports.getSubmissionDetails = async (req, res) => {
  try {
    const { auditionId } = req.params;

    const audition = await Audition.findById(auditionId)
      .populate('actor', 'name email phone profilePicture')
      .populate('casting', 'title description company');

    if (!audition) {
      return res.status(404).json({ message: 'Audition not found' });
    }

    res.json(audition);

  } catch (error) {
    console.error('Get submission details error:', error);
    res.status(500).json({ message: 'Failed to fetch submission details', error: error.message });
  }
};

/**
 * Check AI service status
 * 
 * @route GET /api/ai/health
 */
exports.checkAIStatus = async (req, res) => {
  try {
    const isHealthy = await checkAIServiceHealth();
    
    res.json({
      status: isHealthy ? 'healthy' : 'unavailable',
      message: isHealthy ? 'AI service is running' : 'AI service is not responding'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Analyze audition asynchronously (non-blocking)
 */
async function analyzeAuditionAsync(auditionId, videoURL, requiredEmotion) {
  try {
    console.log(`[AI] Starting async analysis for audition ${auditionId}`);

    // Call AI service
    const result = await safeAnalyzeVideo(videoURL, requiredEmotion);

    // Update audition with results
    const updateData = {
      aiAnalyzed: true,
      analyzedAt: new Date()
    };

    if (result.success) {
      updateData.detectedEmotion = result.data.detectedEmotion;
      updateData.emotionScores = result.data.emotionScores;
      updateData.emotionMatchScore = result.data.emotionMatchScore;
      updateData.feedback = result.data.feedback;
      updateData.framesAnalyzed = result.data.framesAnalyzed;
      updateData.aiAnalysisError = null;
    } else {
      updateData.aiAnalysisError = result.error;
      updateData.feedback = result.data.feedback;
    }

    await Audition.findByIdAndUpdate(auditionId, updateData);

    console.log(`[AI] Analysis complete for audition ${auditionId}. Score: ${updateData.emotionMatchScore}`);

  } catch (error) {
    console.error(`[AI] Async analysis failed for audition ${auditionId}:`, error);
    
    // Mark analysis as failed
    await Audition.findByIdAndUpdate(auditionId, {
      aiAnalyzed: true,
      aiAnalysisError: error.message,
      feedback: `Analysis failed: ${error.message}`
    });
  }
}
