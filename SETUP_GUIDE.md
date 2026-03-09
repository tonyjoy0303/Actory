# Actory AI Emotion Analysis - Complete Setup Guide

## 🎯 System Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  React Frontend │ ───► │ Node.js Backend │ ───► │ Python AI Service│
│   (Port 3000)   │      │   (Port 5000)   │      │   (Port 8000)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                 │                          │
                                 ▼                          ▼
                         ┌─────────────┐          ┌─────────────┐
                         │   MongoDB   │          │ CNN Model   │
                         └─────────────┘          │ (Keras)     │
                                                  └─────────────┘
```

## 📦 Installation Steps

### 1. Python AI Service Setup

```bash
cd actory-ai-service

# Install dependencies
pip install -r requirements.txt

# Place your model file
# Copy fea-iter-2.keras to models/fea-iter-2.keras
mkdir models
# Place your fea-iter-2.keras file in models/ folder

# Start the AI service
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The AI service will be available at: http://localhost:8000

API Documentation: http://localhost:8000/docs

### 2. Node.js Backend Setup

```bash
cd actory-spotlight-backend

# Install dependencies (if not already)
npm install axios

# Set environment variable
# Add to .env file:
AI_SERVICE_URL=http://localhost:8000

# Update server.js to include new routes:
```

```javascript
// In server.js
const auditionRoutes = require('./routes/auditions');
app.use('/api/auditions', auditionRoutes);
app.use('/api', auditionRoutes); // For /api/castings/:id/submissions
```

```bash
# Start backend
npm run dev
```

### 3. React Frontend Setup

```bash
cd actory-spotlight-ui

# Install dependencies
npm install recharts @mui/material @mui/icons-material axios

# Add to .env:
REACT_APP_API_URL=http://localhost:5000/api

# Start frontend
npm start
```

## 🔧 Configuration

### Environment Variables

**actory-ai-service/.env**
```env
PORT=8000
HOST=0.0.0.0
MODEL_PATH=models/fea-iter-2.keras
LOG_LEVEL=INFO
```

**actory-spotlight-backend/.env**
```env
AI_SERVICE_URL=http://localhost:8000
MONGODB_URI=mongodb://localhost:27017/actory
```

**actory-spotlight-ui/.env**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🎬 Usage Flow

### 1. Actor Submits Audition

```javascript
// Frontend: Submit audition
const submitAudition = async (castingId, videoURL) => {
  const response = await axios.post('/api/auditions/submit', {
    castingId,
    videoURL,
    coverLetter: "I'm perfect for this role...",
    experience: "5 years of acting experience",
    availability: "Available immediately"
  });
  
  // Response: { message: "Audition submitted. AI analysis in progress.", auditionId: "..." }
};
```

### 2. Backend Processes Submission

```javascript
// Backend automatically:
// 1. Saves audition to MongoDB
// 2. Extracts required emotion from casting description
// 3. Calls AI service asynchronously
// 4. Updates audition record with AI results
```

### 3. AI Service Analyzes Video

```
AI Service Pipeline:
1. Downloads video from Cloudinary URL
2. Extracts frames (every 10th frame, max 100)
3. Detects faces using Haar Cascade
4. Resizes faces to 48x48 RGB
5. Runs emotion prediction (NO manual normalization)
6. Aggregates results across frames
7. Calculates emotion match score
8. Generates feedback
9. Returns JSON response
```

### 4. Recruiter Views Results

```javascript
// Frontend: Fetch submissions
const viewSubmissions = async (castingId) => {
  const response = await axios.get(`/api/castings/${castingId}/submissions`, {
    params: {
      sortBy: 'emotionMatchScore',
      order: 'desc'
    }
  });
  
  // Response includes AI analysis for each submission
};
```

## 📊 API Endpoints

### Python AI Service (Port 8000)

#### POST /api/analyze-video
Analyze emotion in video

**Request:**
```json
{
  "videoURL": "https://res.cloudinary.com/.../video.mp4",
  "requiredEmotion": "sad"
}
```

**Response:**
```json
{
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
  "feedback": "Good match. Actor shows 'sad' emotion...",
  "framesAnalyzed": 87
}
```

#### GET /api/health
Health check

**Response:**
```json
{
  "status": "healthy",
  "service": "Actory AI Emotion Analysis",
  "model": "fea-iter-2.keras",
  "emotions": ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
}
```

### Node.js Backend (Port 5000)

#### POST /api/auditions/submit
Submit audition (triggers AI analysis)

#### GET /api/castings/:castingId/submissions
Get submissions with AI analysis (sorted by score)

#### GET /api/auditions/:auditionId
Get single submission details

#### GET /api/ai/health
Check AI service status

## 🧪 Testing

### Test AI Service Directly

```bash
# Health check
curl http://localhost:8000/api/health

# Test analysis
curl -X POST http://localhost:8000/api/analyze-video \
  -H "Content-Type: application/json" \
  -d '{
    "videoURL": "https://res.cloudinary.com/demo/video/upload/sample.mp4",
    "requiredEmotion": "happy"
  }'
```

### Test Integration

```bash
# Check AI service from Node.js backend
curl http://localhost:5000/api/ai/health
```

## 🚨 Troubleshooting

### AI Service Not Starting
- Ensure Python 3.8+ is installed
- Check all dependencies: `pip list`
- Verify model file exists: `models/fea-iter-2.keras`
- Check port 8000 is not in use

### Model Loading Errors
- Verify model file is NOT corrupted
- Check file size (should be ~46MB)
- Ensure TensorFlow version matches: `pip show tensorflow`

### Video Download Fails
- Check Cloudinary URL is public
- Verify network connectivity
- Check temporary file permissions

### No Faces Detected
- Verify video quality
- Check if faces are visible in frames
- Adjust detection parameters if needed

### Backend Cannot Connect to AI Service
- Check `AI_SERVICE_URL` environment variable
- Ensure AI service is running on port 8000
- Check firewall settings

## 📈 Performance Optimization

### Production Recommendations

1. **AI Service Scaling**
   - Deploy as separate Docker container
   - Use GPU for faster inference
   - Implement request queuing for high load

2. **Caching**
   - Cache analyzed results in MongoDB
   - Store frame extraction results

3. **Async Processing**
   - Use job queue (Bull, RabbitMQ) for video analysis
   - Implement webhooks for completion notifications

4. **Model Optimization**
   - Use TensorFlow Lite for faster inference
   - Batch process multiple videos

## 🔐 Security

- Validate video URLs before processing
- Implement rate limiting on AI endpoints
- Secure AI service with API keys
- Use HTTPS in production

## 📝 Model Details

**fea-iter-2.keras**
- Input: 48×48 RGB images (0-255 pixel values)
- Output: 7 emotion probabilities
- Internal preprocessing: Rescaling layer (1/255)
- **CRITICAL**: Do NOT normalize input manually

## 🎨 Frontend Integration

Use the provided `SubmissionsDashboard` component:

```jsx
import SubmissionsDashboard from './components/SubmissionsDashboard';

function RecruiterPage() {
  return <SubmissionsDashboard castingId="your-casting-id" />;
}
```

## ✅ Verification Checklist

- [ ] Python AI service running on port 8000
- [ ] Model file placed in `models/fea-iter-2.keras`
- [ ] Node.js backend running on port 5000
- [ ] MongoDB connected
- [ ] Environment variables configured
- [ ] React frontend running on port 3000
- [ ] AI health check passes: `curl localhost:8000/api/health`
- [ ] Backend can connect to AI: `curl localhost:5000/api/ai/health`

## 🎉 Success!

Your Actory AI Emotion Analysis system is now ready!

Actors can submit auditions → AI analyzes emotions → Recruiters view results with scores and charts.
