# Actory AI Emotion Analysis Service

Python FastAPI microservice for video emotion analysis in the Actory casting platform.

## Features

- Video emotion detection using CNN model (fea-iter-2.keras)
- Face detection with OpenCV Haar Cascade
- Cloudinary video download support
- RESTful API with FastAPI
- Emotion scoring and matching

## Installation

```bash
pip install -r requirements.txt
```

This installs the smaller facial-analysis-only setup.

For voice emotion analysis too, install the optional heavy dependencies:

```bash
pip install -r requirements-voice.txt
```

Voice analysis is optional by default. To require it at runtime, set:

```bash
REQUIRE_VOICE_ANALYSIS=true
```

## Model Setup

Place the trained model file:
- `models/fea-iter-2.keras` (48x48 RGB emotion CNN)

The model has internal Rescaling layer - no manual normalization needed.

## Running the Service

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Deploy on Render (Voice + Face)

To run both face and voice emotion analysis reliably on Render, deploy this service as a Docker web service.

### Why Docker?

- Voice analysis requires FFmpeg and additional system libraries.
- Docker ensures consistent runtime for TensorFlow, Torch, librosa, and SpeechBrain.

### Option A: Render Blueprint (recommended)

This repository root includes a `render.yaml` entry for `actory-ai-service`.

1. Push your latest changes to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Select this repository and apply the blueprint.
4. Render will build `actory-ai-service/Dockerfile` and expose `/api/health`.

Set these environment values for the AI service:

- `REQUIRE_VOICE_ANALYSIS=false` (recommended fallback mode: use face-only if voice fails)
- `LOG_LEVEL=INFO`

Set this on your backend service:

- `AI_SERVICE_URL=https://actory-ai-service.onrender.com`

### Option B: Manual Render Web Service

1. Create a new Web Service in Render.
2. Set:
  - **Environment**: Docker
  - **Root Directory**: `actory-ai-service`
  - **Dockerfile Path**: `./Dockerfile`
  - **Health Check Path**: `/api/health`
  - **Python Version**: pinned by Docker (`FROM python:3.10-slim`)
3. Add env vars:
  - `REQUIRE_VOICE_ANALYSIS=false`
  - `LOG_LEVEL=INFO`

### Verify

- `GET /api/health` returns healthy status.
- `POST /api/analyze-video` returns both `faceEmotion` and `voiceEmotion` fields.

If voice initialization fails in fallback mode, the service continues with face-only analysis. Set `REQUIRE_VOICE_ANALYSIS=true` only when you want strict failure instead.

For a concise checklist, see `RENDER_VOICE_FACE_DEPLOYMENT.md`.

## API Endpoints

### POST /analyze-video

Analyze emotion in a video.

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
  "feedback": "Actor emotion partially matches the casting requirement",
  "framesAnalyzed": 87
}
```

### GET /health

Health check endpoint.

## Architecture

```
actory-ai-service/
├── models/
│   └── fea-iter-2.keras
├── services/
│   ├── model_loader.py
│   ├── face_detector.py
│   └── emotion_video_analyzer.py
├── api/
│   └── routes.py
├── main.py
├── requirements.txt
└── README.md
```

## Emotion Labels

- angry
- disgust
- fear
- happy
- sad
- surprise
- neutral
