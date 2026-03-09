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

## Model Setup

Place the trained model file:
- `models/fea-iter-2.keras` (48x48 RGB emotion CNN)

The model has internal Rescaling layer - no manual normalization needed.

## Running the Service

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

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
