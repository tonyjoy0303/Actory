FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System dependencies for OpenCV, librosa/audio tooling, and FFmpeg extraction.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-voice.txt requirements-voice.txt
COPY requirements.txt requirements.txt
RUN pip install --upgrade pip setuptools wheel && pip install -r requirements-voice.txt

COPY . .

EXPOSE 8000

# Render injects $PORT at runtime.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
