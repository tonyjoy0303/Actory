"""
FastAPI Routes for Video Emotion Analysis
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, List
from services.emotion_video_analyzer import VideoEmotionAnalyzer

# Initialize router
router = APIRouter()

# Initialize analyzer (singleton)
analyzer = None

def get_analyzer():
    """Get or create analyzer instance"""
    global analyzer
    if analyzer is None:
        analyzer = VideoEmotionAnalyzer()
    return analyzer

# Request/Response Models
class AnalyzeVideoRequest(BaseModel):
    videoURL: str = Field(..., description="Cloudinary video URL")
    requiredEmotion: str = Field(..., description="Required emotion for casting")
    
    class Config:
        json_schema_extra = {
            "example": {
                "videoURL": "https://res.cloudinary.com/demo/video/upload/v1234567890/audition.mp4",
                "requiredEmotion": "sad"
            }
        }

class EmotionScores(BaseModel):
    angry: float
    disgust: float
    fear: float
    happy: float
    sad: float
    surprise: float
    neutral: float

class EmotionTimelineSegment(BaseModel):
    emotion: str
    start: float
    end: float

class AnalyzeVideoResponse(BaseModel):
    success: bool
    requiredEmotion: str
    faceEmotion: str
    voiceEmotion: str
    faceConfidence: float = Field(..., ge=0, le=1)
    voiceConfidence: float = Field(..., ge=0, le=1)
    combinedEmotionConfidence: float = Field(..., ge=0, le=1)
    detectedEmotion: str
    emotionScores: EmotionScores
    emotionMatchScore: int = Field(..., ge=0, le=100)
    emotionConsistency: int = Field(..., ge=0, le=100)
    expressionIntensity: int = Field(..., ge=0, le=100)
    faceVisibility: int = Field(..., ge=0, le=100)
    overallPerformanceScore: int = Field(..., ge=0, le=100)
    emotionTimeline: List[EmotionTimelineSegment]
    framesAnalyzed: int
    feedback: str

@router.post("/analyze-video", response_model=AnalyzeVideoResponse, status_code=status.HTTP_200_OK)
async def analyze_video(request: AnalyzeVideoRequest):
    """
    Analyze emotion in an audition video
    
    - Downloads video from Cloudinary URL
    - Extracts frames and detects faces
    - Analyzes emotion using CNN model
    - Returns aggregated emotion analysis
    """
    try:
        print(f"\n🌐 [API REQUEST] POST /api/analyze-video", flush=True)
        print(f"📥 Required emotion: {request.requiredEmotion}", flush=True)
        print(f"🔗 Video URL: {request.videoURL[:100]}...", flush=True)
        
        analyzer_instance = get_analyzer()
        
        result = analyzer_instance.analyze_video(
            video_url=request.videoURL,
            required_emotion=request.requiredEmotion
        )
        
        print(f"📤 [API RESPONSE] Status: 200 OK", flush=True)
        return result
        
    except Exception as e:
        print(f"❌ [API ERROR] Status: 500 | Error: {str(e)}", flush=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video analysis failed: {str(e)}"
        )

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Health check endpoint
    
    Returns service status and model information
    """
    try:
        analyzer_instance = get_analyzer()
        
        return {
            "status": "healthy",
            "service": "Actory AI Emotion Analysis",
            "model": "fea-iter-2.keras",
            "emotions": ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
        )
