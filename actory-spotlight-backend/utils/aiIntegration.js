/**
 * AI Integration Module for Video Emotion Analysis
 * 
 * This module handles communication between Node.js backend and Python AI scripts.
 * It spawns Python processes to analyze audition videos and parse their results.
 */

const { spawn } = require('child_process');
const path = require('path');

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
 * Execute Python emotion analyzer script
 * @param {string} videoUrl - URL to the video file
 * @param {string} requiredEmotion - Required emotion for the casting
 * @returns {Promise<Object>} - Analysis results
 */
const analyzeVideoEmotion = (videoUrl, requiredEmotion) => {
  return new Promise((resolve, reject) => {
    // Validate inputs
    if (!validateVideoFile(videoUrl)) {
      return reject(new Error('Invalid video URL format'));
    }
    
    if (!validateEmotion(requiredEmotion)) {
      return reject(new Error(`Invalid emotion: ${requiredEmotion}. Must be one of: happy, sad, angry, fear, surprise, neutral, disgust`));
    }
    
    // Path to Python script
    const scriptPath = path.join(__dirname, '..', 'ai', 'emotion_video_analyzer.py');
    
    console.log(`[AI] Spawning Python process for emotion analysis...`);
    console.log(`[AI] Script: ${scriptPath}`);
    console.log(`[AI] Video: ${videoUrl}`);
    console.log(`[AI] Required Emotion: ${requiredEmotion}`);
    
    // Spawn Python process
    const pythonProcess = spawn('python', [
      scriptPath,
      videoUrl,
      requiredEmotion
    ]);
    
    let stdoutData = '';
    let stderrData = '';
    
    // Collect stdout data
    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });
    
    // Collect stderr data (for logging)
    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.log(`[AI Python] ${data.toString().trim()}`);
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      console.log(`[AI] Python process exited with code ${code}`);
      
      if (code !== 0) {
        console.error(`[AI] Python stderr: ${stderrData}`);
        
        // Try to parse error JSON from stderr
        try {
          const errorJson = JSON.parse(stderrData);
          return reject(new Error(errorJson.error || 'Python analysis failed'));
        } catch (e) {
          return reject(new Error(`Python process failed with code ${code}: ${stderrData}`));
        }
      }
      
      // Parse JSON result from stdout
      try {
        const result = JSON.parse(stdoutData);
        
        if (!result.success) {
          return reject(new Error(result.error || 'Analysis failed'));
        }
        
        console.log(`[AI] Analysis successful: ${result.detectedEmotion} (match: ${result.emotionMatchScore}%)`);
        resolve(result);
        
      } catch (parseError) {
        console.error(`[AI] Failed to parse Python output: ${stdoutData}`);
        reject(new Error(`Failed to parse analysis result: ${parseError.message}`));
      }
    });
    
    // Handle process errors
    pythonProcess.on('error', (error) => {
      console.error(`[AI] Failed to spawn Python process: ${error.message}`);
      reject(new Error(`Failed to start Python analysis: ${error.message}`));
    });
    
    // Set timeout (5 minutes max)
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Analysis timeout: Process took longer than 5 minutes'));
    }, 5 * 60 * 1000);
    
    pythonProcess.on('close', () => {
      clearTimeout(timeout);
    });
  });
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
      confidence: 0,
      overallScore: 0,
      feedback: `Analysis failed: ${error.message}`
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
