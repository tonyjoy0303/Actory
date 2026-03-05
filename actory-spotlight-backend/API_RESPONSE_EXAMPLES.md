# API Response Examples - AI Emotion Analysis

This document contains example API responses for the AI emotion analysis endpoints.

---

## 1. Get Submissions with AI Analysis

**Endpoint:** `GET /api/v1/castings/:castingId/submissions`

**Request:**
```http
GET /api/v1/castings/64f3a2b1c9e8f12345678901/submissions?sort=overallScore&filter=50
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "64f3a3c1d9e8f12345678902",
      "actor": {
        "_id": "64f3a1a1c9e8f12345678900",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "gender": "male",
        "profileImage": "https://res.cloudinary.com/demo/image/upload/v1/john.jpg"
      },
      "videoUrl": "https://res.cloudinary.com/demo/video/upload/v1/audition_001.mp4",
      "status": "Pending",
      "createdAt": "2024-03-15T10:30:00.000Z",
      "aiAnalyzed": true,
      "analyzedAt": "2024-03-15T10:32:45.000Z",
      "requiredEmotion": "sad",
      "detectedEmotion": "sad",
      "emotionScores": {
        "angry": 0.03,
        "disgust": 0.02,
        "fear": 0.08,
        "happy": 0.01,
        "sad": 0.72,
        "surprise": 0.04,
        "neutral": 0.10
      },
      "emotionMatchScore": 72,
      "confidence": 0.72,
      "overallScore": 72,
      "feedback": "Excellent! Actor's sad expression strongly matches the required emotion.",
      "framesAnalyzed": 95,
      "qualityScore": 85
    },
    {
      "_id": "64f3a3c2d9e8f12345678903",
      "actor": {
        "_id": "64f3a1a2c9e8f12345678911",
        "name": "Jane Smith",
        "email": "jane.smith@example.com",
        "gender": "female",
        "profileImage": "https://res.cloudinary.com/demo/image/upload/v1/jane.jpg"
      },
      "videoUrl": "https://res.cloudinary.com/demo/video/upload/v1/audition_002.mp4",
      "status": "Pending",
      "createdAt": "2024-03-15T11:00:00.000Z",
      "aiAnalyzed": true,
      "analyzedAt": "2024-03-15T11:02:30.000Z",
      "requiredEmotion": "sad",
      "detectedEmotion": "neutral",
      "emotionScores": {
        "angry": 0.05,
        "disgust": 0.02,
        "fear": 0.06,
        "happy": 0.08,
        "sad": 0.28,
        "surprise": 0.03,
        "neutral": 0.48
      },
      "emotionMatchScore": 62,
      "confidence": 0.48,
      "overallScore": 55,
      "feedback": "Good match. Actor shows some sad emotion (62%) though neutral is dominant.",
      "framesAnalyzed": 87,
      "qualityScore": 78
    },
    {
      "_id": "64f3a3c3d9e8f12345678904",
      "actor": {
        "_id": "64f3a1a3c9e8f12345678922",
        "name": "Mike Johnson",
        "email": "mike.j@example.com",
        "gender": "male",
        "profileImage": "https://res.cloudinary.com/demo/image/upload/v1/mike.jpg"
      },
      "videoUrl": "https://res.cloudinary.com/demo/video/upload/v1/audition_003.mp4",
      "status": "Pending",
      "createdAt": "2024-03-15T12:15:00.000Z",
      "aiAnalyzed": true,
      "analyzedAt": "2024-03-15T12:17:20.000Z",
      "requiredEmotion": "sad",
      "detectedEmotion": "happy",
      "emotionScores": {
        "angry": 0.02,
        "disgust": 0.01,
        "fear": 0.03,
        "happy": 0.65,
        "sad": 0.05,
        "surprise": 0.15,
        "neutral": 0.09
      },
      "emotionMatchScore": 5,
      "confidence": 0.65,
      "overallScore": 35,
      "feedback": "Low match. Actor shows happy emotion, but minimal sad expression (5%).",
      "framesAnalyzed": 92,
      "qualityScore": 90
    }
  ]
}
```

---

## 2. Re-analyze Submission

**Endpoint:** `POST /api/v1/auditions/:auditionId/reanalyze`

**Request:**
```http
POST /api/v1/auditions/64f3a3c2d9e8f12345678903/reanalyze
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Audition re-analyzed successfully",
  "data": {
    "_id": "64f3a3c2d9e8f12345678903",
    "aiAnalysis": {
      "analyzed": true,
      "requiredEmotion": "sad",
      "detectedEmotion": "neutral",
      "emotionScores": {
        "angry": 0.05,
        "disgust": 0.02,
        "fear": 0.06,
        "happy": 0.08,
        "sad": 0.28,
        "surprise": 0.03,
        "neutral": 0.48
      },
      "emotionMatchScore": 62,
      "confidence": 0.48,
      "overallScore": 55,
      "feedback": "Good match. Actor shows some sad emotion (62%) though neutral is dominant.",
      "framesAnalyzed": 87,
      "analyzedAt": "2024-03-15T14:30:22.000Z",
      "error": null
    }
  }
}
```

---

## 3. Get Submission Details

**Endpoint:** `GET /api/v1/auditions/:auditionId`

**Request:**
```http
GET /api/v1/auditions/64f3a3c1d9e8f12345678902
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "_id": "64f3a3c1d9e8f12345678902",
    "title": "Audition for Dramatic Scene",
    "videoUrl": "https://res.cloudinary.com/demo/video/upload/v1/audition_001.mp4",
    "cloudinaryId": "actory/auditions/abc123def456",
    "portfolioUrl": "https://res.cloudinary.com/demo/raw/upload/v1/portfolio.pdf",
    "idProofUrl": "https://res.cloudinary.com/demo/image/upload/v1/id_proof.jpg",
    "webcamPhotoUrl": "https://res.cloudinary.com/demo/image/upload/v1/webcam.jpg",
    "type": "audition",
    "height": 175,
    "weight": 70,
    "age": 28,
    "skills": ["Acting", "Dancing", "Singing"],
    "permanentAddress": "123 Main St, New York, NY 10001",
    "livingCity": "New York",
    "dateOfBirth": "1996-05-15T00:00:00.000Z",
    "phoneNumber": "+1-555-123-4567",
    "email": "john.doe@example.com",
    "status": "Pending",
    "views": 15,
    "likes": 3,
    "comments": 2,
    "actor": {
      "_id": "64f3a1a1c9e8f12345678900",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "gender": "male",
      "profileImage": "https://res.cloudinary.com/demo/image/upload/v1/john.jpg"
    },
    "castingCall": {
      "_id": "64f3a2b1c9e8f12345678901",
      "roleTitle": "Lead Actor - Dramatic Role",
      "description": "Looking for a talented actor who can portray deep sadness and emotional vulnerability...",
      "requiredEmotion": "sad"
    },
    "qualityAssessment": {
      "level": "High",
      "score": 85,
      "details": {
        "scores": {
          "video": {
            "resolution": 90,
            "duration": 85,
            "lighting": 80,
            "audio": 85
          }
        }
      }
    },
    "aiAnalysis": {
      "analyzed": true,
      "requiredEmotion": "sad",
      "detectedEmotion": "sad",
      "emotionScores": {
        "angry": 0.03,
        "disgust": 0.02,
        "fear": 0.08,
        "happy": 0.01,
        "sad": 0.72,
        "surprise": 0.04,
        "neutral": 0.10
      },
      "emotionMatchScore": 72,
      "confidence": 0.72,
      "overallScore": 72,
      "feedback": "Excellent! Actor's sad expression strongly matches the required emotion.",
      "framesAnalyzed": 95,
      "analyzedAt": "2024-03-15T10:32:45.000Z",
      "error": null
    },
    "createdAt": "2024-03-15T10:30:00.000Z"
  }
}
```

---

## 4. Error Response - Analysis Failed

**Endpoint:** `POST /api/v1/auditions/:auditionId/reanalyze`

**Response:** `500 Internal Server Error`
```json
{
  "success": false,
  "message": "Analysis failed: No faces detected in video. Please ensure the actor's face is clearly visible."
}
```

---

## 5. Error Response - Unauthorized

**Endpoint:** `GET /api/v1/castings/:castingId/submissions`

**Response:** `403 Forbidden`
```json
{
  "success": false,
  "message": "Not authorized to view these submissions"
}
```

---

## 6. Error Response - Not Found

**Endpoint:** `GET /api/v1/auditions/:auditionId`

**Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "Audition not found"
}
```

---

## 7. Python Script Direct Output

**Command:**
```bash
python emotion_video_analyzer.py "https://example.com/video.mp4" "happy"
```

**Stdout Output:**
```json
{
  "success": true,
  "requiredEmotion": "happy",
  "detectedEmotion": "happy",
  "emotionScores": {
    "angry": 0.02,
    "disgust": 0.01,
    "fear": 0.03,
    "happy": 0.78,
    "sad": 0.05,
    "surprise": 0.06,
    "neutral": 0.05
  },
  "emotionMatchScore": 78,
  "confidence": 0.78,
  "overallScore": 78,
  "feedback": "Excellent! Actor's happy expression strongly matches the required emotion.",
  "framesAnalyzed": 92
}
```

**Stderr Output (Logging):**
```
Downloading video from: https://example.com/video.mp4
✓ Video downloaded to: /tmp/tmpXYZ123.mp4
Extracting frames from video...
✓ Extracted 92 frames from 920 total frames
Analyzing 92 frames for emotions...
  Processed 20/92 frames...
  Processed 40/92 frames...
  Processed 60/92 frames...
  Processed 80/92 frames...
✓ Found faces in 89/92 frames
✓ Cleaned up temporary file
```

---

## Notes

- All timestamp fields are in ISO 8601 format
- Emotion scores are probabilities (0-1 range)
- Match scores and overall scores are percentages (0-100 range)
- Confidence is a probability (0-1 range)
- The `framesAnalyzed` field shows how many frames had detectable faces
