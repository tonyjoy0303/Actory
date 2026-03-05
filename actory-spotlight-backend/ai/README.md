# AI Emotion Analysis Module

This directory contains the Python-based AI emotion analysis system for Actory's audition video processing.

## 📁 Files

- **`emotion_video_analyzer.py`** - Main script that analyzes videos and outputs JSON results
- **`model_loader.py`** - Loads and manages the Keras CNN emotion detection model
- **`face_detector.py`** - OpenCV-based face detection using Haar Cascades
- **`fea-iter-2.keras`** - Trained CNN model file (48x48 RGB input, 7 emotion classes)
- **`requirements.txt`** - Python dependencies

## 🚀 Setup

### 1. Install Python Dependencies

```bash
cd actory-spotlight-backend/ai
pip install -r requirements.txt
```

### 2. Add Model File

Place your trained model file `fea-iter-2.keras` in this directory:

```
actory-spotlight-backend/
  ai/
    fea-iter-2.keras  ← Your model file here
    emotion_video_analyzer.py
    model_loader.py
    face_detector.py
```

### 3. Verify Installation

Test the AI integration:

```bash
# From the backend directory
node -e "require('./utils/aiIntegration').testAIIntegration()"
```

## 🔧 Model Specifications

**Input:** 48x48 RGB face images  
**Output:** 7 emotion classes (angry, disgust, fear, happy, sad, surprise, neutral)  
**Preprocessing:** Model includes internal Rescaling layer - DO NOT normalize manually  

**Important:** The model expects raw RGB pixel values (0-255). It has an internal Rescaling layer that divides by 255.

## 📊 How It Works

1. **Video Download**: Downloads video from Cloudinary URL
2. **Frame Extraction**: Extracts every 10th frame (max 100 frames)
3. **Face Detection**: Uses OpenCV Haar Cascade to detect faces
4. **Preprocessing**: Resizes faces to 48x48 RGB
5. **Emotion Prediction**: Runs CNN model on each frame
6. **Aggregation**: Calculates dominant emotion across all frames
7. **Scoring**: Compares detected emotion with required emotion
8. **Output**: Returns JSON with analysis results

## 🎯 Usage

### Command Line (Direct)

```bash
python emotion_video_analyzer.py <video_url> <required_emotion>
```

Example:
```bash
python emotion_video_analyzer.py "https://res.cloudinary.com/demo/video.mp4" "happy"
```

### From Node.js

The Node.js backend automatically calls the Python script via `utils/aiIntegration.js`:

```javascript
const { analyzeVideoEmotion } = require('./utils/aiIntegration');

const result = await analyzeVideoEmotion(videoUrl, 'happy');
console.log(result);
```

## 📤 Output Format

```json
{
  "success": true,
  "requiredEmotion": "happy",
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
  "feedback": "Good match. Actor shows some happy emotion (62%) though neutral is dominant.",
  "framesAnalyzed": 87
}
```

## ⚙️ Performance Optimization

- Analyzes every **10th frame** (configurable in `emotion_video_analyzer.py`)
- Stops after **100 frames** maximum
- Skips frames without detected faces
- Average processing time: 30-60 seconds per video

## 🐛 Troubleshooting

### Model not found error
- Ensure `fea-iter-2.keras` is in the `ai/` directory
- Check file permissions

### OpenCV Haar Cascade error
- OpenCV may fail to find the cascade file
- The script tries multiple common paths automatically
- If issue persists, manually download `haarcascade_frontalface_default.xml` from OpenCV repo

### No faces detected
- Ensure actor's face is clearly visible in the video
- Check lighting and video quality
- Verify video URL is accessible

### Python process timeout
- Default timeout is 5 minutes
- Adjust in `utils/aiIntegration.js` if needed for longer videos

### TensorFlow warnings
- TensorFlow may show compilation warnings - these are usually safe to ignore
- For production, consider installing optimized TensorFlow builds

## 🔒 Security Notes

- Video URLs must be valid and accessible
- Python process has 5-minute timeout to prevent hanging
- Temporary video files are automatically cleaned up
- All errors are caught and returned as JSON

## 📈 Model Training Notes

If you need to retrain or fine-tune the model:

1. Use the FER2013 dataset or your custom dataset
2. Ensure output has 7 classes in this order: angry, disgust, fear, happy, sad, surprise, neutral
3. Include Rescaling layer in the model (pixel normalization)
4. Save as `.keras` format
5. Replace `fea-iter-2.keras` with your new model

## 🔗 Integration Flow

```
Actor uploads video
    ↓
Backend saves to Cloudinary
    ↓
Node.js triggers Python script
    ↓
Python analyzes video frames
    ↓
Returns JSON to Node.js
    ↓
Saves results to MongoDB
    ↓
Recruiter views AI analysis in dashboard
```

## 📝 License

Part of the Actory platform - Internal use only
