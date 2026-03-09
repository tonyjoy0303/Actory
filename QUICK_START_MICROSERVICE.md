# 🚀 QUICK START - AI Microservice

## ⚡ Get Running in 30 Seconds

### Option 1: Local Development (Recommended)

**Terminal 1** - Start AI Service:
```bash
cd actory-ai-service
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
✅ Service runs on `http://localhost:10000`

**Terminal 2** - Start Backend:
```bash
cd actory-spotlight-backend
npm install  # Only first time
npm run dev
```
✅ Backend runs on `http://localhost:5000`

**Terminal 3** - Test:
```bash
cd actory-ai-service
python test_service.py
```

---

## 🌐 Production Deployment (Render)

### Step 1: Deploy AI Service (First)
```bash
# Create repo for AI service
cd actory-ai-service
git init
git add .
git commit -m "Initial AI service"

# Go to render.com
# New Web Service → Connect GitHub repo
# Render auto-detects render.yaml and deploys
# Copy URL: https://your-ai-service.onrender.com
```

### Step 2: Deploy Backend
```bash
# In actory-spotlight-backend/.env or Render dashboard
AI_SERVICE_URL=https://your-ai-service.onrender.com

# Deploy to Render
# Render auto-deploys on push
```

---

## ✅ Verify It Works

### Health Check
```bash
# Local
curl http://localhost:10000/health

# Production
curl https://your-ai-service.onrender.com/health
```

### Test Analysis
```bash
curl "http://localhost:10000/analyze?video_url=https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4&required_emotion=happy"
```

---

## 📁 What Was Created

```
actory-ai-service/
├── app.py                      ← FastAPI server
├── emotion_video_analyzer.py   ← Analysis logic
├── model_loader.py             ← Model loader
├── face_detector.py            ← Face detection
├── fea-iter-2.keras           ← Emotion model
├── requirements.txt            ← Python dependencies
├── render.yaml                 ← Deployment config
└── README.md                   ← Full documentation
```

---

## 🔌 Backend Changes

**File**: `actory-spotlight-backend/utils/aiIntegration.js`

**Old**: `spawn('python', [...])`  
**New**: `axios.get('http://localhost:10000/analyze')`

✅ Automatic! Already updated!

---

## 🐛 Troubleshooting

### "Cannot connect"
```bash
# Check if AI service is running
curl http://localhost:10000/health
# Should return: {"status": "healthy", "model_loaded": true}
```

### "Analysis failed"
```bash
# Check logs in Terminal 1 (AI service)
# Look for error messages

# Test with test script
python actory-ai-service/test_service.py
```

### "Model not found"
```bash
# Verify fea-iter-2.keras exists
ls -la actory-ai-service/fea-iter-2.keras
```

---

## 📚 Full Docs

- **Integration Guide**: `AI_MICROSERVICE_INTEGRATION_GUIDE.md`
- **Conversion Summary**: `MICROSERVICE_CONVERSION_SUMMARY.md`
- **API Documentation**: `actory-ai-service/README.md`

---

## 💡 Key Points

✅ **Tested locally first**  
✅ **Render deployment ready**  
✅ **Same exact functionality**  
✅ **No breaking changes**  
✅ **Better scalability**  
✅ **No TensorFlow issues**

---

**Questions?** Check the full documentation files above!
