# Render Deployment Guide (Voice + Face)

This guide deploys the AI service on Render with both:
- Face emotion analysis (TensorFlow CNN)
- Voice emotion analysis (SpeechBrain/HF + FFmpeg audio extraction)

## 1) Why this must use Docker

Voice analysis needs system packages (especially `ffmpeg`) in addition to Python deps.
Using Docker guarantees the runtime includes everything required.

## 2) Files required (already added)

- `Dockerfile`
- `.dockerignore`

The Docker image installs:
- `ffmpeg`
- OpenCV runtime libs
- audio libs (`libsndfile1`)
- full Python stack from `requirements-voice.txt`

## 3) Render service creation (manual)

1. Push this repository to GitHub.
2. In Render dashboard, create **New Web Service**.
3. Connect your repository.
4. Configure:
   - **Environment**: Docker
   - **Root Directory**: `actory-ai-service`
   - **Dockerfile Path**: `./Dockerfile`
   - **Health Check Path**: `/api/health`
   - **Plan**: Starter or above (recommended for ML workloads)

## 3.1) Python version on Render

- Use **Python 3.10.x** (for example, 3.10.13).
- Python "10" is not a valid Python release.
- In this setup, Python is pinned by Docker image base in `Dockerfile`:
  - `FROM python:3.10-slim`
- Because deployment is Docker-based, Render runtime language settings are not used for Python selection.

## 4) Environment variables for AI service

Set these in Render:

- `REQUIRE_VOICE_ANALYSIS=false`
- `LOG_LEVEL=INFO`

Optional:

- `MODEL_PATH=models/fea-iter-2.keras`

Notes:
- Do not set `PORT`; Render injects it automatically.
- `REQUIRE_VOICE_ANALYSIS=false` enables fallback mode (voice attempted, face-only fallback on failure).

## 5) Start command

No custom command needed if using provided Dockerfile.
Docker `CMD` already runs:

`uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}`

## 6) Connect backend to this AI service

In backend Render service env vars:

- `AI_SERVICE_URL=https://<your-ai-service-name>.onrender.com`

## 7) Verify deployment

### Health check

`GET https://<your-ai-service-name>.onrender.com/api/health`

Expected: healthy JSON response.

### Analysis check

`POST https://<your-ai-service-name>.onrender.com/api/analyze-video`

Body:

```json
{
  "videoURL": "https://res.cloudinary.com/demo/video/upload/v1234567890/audition.mp4",
  "requiredEmotion": "sad"
}
```

Expected response includes both:
- `faceEmotion`
- `voiceEmotion`

## 8) Troubleshooting

### Service fails at startup

- Check Render logs for model download/dependency errors.
- Ensure plan has enough RAM/CPU for TensorFlow + Torch model loads.

### Voice fails in requests

- With fallback mode (`REQUIRE_VOICE_ANALYSIS=false`), service continues with face-only analysis when voice is unavailable.
- Check logs for FFmpeg or model initialization errors.

### Backend still shows fallback/failed AI

- Confirm backend `AI_SERVICE_URL` points to Render AI service URL.
- Redeploy backend after changing env vars.

## 9) Recommended production settings

- Keep `REQUIRE_VOICE_ANALYSIS=false` for resilient production behavior (voice attempt + face fallback).
- Use `REQUIRE_VOICE_ANALYSIS=true` only when strict failure is required.
- Use Render Starter+ for stable cold starts and memory headroom.
- Monitor startup and request logs for model load durations.
