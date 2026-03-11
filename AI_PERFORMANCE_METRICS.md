# AI Video Performance Evaluation Metrics

## Overview

The AI emotion analysis system has been enhanced with comprehensive performance metrics that evaluate audition videos across multiple dimensions. These metrics provide production houses with detailed insights into actor performance quality.

---

## 📊 Evaluation Criteria

### 1️⃣ **Emotion Match Score** (0-100)
**Weight in Overall Score:** 40%

Measures how well the detected emotion matches the required emotion from the casting call.

**Calculation:**
- If detected emotion **matches** required emotion: `required_emotion_confidence × 100`
- If detected emotion **differs** but required is present: `required_emotion_confidence × 70`

**Example:**
```
Required: "sad"
Detected: "sad" with 0.87 confidence → 87% match
Detected: "neutral" with sad=0.65 → ~45% match (partial)
```

**Scoring Thresholds:**
- **80-100%**: Excellent - Actor strongly expresses required emotion
- **60-79%**: Good - Required emotion shown, though others present
- **40-59%**: Partial - Some presence, but other emotions dominate
- **0-39%**: Low - Primarily shows different emotion

---

### 2️⃣ **Emotion Consistency** (0-100)
**Weight in Overall Score:** 25%

Measures how consistently the actor maintains the required emotion throughout the performance.

**Formula:**
```
Consistency = (frames_with_required_emotion / total_frames_with_faces) × 100
```

**Example:**
```
Required: "happy"
Frame emotions: happy, happy, neutral, happy, sad, happy

Consistency = 4/6 = 67%
```

**Why It Matters:**
- Evaluates actor's ability to sustain emotion
- Identifies inconsistent performances
- Helps detect emotional breaks or wavering

---

### 3️⃣ **Expression Intensity** (0-100)
**Weight in Overall Score:** 20%

Measures how strongly the required emotion is expressed when it appears.

**Formula:**
```
Intensity = average(confidence_scores_of_required_emotion_frames) × 100
```

**Example:**
```
Required: "happy"
Happy frames with confidences: 0.72, 0.65, 0.81

Intensity = (0.72 + 0.65 + 0.81) / 3 = 0.73 → 73%
```

**Why It Matters:**
- Evaluates strength of emotional expression
- Identifies subtle vs bold performances
- Measures conviction in the performance

---

### 4️⃣ **Face Visibility** (0-100)
**Weight in Overall Score:** 15%

Measures how often the actor's face is clearly visible for analysis.

**Formula:**
```
Visibility = (frames_with_detected_faces / total_frames_processed) × 100
```

**Example:**
```
99 faces detected / 100 frames processed = 99%
```

**Why It Matters:**
- Ensures adequate footage for analysis
- Identifies camera angle/framing issues
- Validates video quality for AI processing

---

## 🎯 Overall Performance Score

Combines all metrics into a single comprehensive score using weighted average.

**Formula:**
```
Overall = (Match × 0.40) + (Consistency × 0.25) + (Intensity × 0.20) + (Visibility × 0.15)
```

**Example Calculation:**
```
Emotion Match:    85%
Consistency:      67%
Intensity:        73%
Visibility:       99%

Overall = (85 × 0.40) + (67 × 0.25) + (73 × 0.20) + (99 × 0.15)
        = 34 + 16.75 + 14.6 + 14.85
        = 80.2%
```

---

## 📹 Emotion Timeline

Shows emotion transitions over time in the video.

**Format:**
```json
[
  { "emotion": "neutral", "start": 0.0, "end": 1.5 },
  { "emotion": "happy", "start": 1.5, "end": 4.0 },
  { "emotion": "neutral", "start": 4.0, "end": 5.2 }
]
```

**Use Cases:**
- Identify exact moments of emotion changes
- Analyze performance progression
- Detect emotional build-up or transitions

---

## 🔧 Technical Implementation

### Frame-Level Data Collection

During analysis, the system collects:
```python
frame_results = [
  { "emotion": "happy", "confidence": 0.71, "time": 0.5 },
  { "emotion": "happy", "confidence": 0.65, "time": 1.0 },
  { "emotion": "neutral", "confidence": 0.52, "time": 1.5 }
]
```

### Analysis Pipeline

1. **Download** video from Cloudinary
2. **Extract** frames (every 10th frame, max 100)
3. **Detect** faces using OpenCV Haar Cascades
4. **Predict** emotions using CNN model (fea-iter-2.keras)
5. **Calculate** performance metrics from frame data
6. **Generate** emotion timeline
7. **Return** comprehensive JSON response

---

## 📡 API Response

### Success Response

```json
{
  "success": true,
  "requiredEmotion": "happy",
  "detectedEmotion": "happy",
  
  "emotionScores": {
    "angry": 0.02,
    "disgust": 0.01,
    "fear": 0.03,
    "happy": 0.85,
    "sad": 0.04,
    "surprise": 0.03,
    "neutral": 0.02
  },
  
  "emotionMatchScore": 85,
  "emotionConsistency": 67,
  "expressionIntensity": 73,
  "faceVisibility": 99,
  "overallPerformanceScore": 80,
  
  "emotionTimeline": [
    { "emotion": "neutral", "start": 0.0, "end": 1.5 },
    { "emotion": "happy", "start": 1.5, "end": 5.2 }
  ],
  
  "framesAnalyzed": 99,
  "feedback": "Excellent! Actor strongly expresses 'happy' emotion as required."
}
```

---

## 🎭 Database Schema

The Video model now includes these fields in `aiAnalysis`:

```javascript
{
  analyzed: Boolean,
  requiredEmotion: String,
  detectedEmotion: String,
  emotionScores: Object,
  
  // Performance Metrics (NEW)
  emotionMatchScore: Number,      // 0-100
  emotionConsistency: Number,     // 0-100
  expressionIntensity: Number,    // 0-100
  faceVisibility: Number,         // 0-100
  overallPerformanceScore: Number,// 0-100
  emotionTimeline: Array,         // [{emotion, start, end}]
  
  framesAnalyzed: Number,
  confidence: Number,
  feedback: String,
  analyzedAt: Date,
  error: String
}
```

---

## 📊 Use Cases for Production Houses

### 1. **Shortlisting Actors**
Sort submissions by `overallPerformanceScore` to identify top performers.

### 2. **Quality Control**
Filter out videos with low `faceVisibility` (<70%) for technical quality issues.

### 3. **Emotion Analysis**
Review `emotionTimeline` to see how actors build emotional arcs.

### 4. **Consistency Check**
Use `emotionConsistency` to find actors who maintain character throughout.

### 5. **Intensity Evaluation**
Use `expressionIntensity` to compare subtle vs. bold performances.

---

## 🚀 Getting Started

### Run AI Service
```bash
cd actory-ai-service
python main.py
```

### API Endpoint
```
POST http://localhost:8000/api/analyze-video
```

### Request Body
```json
{
  "videoURL": "https://res.cloudinary.com/.../audition.mp4",
  "requiredEmotion": "sad"
}
```

### Health Check
```
GET http://localhost:8000/api/health
```

---

## 📈 Performance Benchmarks

**Processing Speed:**
- Average: 30-60 seconds per video
- Frame sampling: Every 10th frame (max 100 frames)
- Face detection: OpenCV Haar Cascades
- Emotion prediction: TensorFlow CNN model

**Accuracy:**
- Model: fea-iter-2.keras (7 emotions)
- Input: 48×48 RGB facial images
- Emotions: angry, disgust, fear, happy, sad, surprise, neutral

---

## 🔍 Troubleshooting

### Low Face Visibility
- Check camera angle and framing
- Ensure adequate lighting
- Verify actor faces camera

### Inconsistent Scores
- May indicate natural performance variation
- Check emotion timeline for context
- Review specific frame timestamps

### Low Intensity
- Actor may be performing subtle emotion
- Consider character requirements
- Not always a negative metric

---

## 📝 Notes

- All scores are on 0-100 scale for consistency
- Timeline timestamps are in seconds
- Metrics update automatically on video analysis
- Existing videos retain backward compatibility

---

**Last Updated:** March 10, 2026  
**Version:** 2.0 (Performance Metrics Enhancement)
