/**
 * AI Integration Module for Video Emotion Analysis
 * 
 * This module handles communication between Node.js backend and Python AI microservice.
 * It makes HTTP API calls to the separate AI service instead of spawning Python processes.
 */

const axios = require('axios');

// AI Service URL from environment variable or default to localhost
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Validate emotion string
 * @param {string} emotion - Emotion to validate
 * @returns {boolean} - True if valid emotion
 */
const validateEmotion = (emotion) => {
  const validEmotions = ['happy', 'sad', 'angry', 'fear', 'surprise', 'neutral', 'disgust'];
  return validEmotions.includes(emotion?.toLowerCase());
};

/**
 * Validate video file URL
 * @param {string} videoUrl - Video URL to validate
 * @returns {boolean} - True if valid video URL
 */
const validateVideoFile = (videoUrl) => {
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
};

/**
 * Execute Python emotion analyzer via HTTP API
 * @param {string} videoUrl - URL to the video file
 * @param {string} requiredEmotion - Required emotion for the casting
 * @returns {Promise<Object>} - Analysis results
 */
const analyzeVideoEmotion = async (videoUrl, requiredEmotion) => {
  // Validate inputs
  if (!validateVideoFile(videoUrl)) {
    throw new Error('Invalid video URL format');
  }
  
  if (!validateEmotion(requiredEmotion)) {
    throw new Error(`Invalid emotion: ${requiredEmotion}. Must be one of: happy, sad, angry, fear, surprise, neutral, disgust`);
  }
  
  console.log(`[AI] Calling AI service for emotion analysis...`);
  console.log(`[AI] Service URL: ${AI_SERVICE_URL}`);
  console.log(`[AI] Video: ${videoUrl}`);
  console.log(`[AI] Required Emotion: ${requiredEmotion}`);
  
  try {
    // Call AI service via HTTP
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/analyze-video`,
      { videoURL: videoUrl, requiredEmotion: requiredEmotion },
      {
        timeout: 5 * 60 * 1000, // 5 minutes timeout
        validateStatus: (status) => status < 600 // Don't throw on 4xx/5xx, handle manually
      }
    );

    console.log(`[AI] AI service responded with status: ${response.status}`);
    
    // Handle error responses
    if (response.status !== 200) {
      const errorData = response.data;
      const errorMessage = errorData.error || errorData.detail || 'Analysis failed';
      console.error(`[AI] AI service error: ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    const result = response.data;
    
    // Check if analysis was successful
    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }
    
    console.log(`[AI] Analysis successful: ${result.detectedEmotion} (match: ${result.emotionMatchScore}%)`);
    return result;
    
  } catch (error) {
    // Handle network/timeout errors
    if (error.code === 'ECONNREFUSED') {
      console.error(`[AI] Cannot connect to AI service at ${AI_SERVICE_URL}`);
      throw new Error('AI service is not available. Please ensure the AI microservice is running.');
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error(`[AI] AI service timeout`);
      throw new Error('Analysis timeout: Request took longer than 5 minutes');
    }
    
    // Re-throw the error if already processed
    if (error.message.includes('AI service') || error.message.includes('Invalid')) {
      throw error;
    }
    
    // Generic error
    console.error(`[AI] Unexpected error: ${error.message}`);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

/**
 * Safe wrapper for video analysis with error handling
 * @param {string} videoUrl - URL to the video file
 * @param {string} requiredEmotion - Required emotion for the casting
 * @returns {Promise<Object>} - Analysis results or error object
 */
const safeAnalyzeVideo = async (videoUrl, requiredEmotion) => {
  try {
    const result = await analyzeVideoEmotion(videoUrl, requiredEmotion);
    return result;
  } catch (error) {
    console.error(`[AI] Analysis error: ${error.message}`);
    
    // Return error object instead of throwing
    return {
      success: false,
      error: error.message,
      requiredEmotion: requiredEmotion,
      detectedEmotion: null,
      emotionScores: null,
      emotionMatchScore: 0,
      emotionConsistency: 0,
      expressionIntensity: 0,
      faceVisibility: 0,
      overallPerformanceScore: 0,
      emotionTimeline: [],
      framesAnalyzed: 0,
      confidence: 0,
      overallScore: 0,
      feedback: `Analysis failed: ${error.message}`,
      faceEmotion: null,
      voiceEmotion: 'neutral',
      faceConfidence: 0,
      voiceConfidence: 0,
      combinedEmotionConfidence: 0,
    };
  }
};

/**
 * Test the AI integration (for debugging)
 * @param {string} videoUrl - Test video URL
 * @returns {Promise<Object>} - Test results
 */
const testAIIntegration = async (videoUrl = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4') => {
  console.log('[AI TEST] Starting AI integration test...');
  console.log(`[AI TEST] AI Service URL: ${AI_SERVICE_URL}`);
  
  try {
    // First check if AI service is reachable
    const healthCheck = await axios.get(`${AI_SERVICE_URL}/api/health`, { timeout: 5000 });
    console.log('[AI TEST] ✓ AI service is reachable');
    console.log(`[AI TEST] Health status: ${JSON.stringify(healthCheck.data)}`);
  } catch (error) {
    console.error('[AI TEST] ✗ Cannot reach AI service');
    throw new Error(`AI service not available at ${AI_SERVICE_URL}: ${error.message}`);
  }
  
  try {
    const result = await analyzeVideoEmotion(videoUrl, 'happy');
    console.log('[AI TEST] ✓ Test passed successfully');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('[AI TEST] ✗ Test failed:', error.message);
    throw error;
  }
};

module.exports = {
  analyzeVideoEmotion,
  safeAnalyzeVideo,
  validateVideoFile,
  validateEmotion,
  testAIIntegration
};
