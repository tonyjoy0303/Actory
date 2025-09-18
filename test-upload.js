const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:5000/api/v1';
const TEST_VIDEO_PATH = path.join(__dirname, 'test-video.mp4'); // Create a small test video file first
const TEST_USER = {
  email: 'tonyjoy2026@mca.ajce.in', // Replace with a test user's email
  password: '123456'    // Replace with the test user's password
};

async function testVideoUpload() {
  try {
    console.log('🚀 Starting video upload test...');
    
    // 1. Login to get auth token
    console.log('🔑 Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    const token = loginRes.data.token;
    console.log('✅ Logged in successfully');

    // 2. Prepare the video file
    if (!fs.existsSync(TEST_VIDEO_PATH)) {
      throw new Error(`Test video not found at ${TEST_VIDEO_PATH}. Please create a small test video file first.`);
    }

    const formData = new FormData();
    formData.append('video', fs.createReadStream(TEST_VIDEO_PATH));
    formData.append('title', 'Test Video Upload');
    formData.append('description', 'This is a test video upload');
    formData.append('category', 'Demo Reel');

    // 3. Upload the video
    console.log('📤 Uploading video...');
    const uploadRes = await axios.post(`${API_URL}/profile/videos`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('🎉 Video uploaded successfully!');
    console.log('📊 Response:', JSON.stringify(uploadRes.data, null, 2));
    
    return uploadRes.data;
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Run the test
testVideoUpload()
  .then(() => console.log('✅ Test completed successfully'))
  .catch(() => console.error('❌ Test failed'));
