/**
 * Test Script for AI Emotion Analysis Integration
 * 
 * Run this script to verify the AI integration is working correctly
 * 
 * Usage: node test-ai-integration.js
 */

const { testAIIntegration, analyzeVideoEmotion } = require('./utils/aiIntegration');

console.log('🤖 Testing AI Emotion Analysis Integration\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Module Import
  console.log('Test 1: Module Import');
  try {
    const aiModule = require('./utils/aiIntegration');
    if (aiModule.analyzeVideoEmotion && aiModule.safeAnalyzeVideo) {
      console.log('✅ PASSED - AI module loaded successfully\n');
      passed++;
    } else {
      console.log('❌ FAILED - AI module missing required functions\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED - Could not import AI module:', error.message, '\n');
    failed++;
  }

  // Test 2: Emotion Validation
  console.log('Test 2: Emotion Validation');
  try {
    const { validateEmotion } = require('./utils/aiIntegration');
    const validTests = [
      validateEmotion('happy') === true,
      validateEmotion('sad') === true,
      validateEmotion('invalid') === false,
      validateEmotion(null) === false
    ];
    
    if (validTests.every(t => t)) {
      console.log('✅ PASSED - Emotion validation working\n');
      passed++;
    } else {
      console.log('❌ FAILED - Emotion validation not working correctly\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED - Emotion validation error:', error.message, '\n');
    failed++;
  }

  // Test 3: Video URL Validation
  console.log('Test 3: Video URL Validation');
  try {
    const { validateVideoFile } = require('./utils/aiIntegration');
    const validTests = [
      validateVideoFile('https://example.com/video.mp4') === true,
      validateVideoFile('https://res.cloudinary.com/demo/video/upload/v1/sample.mp4') === true,
      validateVideoFile('invalid-url') === false,
      validateVideoFile('') === false
    ];
    
    if (validTests.every(t => t)) {
      console.log('✅ PASSED - Video URL validation working\n');
      passed++;
    } else {
      console.log('❌ FAILED - Video URL validation not working correctly\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED - Video URL validation error:', error.message, '\n');
    failed++;
  }

  // Test 4: Emotion Extractor
  console.log('Test 4: Emotion Extractor');
  try {
    const { extractEmotionFromDescription } = require('./utils/emotionExtractor');
    
    const test1 = extractEmotionFromDescription('We need a happy and cheerful character');
    const test2 = extractEmotionFromDescription('Looking for someone who can portray sadness');
    const test3 = extractEmotionFromDescription('An angry and furious villain');
    const test4 = extractEmotionFromDescription('Need a wide-eyed, speechless reaction to sudden news');
    const test5 = extractEmotionFromDescription('The role needs a grossed-out, nauseous response');
    const test6 = extractEmotionFromDescription('A calm, restrained, matter of fact performance');
    const test7 = extractEmotionFromDescription('Looking for a villainous underworld boss character');
    const test8 = extractEmotionFromDescription('Casting for a grieving mother in an emotional drama');
    const test9 = extractEmotionFromDescription('Need a deadpan cop with dry delivery');
    const test10 = extractEmotionFromDescription('Character is not angry, not furious, and stays calm');
    const test11 = extractEmotionFromDescription('Character is angry at first, but calm now');
    const test12 = extractEmotionFromDescription('Initially fearful, however composed and neutral by the end');
    
    if (
      test1 === 'happy'
      && test2 === 'sad'
      && test3 === 'angry'
      && test4 === 'surprise'
      && test5 === 'disgust'
      && test6 === 'neutral'
      && test7 === 'angry'
      && test8 === 'sad'
      && test9 === 'neutral'
      && test10 === 'neutral'
      && test11 === 'neutral'
      && test12 === 'neutral'
    ) {
      console.log('✅ PASSED - Emotion extraction working\n');
      passed++;
    } else {
      console.log(`❌ FAILED - Emotion extraction incorrect: ${test1}, ${test2}, ${test3}, ${test4}, ${test5}, ${test6}, ${test7}, ${test8}, ${test9}, ${test10}, ${test11}, ${test12}\n`);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED - Emotion extractor error:', error.message, '\n');
    failed++;
  }

  // Test 5: Python Environment Check
  console.log('Test 5: Python Environment Check');
  try {
    const { spawn } = require('child_process');
    const pythonProcess = spawn('python', ['--version']);
    
    await new Promise((resolve, reject) => {
      let output = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0 || output.includes('Python')) {
          console.log(`✅ PASSED - Python found: ${output.trim()}\n`);
          passed++;
          resolve();
        } else {
          console.log('❌ FAILED - Python not found or not working\n');
          failed++;
          resolve();
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.log('❌ FAILED - Python not accessible:', error.message, '\n');
        failed++;
        resolve();
      });
    });
  } catch (error) {
    console.log('❌ FAILED - Could not check Python:', error.message, '\n');
    failed++;
  }

  // Test 6: Model File Check
  console.log('Test 6: Model File Check');
  try {
    const fs = require('fs');
    const path = require('path');
    const modelPath = path.join(__dirname, 'ai', 'fea-iter-2.keras');
    
    if (fs.existsSync(modelPath)) {
      const stats = fs.statSync(modelPath);
      console.log(`✅ PASSED - Model file found (${(stats.size / 1024 / 1024).toFixed(2)} MB)\n`);
      passed++;
    } else {
      console.log('⚠️  WARNING - Model file not found at:', modelPath);
      console.log('   Please add your fea-iter-2.keras file to the ai/ directory\n');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED - Could not check model file:', error.message, '\n');
    failed++;
  }

  // Test 7: Python Dependencies Check
  console.log('Test 7: Python Dependencies Check');
  try {
    const { spawn } = require('child_process');
    const pythonProcess = spawn('python', ['-c', 'import tensorflow, cv2, numpy; print("OK")']);
    
    await new Promise((resolve) => {
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0 && output.includes('OK')) {
          console.log('✅ PASSED - All Python dependencies installed\n');
          passed++;
        } else {
          console.log('❌ FAILED - Python dependencies missing');
          console.log('   Run: cd ai && pip install -r requirements.txt\n');
          failed++;
        }
        resolve();
      });
      
      pythonProcess.on('error', (error) => {
        console.log('❌ FAILED - Could not check dependencies:', error.message, '\n');
        failed++;
        resolve();
      });
    });
  } catch (error) {
    console.log('❌ FAILED - Could not check Python dependencies:', error.message, '\n');
    failed++;
  }

  // Summary
  console.log('═══════════════════════════════════════');
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('═══════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉 All tests passed! AI integration is ready to use.\n');
    console.log('Next steps:');
    console.log('1. Start your backend server: npm run dev');
    console.log('2. Upload an audition video through the frontend');
    console.log('3. Check the AI analysis results in the recruiter dashboard\n');
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues above before using the AI system.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
