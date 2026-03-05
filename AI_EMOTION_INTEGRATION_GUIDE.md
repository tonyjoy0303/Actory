# AI Emotion Analysis Integration Guide

## 🎯 Complete Setup Instructions

This document provides step-by-step instructions for integrating the AI emotion analysis system into your Actory platform.

---

## 📋 Prerequisites

- **Node.js** 14+ installed
- **Python** 3.8+ installed
- **MongoDB** running
- **Cloudinary** account configured
- Trained model file `fea-iter-2.keras`

---

## 🚀 Installation Steps

### Step 1: Install Python Dependencies

```bash
cd actory-spotlight-backend/ai
pip install -r requirements.txt
```

**Verify installation:**
```bash
python -c "import tensorflow; import cv2; import numpy; print('✓ All dependencies installed')"
```

### Step 2: Add Your Model File

Place your trained Keras model in the `ai/` directory:

```bash
# Copy your model file
cp /path/to/your/fea-iter-2.keras actory-spotlight-backend/ai/
```

**File structure should be:**
```
actory-spotlight-backend/
  ai/
    ├── emotion_video_analyzer.py
    ├── model_loader.py
    ├── face_detector.py
    ├── fea-iter-2.keras          ← Your model here
    ├── requirements.txt
    └── README.md
```

### Step 3: Install Node.js Dependencies (if not already done)

```bash
cd actory-spotlight-backend
npm install
```

### Step 4: Test the Integration

**Test Python script directly:**
```bash
cd actory-spotlight-backend/ai
python emotion_video_analyzer.py "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4" "happy"
```

**Test Node.js integration:**
```bash
cd actory-spotlight-backend
node -e "require('./utils/aiIntegration').testAIIntegration().then(r => console.log('Success:', r)).catch(e => console.error('Error:', e))"
```

---

## 🔧 Backend Configuration

The system is already integrated into your existing controllers. No additional configuration needed!

**Files created/updated:**
- ✅ `utils/aiIntegration.js` - Node.js ↔ Python bridge
- ✅ `utils/emotionExtractor.js` - Extract emotion from casting descriptions
- ✅ `controllers/videos.js` - Auto-triggers AI analysis on video upload
- ✅ `controllers/submissions.js` - Handles re-analysis requests
- ✅ `models/Video.js` - Updated schema with emotion fields

---

## 📊 MongoDB Schema

The Video model now includes AI analysis fields:

```javascript
{
  aiAnalysis: {
    analyzed: Boolean,              // Has analysis been completed
    requiredEmotion: String,        // Emotion required by casting
    detectedEmotion: String,        // Detected dominant emotion
    emotionScores: {                // Probability scores for all emotions
      angry: Number,
      disgust: Number,
      fear: Number,
      happy: Number,
      sad: Number,
      surprise: Number,
      neutral: Number
    },
    emotionMatchScore: Number,      // Match percentage (0-100)
    confidence: Number,             // Model confidence (0-1)
    overallScore: Number,           // Combined score (0-100)
    feedback: String,               // AI-generated feedback
    framesAnalyzed: Number,         // Number of frames processed
    analyzedAt: Date,               // Analysis timestamp
    error: String                   // Error message if failed
  }
}
```

---

## 🎬 How It Works

### Automatic Analysis Flow

1. **Actor uploads audition video** → POST `/api/v1/videos`
2. **Backend saves video to Cloudinary**
3. **Video document created in MongoDB**
4. **AI analysis triggered asynchronously** (non-blocking)
5. **Python script downloads and analyzes video**
6. **Results saved to MongoDB**
7. **Recruiter views results in dashboard**

### Manual Re-analysis

Recruiters can re-analyze any submission:

```javascript
POST /api/v1/auditions/:auditionId/reanalyze
```

---

## 📡 API Endpoints

### Get Submissions (with AI data)

```http
GET /api/v1/castings/:castingId/submissions?sort=overallScore&filter=50
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "...",
      "actor": { "name": "John Doe", "email": "..." },
      "videoUrl": "https://...",
      "status": "Pending",
      "aiAnalyzed": true,
      "requiredEmotion": "sad",
      "detectedEmotion": "neutral",
      "emotionScores": {
        "angry": 0.02,
        "disgust": 0.01,
        "fear": 0.03,
        "happy": 0.05,
        "sad": 0.18,
        "surprise": 0.04,
        "neutral": 0.67
      },
      "emotionMatchScore": 62,
      "confidence": 0.67,
      "overallScore": 64,
      "feedback": "Good match. Actor shows some sad emotion (62%) though neutral is dominant.",
      "framesAnalyzed": 87
    }
  ]
}
```

### Re-analyze Submission

```http
POST /api/v1/auditions/:auditionId/reanalyze
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Audition re-analyzed successfully",
  "data": {
    "_id": "...",
    "aiAnalysis": { ... }
  }
}
```

---

## 🎨 Frontend Integration

### Import the Component

```jsx
import EmotionAnalysisDisplay from '@/components/EmotionAnalysisDisplay';
```

### Use in Recruiter Dashboard

```jsx
import React, { useEffect, useState } from 'react';
import EmotionAnalysisDisplay from '@/components/EmotionAnalysisDisplay';

const SubmissionsList = ({ castingId }) => {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetchSubmissions();
  }, [castingId]);

  const fetchSubmissions = async () => {
    const response = await fetch(
      `/api/v1/castings/${castingId}/submissions?sort=overallScore`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    const data = await response.json();
    if (data.success) {
      setSubmissions(data.data);
    }
  };

  return (
    <div className="submissions-container">
      {submissions.map(submission => (
        <div key={submission._id} className="submission-card">
          {/* Actor Info */}
          <div className="actor-info">
            <h3>{submission.actor.name}</h3>
            <p>{submission.actor.email}</p>
          </div>

          {/* Video Player */}
          <video src={submission.videoUrl} controls width="100%" />

          {/* AI Emotion Analysis */}
          <EmotionAnalysisDisplay submission={submission} />

          {/* Actions */}
          <div className="actions">
            <button onClick={() => handleAccept(submission._id)}>
              Accept
            </button>
            <button onClick={() => handleReject(submission._id)}>
              Reject
            </button>
            <button onClick={() => handleReanalyze(submission._id)}>
              Re-analyze
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubmissionsList;
```

---

## ⚡ Performance Considerations

### Frame Sampling
- Default: Every 10th frame
- Adjust in `emotion_video_analyzer.py`:
  ```python
  self.FRAME_SKIP = 10  # Change to 5 for more frames, 20 for fewer
  ```

### Maximum Frames
- Default: 100 frames max
- Adjust in `emotion_video_analyzer.py`:
  ```python
  self.MAX_FRAMES = 100  # Increase for longer videos
  ```

### Timeout Settings
- Default: 5 minutes
- Adjust in `utils/aiIntegration.js`:
  ```javascript
  const timeout = setTimeout(() => {
    pythonProcess.kill();
  }, 5 * 60 * 1000);  // Change multiplier
  ```

---

## 🐛 Common Issues & Solutions

### Issue: "Model file not found"
**Solution:**
```bash
# Verify model file exists
ls -la actory-spotlight-backend/ai/fea-iter-2.keras

# Check file permissions
chmod 644 actory-spotlight-backend/ai/fea-iter-2.keras
```

### Issue: "Python command not found"
**Solution:**
```bash
# On Windows, try:
# Change 'python' to 'python3' or 'py' in utils/aiIntegration.js

# Or add Python to PATH
```

### Issue: "No faces detected in video"
**Causes:**
- Poor lighting
- Face not visible
- Low resolution
- Side profile

**Solutions:**
- Ensure actor faces camera directly
- Improve lighting in casting requirements
- Set minimum video quality standards

### Issue: "Analysis timeout"
**Solution:**
```javascript
// Increase timeout in utils/aiIntegration.js
const timeout = setTimeout(() => {
  pythonProcess.kill();
}, 10 * 60 * 1000);  // 10 minutes
```

### Issue: "TensorFlow warnings"
**Solution:**
These are usually safe to ignore. To suppress:
```bash
export TF_CPP_MIN_LOG_LEVEL=2  # Linux/Mac
set TF_CPP_MIN_LOG_LEVEL=2     # Windows
```

---

## 🔐 Security Best Practices

1. **Validate video URLs** - Already implemented in `validateVideoFile()`
2. **Set process timeout** - Prevents hanging processes
3. **Clean temporary files** - Auto-cleanup after analysis
4. **Sanitize inputs** - Emotion validation prevents injection
5. **Rate limiting** - Consider adding to re-analyze endpoint

---

## 📈 Monitoring & Logging

All AI operations are logged with `[AI]` prefix:

```javascript
console.log('[AI] Starting emotion analysis for video 12345');
console.log('[AI] Analysis successful: neutral (match: 62%)');
console.error('[AI] Analysis failed: No faces detected');
```

**Monitor in production:**
```bash
# Watch real-time logs
tail -f logs/combined.log | grep "\[AI\]"
```

---

## 🚦 Testing Checklist

- [ ] Python dependencies installed
- [ ] Model file in correct location
- [ ] Python script runs standalone
- [ ] Node.js integration test passes
- [ ] Test video upload triggers analysis
- [ ] Results saved to MongoDB
- [ ] Frontend displays emotion data
- [ ] Re-analysis endpoint works
- [ ] Error handling works (invalid URL, no faces)
- [ ] Performance acceptable for production

---

## 📞 Support

For issues or questions:
1. Check logs for error messages
2. Verify all dependencies are installed
3. Test Python script standalone
4. Check file permissions
5. Review this guide's troubleshooting section

---

## 🎉 You're All Set!

The AI emotion analysis system is now fully integrated into your Actory platform. Actors can submit videos, and recruiters will automatically see emotion match scores and detailed analysis results!
