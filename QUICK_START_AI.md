# 🚀 Quick Start - AI Emotion Analysis Integration

Get your AI emotion analysis system running in 5 minutes!

---

## ⚡ Quick Setup

### 1. Install Python Dependencies (2 minutes)

```bash
cd actory-spotlight-backend/ai
pip install -r requirements.txt
```

### 2. Add Your Model File (30 seconds)

Copy your trained Keras model to the AI directory:

```bash
# Place your model file here:
actory-spotlight-backend/ai/fea-iter-2.keras
```

### 3. Test the Integration (1 minute)

```bash
cd actory-spotlight-backend
npm run test:ai
```

You should see:
```
✅ PASSED - AI module loaded successfully
✅ PASSED - Emotion validation working
✅ PASSED - Video URL validation working
✅ PASSED - Emotion extraction working
✅ PASSED - Python found: Python 3.x.x
✅ PASSED - Model file found (XX.XX MB)
✅ PASSED - All Python dependencies installed
🎉 All tests passed! AI integration is ready to use.
```

### 4. Start Your Server (30 seconds)

```bash
npm run dev
```

---

## 🎬 How to Use

### For Actors

1. Navigate to a casting call
2. Click "Submit Audition"
3. Upload your video
4. Fill in required details
5. Submit!

**The AI will automatically analyze your video emotion in the background (30-60 seconds)**

### For Recruiters

1. Navigate to "My Castings"
2. Click on a casting to view submissions
3. See AI emotion analysis for each submission:
   - Required vs Detected emotion
   - Match score percentage
   - Emotion distribution chart
   - AI feedback

4. Sort by "Overall Score" to see best matches first
5. Click "Re-analyze" if you want to run analysis again

---

## 📊 What Gets Analyzed

The AI analyzes:
- **Dominant emotion** in the video (happy, sad, angry, fear, surprise, disgust, neutral)
- **Emotion match score** vs required emotion (0-100%)
- **Confidence level** of detection
- **Distribution** of all emotions
- **Overall score** combining match and confidence

---

## 🔍 Understanding Results

### Emotion Match Score

- **75-100%**: Excellent match ✅
- **50-74%**: Good match ⚠️
- **0-49%**: Low match ❌

### Overall Score

Combined score of:
- Emotion match (50% weight)
- Detection confidence (50% weight)

---

## 🛠️ Troubleshooting

### "Model file not found"

```bash
# Make sure your model is in the right place:
ls -la actory-spotlight-backend/ai/fea-iter-2.keras
```

### "Python not found"

```bash
# Check Python installation:
python --version

# On some systems, use:
python3 --version
```

### "No faces detected"

- Ensure actor's face is clearly visible
- Good lighting required
- Face should be facing the camera

### "Analysis taking too long"

- Normal processing time: 30-60 seconds
- Longer videos take more time
- Timeout is set to 5 minutes

---

## 📝 File Structure

```
actory-spotlight-backend/
├── ai/
│   ├── emotion_video_analyzer.py   ← Main analysis script
│   ├── model_loader.py              ← Model loading
│   ├── face_detector.py             ← Face detection
│   ├── fea-iter-2.keras             ← YOUR MODEL FILE
│   ├── requirements.txt             ← Python dependencies
│   └── README.md                    ← AI module docs
├── utils/
│   ├── aiIntegration.js             ← Node.js ↔ Python bridge
│   └── emotionExtractor.js          ← Extract emotion from text
├── controllers/
│   ├── videos.js                    ← Auto-triggers analysis
│   └── submissions.js               ← Handles re-analysis
├── models/
│   └── Video.js                     ← Updated with AI fields
└── test-ai-integration.js           ← Test script
```

---

## 🎯 Testing with Real Video

### Option 1: Use Frontend

1. Start backend: `npm run dev`
2. Start frontend: `cd ../actory-spotlight-ui && npm run dev`
3. Create account as Actor
4. Find a casting
5. Submit audition with video

### Option 2: Test Directly with Python

```bash
cd actory-spotlight-backend/ai

# Test with a sample video URL
python emotion_video_analyzer.py \
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4" \
  "happy"
```

---

## 📚 Next Steps

- Read [AI_EMOTION_INTEGRATION_GUIDE.md](../AI_EMOTION_INTEGRATION_GUIDE.md) for detailed documentation
- Check [API_RESPONSE_EXAMPLES.md](./API_RESPONSE_EXAMPLES.md) for API format
- Review [ai/README.md](./ai/README.md) for Python module details

---

## ✅ Checklist

- [ ] Python 3.8+ installed
- [ ] TensorFlow installed (`pip install tensorflow`)
- [ ] OpenCV installed (`pip install opencv-python`)
- [ ] Model file `fea-iter-2.keras` in `ai/` directory
- [ ] Test script passes (`npm run test:ai`)
- [ ] Backend server starts without errors
- [ ] Test video upload works
- [ ] AI analysis results appear in submissions

---

## 🎉 You're Ready!

Your AI emotion analysis system is now integrated and ready to evaluate audition submissions!

**Questions?** Check the troubleshooting section or review the full integration guide.
