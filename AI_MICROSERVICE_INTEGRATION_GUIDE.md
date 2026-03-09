# Actory AI Microservice - Complete Integration Guide

## Overview

The Actory platform has been refactored to use a **separate Python FastAPI microservice** for emotion analysis instead of spawning Python processes from Node.js. This improves:

- ✅ Deployment reliability (no TensorFlow in Node environment)
- ✅ Scalability (scale AI independently)
- ✅ Performance (dedicated resources for AI)
- ✅ Maintainability (AI and API logically separated)

## Architecture

```
┌─────────────────────────────┐
│   Actory Frontend (React)   │
└────────────┬────────────────┘
             │
             │ HTTP Requests
             ▼
┌─────────────────────────────────────┐
│  Node.js Backend (Express)          │
│                                     │
│  - Handles auth, CRUD, WebSocket   │
│  - Calls AI service for analysis   │
└────────────┬────────────────────────┘
             │
             │ HTTP API Calls
             │ GET /analyze
             │ POST /analyze
             ▼
┌──────────────────────────────────────┐
│  Python AI Service (FastAPI)         │
│                                      │
│  - Emotion analysis                 │
│  - Video processing                 │
│  - Model inference                  │
└──────────────────────────────────────┘
```

## File Structure

### New AI Service Directory

```
actory-ai-service/
├── app.py                      # FastAPI application
├── emotion_video_analyzer.py   # Core analysis logic
├── model_loader.py             # Keras model loader
├── face_detector.py            # OpenCV face detection
├── fea-iter-2.keras           # Trained emotion model
├── requirements.txt            # Python dependencies
├── runtime.txt                 # Python version (3.10.13)
├── render.yaml                 # Render deployment config
├── .env.example                # Environment variables
├── .gitignore                  # Git ignore rules
├── test_service.py             # Test script
└── README.md                   # Service documentation
```

### Updated Backend Files

- **utils/aiIntegration.js** - Updated to use HTTP API instead of child processes
- **env.example** - Added AI_SERVICE_URL configuration

## Setup Instructions

### 1. Local Development

#### Option A: Both services locally

**Terminal 1 - Start AI Service:**
```bash
cd actory-ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
# Service runs on http://localhost:10000
```

**Terminal 2 - Start Node.js Backend:**
```bash
cd actory-spotlight-backend
npm install
npm run dev
# Backend runs on http://localhost:5000
# AI_SERVICE_URL=http://localhost:10000 (default)
```

**Terminal 3 - Test AI Service:**
```bash
cd actory-ai-service
python test_service.py
```

#### Option B: AI service only (use deployed version)

If you have AI service deployed on Render:
```bash
cd actory-spotlight-backend
echo "AI_SERVICE_URL=https://your-ai-service.onrender.com" >> .env
npm install
npm run dev
```

### 2. Deployment Setup

#### Deploy AI Service First (Separate Repository)

1. **Create a new repository for the AI service** (or separate branch)
   ```bash
   # Option: New repo
   cd actory-ai-service
   git init
   git add .
   git commit -m "Initial AI service commit"
   git branch -M main
   # Create new repo on GitHub
   git remote add origin https://github.com/yourusername/actory-ai-service.git
   git push -u origin main
   ```

2. **Deploy to Render:**
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect your AI service repository
   - Render will automatically detect `render.yaml` and configure:
     - Runtime: Python 3.10.13
     - Build: `pip install -r requirements.txt`
     - Start: `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - Copy the deployed URL (e.g., `https://actory-ai-service.onrender.com`)

#### Deploy Node.js Backend

1. **Update backend .env for production:**
   ```bash
   # In actory-spotlight-backend/.env (or environment variables in Render)
   AI_SERVICE_URL=https://actory-ai-service.onrender.com
   ```

2. **Deploy to Render:**
   - Go to [render.com](https://render.com)
   - Create new Web Service for backend
   - Connect your main repository
   - Add environment variable: `AI_SERVICE_URL=https://actory-ai-service.onrender.com`
   - Deploy

### 3. Environment Variables

#### AI Service (.env or Render environment)
```
PORT=10000  # Render provides this automatically
```

#### Node.js Backend (.env or Render environment)
```
# ... existing variables ...
AI_SERVICE_URL=http://localhost:10000      # Local development
# OR
AI_SERVICE_URL=https://your-ai-service.onrender.com  # Production
```

## API Integration

### Backend Code Changes

The backend now uses HTTP API calls instead of spawning Python processes:

**Before:**
```javascript
// Old: Spawned child process
const { spawn } = require('child_process');
const pythonProcess = spawn('python', ['ai/emotion_video_analyzer.py', url, emotion]);
```

**After:**
```javascript
// New: HTTP API call
const result = await analyzeVideoEmotion(videoUrl, requiredEmotion);
// Which internally calls:
// GET http://localhost:10000/analyze?video_url=...&required_emotion=...
```

### API Endpoint

**Request:**
```bash
GET http://localhost:10000/analyze?video_url=...&required_emotion=happy
```

**Response:**
```json
{
  "success": true,
  "requiredEmotion": "happy",
  "detectedEmotion": "happy",
  "emotionScores": {
    "happy": 0.856,
    "sad": 0.023,
    ...
  },
  "emotionMatchScore": 85,
  "confidence": 0.856,
  "overallScore": 85,
  "feedback": "Excellent! Actor's happy expression strongly matches the required emotion.",
  "framesAnalyzed": 45
}
```

## Testing

### Local Testing

```bash
# Test AI service health
curl http://localhost:10000/health

# Test AI service analysis
curl "http://localhost:10000/analyze?video_url=https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4&required_emotion=happy"

# Run test suite
cd actory-ai-service
python test_service.py
```

### Production Testing

```bash
# Test deployed AI service
curl https://your-ai-service.onrender.com/health

# Test backend integration
curl -X POST http://localhost:5000/api/v1/videos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "...", "requiredEmotion": "happy"}'
```

## Troubleshooting

### "Cannot connect to AI service"
```
Error: AI service is not available. Please ensure the AI microservice is running.
```

**Solution:**
1. Check AI service is running: `curl http://localhost:10000/health`
2. Check AI_SERVICE_URL in backend .env
3. If using deployed service, verify the URL is correct

### "Analysis timeout"
The AI service may need more time to download/process video.
- Increase timeout in production (currently 5 minutes)
- Check video URL is accessible
- Check network connectivity

### Model file not found
```
FileNotFoundError: Model file not found at: fea-iter-2.keras
```

**Solution:**
Ensure `fea-iter-2.keras` is in the `actory-ai-service/` directory.

### CORS Issues
The AI service has CORS enabled for all origins in development.
For production, configure CORS origins in `app.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.com"],  # Restrict to frontend
    ...
)
```

## Monitoring & Logging

### AI Service Logs

On Render dashboard:
1. Go to your AI service
2. Click "Logs" tab
3. View real-time logs

Key log patterns:
- `[API] Analyzing video:` - Analysis started
- `[OK] Extracted X frames` - Frame extraction complete
- `[API] Analysis successful` - Analysis completed
- `✗ Error:` - Analysis failed

### Backend Logs

On Render dashboard or local console:
- `[AI] Calling AI service` - Backend initiated analysis
- `[AI] Analysis successful` - Result received
- `[AI] AI service error` - Error from AI service

## Performance Optimization

### AI Service
- Analyzes every 10th frame (configurable `FRAME_SKIP`)
- Limits to 100 frames max per video
- Uses headless OpenCV (no GUI overhead)
- Lazy loads model on first request

### Backend
- No longer spawns child processes
- Makes single HTTP request per analysis
- Can scale independently of AI service

### Scaling Strategy

**Horizontal Scaling:**
1. Deploy multiple instances of AI service (Render auto-scaling)
2. Put behind load balancer
3. Set `AI_SERVICE_URL` to load balancer endpoint

**Vertical Scaling:**
Render > Settings > Instance Type (increase CPU/RAM)

## Security Considerations

1. **Authentication**: Add authentication headers if needed
   ```javascript
   const response = await axios.get(url, {
     headers: { 'Authorization': `Bearer ${API_KEY}` }
   });
   ```

2. **CORS**: Restrict origins in production
   ```python
   allow_origins=["https://actory-frontend.com"]
   ```

3. **Rate Limiting**: Consider implementing rate limits
   ```python
   from slowapi import Limiter
   limiter = Limiter(key_func=get_remote_address)
   ```

4. **Input Validation**: Backend validates video URL and emotion

## Rollback Plan

If you need to revert to child process approach:

1. Revert `utils/aiIntegration.js` to use `spawn()`
2. Keep `ai/` directory in backend
3. Remove `AI_SERVICE_URL` from env
4. Deploy backend

## Next Steps

1. ✅ Test locally
2. ✅ Deploy AI service to Render
3. ✅ Deploy backend with AI_SERVICE_URL
4. ✅ Monitor logs and performance
5. ✅ Scale as needed

## Support

For issues:
1. Check logs in Render dashboard
2. Run test suite: `python test_service.py`
3. Verify connectivity between services
4. Check environment variables

---

**Last Updated**: March 5, 2026
**Status**: Production Ready
