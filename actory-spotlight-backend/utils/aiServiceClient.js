/**
 * AI Service Integration - HTTP Client
 * 
 * Communicates with Python AI microservice via HTTP API
 */

const axios = require('axios');

// AI service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Call AI service to analyze video emotion
 * 
 * @param {string} videoURL - Cloudinary video URL
 * @param {string} requiredEmotion - Required emotion from casting
 * @returns {Promise<Object>} AI analysis result
 */
async function analyzeVideoEmotion(videoURL, requiredEmotion) {
  try {
    console.log('[AI] Sending video to AI service for analysis...');
    console.log(`[AI] Video URL: ${videoURL}`);
    console.log(`[AI] Required emotion: ${requiredEmotion}`);

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/analyze-video`,
      {
        videoURL,
        requiredEmotion
      },
      {
        timeout: 300000, // 5 minutes timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const raw = response.data || {};
    const scores = raw.emotionScores || {};
    const maxScore = Math.max(
      Number(scores.angry || 0),
      Number(scores.disgust || 0),
      Number(scores.fear || 0),
      Number(scores.happy || 0),
      Number(scores.sad || 0),
      Number(scores.surprise || 0),
      Number(scores.neutral || 0)
    );

    const normalized = {
      ...raw,
      confidence: raw.confidence ?? maxScore,
      overallScore: raw.overallScore ?? raw.emotionMatchScore ?? 0,
    };

    console.log('[AI] Analysis completed successfully');
    return normalized;

  } catch (error) {
    console.error('[AI] Analysis failed:', error.message);
    
    if (error.response) {
      // AI service returned error response
      throw new Error(`AI service error: ${error.response.data.detail || error.response.statusText}`);
    } else if (error.request) {
      // No response received
      throw new Error('AI service is unavailable. Please ensure the service is running.');
    } else {
      // Request setup error
      throw new Error(`Failed to send request to AI service: ${error.message}`);
    }
  }
}

/**
 * Safe wrapper for video analysis with error handling
 * 
 * @param {string} videoURL - Video URL
 * @param {string} requiredEmotion - Required emotion
 * @returns {Promise<Object>} Analysis result or error object
 */
async function safeAnalyzeVideo(videoURL, requiredEmotion) {
  try {
    const result = await analyzeVideoEmotion(videoURL, requiredEmotion);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('[AI] Safe analyze caught error:', error.message);
    return {
      success: false,
      error: error.message,
      data: {
        requiredEmotion,
        detectedEmotion: null,
        emotionScores: null,
        emotionMatchScore: 0,
        feedback: `Analysis failed: ${error.message}`,
        framesAnalyzed: 0
      }
    };
  }
}

/**
 * Health check for AI service
 * 
 * @returns {Promise<boolean>} True if service is healthy
 */
async function checkAIServiceHealth() {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/health`, {
      timeout: 5000
    });
    return response.status === 200 && response.data.status === 'healthy';
  } catch (error) {
    console.error('[AI] Health check failed:', error.message);
    return false;
  }
}

/**
 * Validate emotion string
 * 
 * @param {string} emotion - Emotion to validate
 * @returns {boolean} True if valid emotion
 */
function validateEmotion(emotion) {
  const validEmotions = ['happy', 'sad', 'angry', 'fear', 'surprise', 'neutral', 'disgust'];
  return validEmotions.includes(emotion?.toLowerCase());
}

/**
 * Validate video file URL
 * 
 * @param {string} videoUrl - Video URL to validate
 * @returns {boolean} True if valid video URL
 */
function validateVideoFile(videoUrl) {
  if (!videoUrl || typeof videoUrl !== 'string') {
    return false;
  }
  
  // Check for valid URL format
  try {
    new URL(videoUrl);
  } catch (e) {
    return false;
  }
  
  // Check for video file extensions or Cloudinary patterns
  const videoPatterns = [
    /\.(mp4|webm|ogg|mov|avi|mkv)$/i,
    /cloudinary\.com/,
    /video\/upload/
  ];
  
  return videoPatterns.some(pattern => pattern.test(videoUrl));
}

module.exports = {
  analyzeVideoEmotion,
  safeAnalyzeVideo,
  checkAIServiceHealth,
  validateEmotion,
  validateVideoFile
};
