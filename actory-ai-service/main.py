"""
Actory AI Emotion Analysis Service

FastAPI microservice for video emotion detection in casting platform.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
import uvicorn

# Create FastAPI app
app = FastAPI(
    title="Actory AI Emotion Analysis",
    description="Microservice for analyzing emotions in audition videos",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api", tags=["emotion-analysis"])

@app.on_event("startup")
async def startup_event():
    """Startup event - log service initialization"""
    print("\n" + "="*80, flush=True)
    print("🤖 ACTORY AI EMOTION ANALYSIS SERVICE", flush=True)
    print("="*80, flush=True)
    print("📋 Service: Actory AI Emotion Analysis v1.0.0", flush=True)
    print("🌐 Host: 0.0.0.0:8000", flush=True)
    print("📊 Model: fea-iter-2.keras (7 emotions)", flush=True)
    print("🎭 Emotions: angry, disgust, fear, happy, sad, surprise, neutral", flush=True)
    print("📡 Endpoints: POST /api/analyze-video | GET /api/health", flush=True)
    print("="*80, flush=True)
    print("✅ Service initialized and ready for requests\n", flush=True)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Actory AI Emotion Analysis",
        "status": "running",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
