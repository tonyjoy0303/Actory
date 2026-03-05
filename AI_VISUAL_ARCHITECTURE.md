# 🤖 AI EMOTION MATCHING SYSTEM - VISUAL ARCHITECTURE

---

## 🏗️ SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ACTORY PLATFORM                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐                    ┌──────────────────┐      │
│  │    FRONTEND      │                    │    BACKEND       │      │
│  │   (React.js)     │                    │   (Node.js)      │      │
│  ├──────────────────┤                    ├──────────────────┤      │
│  │                  │                    │                  │      │
│  │ SubmissionsPage  │◄──── HTTP API ────►│ Express Routes   │      │
│  │                  │                    │                  │      │
│  │ - Statistics     │                    │ - /submissions   │      │
│  │ - Emotion Badges │                    │ - /reanalyze     │      │
│  │ - Sorting        │                    │ - /details       │      │
│  │ - Filtering      │                    │                  │      │
│  │ - Video Preview  │                    │ Controllers      │      │
│  │ - Re-analyze     │                    │ - submissions.js │      │
│  │                  │                    │ - casting.js     │      │
│  │ TailwindCSS      │                    │ - videos.js      │      │
│  │ ShadCN UI        │                    │                  │      │
│  │ TanStack Query   │                    │ Utilities        │      │
│  │                  │                    │ - emotionExtr.js │      │
│  └──────────────────┘                    │ - aiInteg.js     │      │
│                                           │                  │      │
│                                           │ MongoDB          │      │
│                                           │ - CastingCall    │      │
│                                           │ - Video          │      │
│                                           │ - User           │      │
│                                           │                  │      │
│                                           └──────────────────┘      │
│                                                  │                  │
│                                            Spawns Python            │
│                                                  │                  │
│  ┌──────────────────────────────────────────────▼───────────────┐ │
│  │                    🐍 PYTHON AI SYSTEM                       │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  analyze.py (Entry Point)                                   │ │
│  │  ├─ Receive: videoUrl, requiredEmotion                      │ │
│  │  ├─ Import face_analysis.py                                 │ │
│  │  ├─ Import emotion_match.py                                 │ │
│  │  └─ Orchestrate analysis                                    │ │
│  │      │                                                       │ │
│  │      ├─► face_analysis.py                                   │ │
│  │      │   ├─ Extract first frame with OpenCV                 │ │
│  │      │   ├─ Check brightness & face presence                │ │
│  │      │   └─ Detect emotion with DeepFace                    │ │
│  │      │       Returns: detectedEmotion, confidence           │ │
│  │      │                                                       │ │
│  │      └─► emotion_match.py                                   │ │
│  │          ├─ Load similarity matrix                          │ │
│  │          ├─ Compare emotions                                │ │
│  │          └─ Calculate match score                           │ │
│  │                                                               │ │
│  │  Output: JSON {                                             │ │
│  │    success: true,                                           │ │
│  │    requiredEmotion: "happy",                                │ │
│  │    detectedEmotion: "happy",                                │ │
│  │    emotionMatchScore: 100,                                  │ │
│  │    confidence: 0.95,                                        │ │
│  │    overallScore: 97.5,                                      │ │
│  │    feedback: "Excellent...",                                │ │
│  │    matchReason: "..."                                       │ │
│  │  }                                                           │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 COMPLETE DATA FLOW

```
STEP 1: RECRUITER CREATES CASTING
────────────────────────────────────────

  Recruiter: "I need a happy, joyful character"
         │
         └────────────────────────────────────┬──────────────┐
                                              │              │
                                    CastingCall Input    Emotion Extractor
                                              │              │
                                              │ Extract ◄────┘
                                              │ Text-to-
                                              │ Emotion
                                              ▼
                                    ┌──────────────────┐
                                    │ requiredEmotion: │
                                    │     "happy"      │
                                    └──────────────────┘
                                              │
                                              ▼
                                        Save to MongoDB
                                              │
                                    ┌─────────────────────┐
                                    │ CastingCall Doc:    │
                                    │ ├─ roleTitle: "..." │
                                    │ ├─ description      │
                                    │ └─ requiredEmotion: │
                                    │     "happy" ✅      │
                                    └─────────────────────┘


STEP 2: ACTOR UPLOADS AUDITION VIDEO
─────────────────────────────────────

  Actor: Uploads audition video
         │
         ├─ Upload to Cloudinary
         │
         ├─ Create Video Document
         │  ├─ videoUrl
         │  ├─ actor
         │  ├─ castingCall
         │  └─ aiAnalysis: { analyzed: false }
         │
         └─ Return 201 Response (✅ Immediate)
              │
              │ Meanwhile... Async Process Spawned
              │
              └────────────────────────────┬──────────────────┐
                                           ▼                  │
                                   child_process.spawn        │
                                           │                  │
                                python analyze.py             │
                                videoUrl requiredEmotion      │
                                           │                  │
                                           ▼                  │
                                   ┌──────────────────┐       │
                                   │ PYTHON AI        │       │
                                   │ (30-60 seconds)  │       │
                                   │                  │       │
                                   │ Extract Frame    │       │
                                   │ Analyze Emotion  │       │
                                   │ Compare Emotions │       │
                                   │ Calculate Scores │       │
                                   │ Generate Feedback        │
                                   └──────────────────┘       │
                                           │                  │
                                           ▼                  │
                                   stdout: JSON Result        │
                                           │                  │
                                           ├──────────────────┘
                                           ▼
                                   Parse JSON Result
                                           │
                                           ▼
                                   Update Video.aiAnalysis
                                   ├─ analyzed: true
                                   ├─ detectedEmotion
                                   ├─ emotionMatchScore
                                   ├─ confidence
                                   ├─ overallScore
                                   ├─ feedback
                                   └─ analyzedAt


STEP 3: RECRUITER VIEWS SUBMISSIONS
───────────────────────────────────

  Recruiter: Navigate to /castings/[id]/submissions
         │
         ├─ Frontend: GET /api/v1/submissions/[castingId]/submissions
         │
         ├─ Backend: Query MongoDB
         │  └─ Find all Video docs where:
         │     - castingCall === [castingId]
         │     - type === 'audition'
         │     - Sort by aiAnalysis.overallScore DESC
         │
         ├─ Return populated documents with:
         │  ├─ Actor info (name, email, image)
         │  ├─ Video URL
         │  ├─ AI Analysis data
         │  │  ├─ Emotions (required + detected)
         │  │  ├─ Scores (match + overall)
         │  │  ├─ Confidence
         │  │  └─ Feedback
         │  └─ Quality assessment
         │
         └─ Frontend Renders Dashboard
            ├─ Statistics Cards
            │  ├─ Total Submissions
            │  ├─ Analyzed Count
            │  ├─ Average Score
            │  └─ Top Score
            │
            ├─ Filter & Sort Controls
            │
            └─ Submission Cards
               ├─ Actor Name
               ├─ Overall Score Badge (Color-coded)
               │  ├─ Green: > 80
               │  ├─ Yellow: 50-80
               │  └─ Red: < 50
               ├─ Emotion Badges
               │  └─ Different color per emotion
               └─ Expand for Details
                  ├─ Match Score %
                  ├─ Confidence %
                  ├─ Quality Score
                  ├─ Feedback Text
                  ├─ Video Preview
                  └─ Re-analyze Button


STEP 4: RE-ANALYZE SUBMISSION (Optional)
─────────────────────────────────────────

  Recruiter: Click Re-analyze Button
         │
         ├─ POST /api/v1/submissions/audition/[auditionId]/reanalyze
         │
         ├─ Backend: Check Authorization
         │
         ├─ Spawn Python Again
         │  └─ Re-run analyze.py
         │
         ├─ Get New Results
         │
         └─ Update Video.aiAnalysis
            ├─ New scores
            ├─ New feedback
            └─ New analyzedAt timestamp

```

---

## 🧠 EMOTION SIMILARITY MATRIX VISUAL

```
EMOTION RELATIONSHIPS (Similarity Score)

                Happy  Sad  Angry  Fear  Surprise  Disgust  Neutral
    Happy       100    20    10     15      70        5        40
    Sad          20   100    30     65      15       50        45
    Angry        10    30   100     40      30       75        10
    Fear         15    65    40    100      55       35        30
    Surprise     70    15    30     55     100       25        45
    Disgust       5    50    75     35      25      100        20
    Neutral      40    45    10     30      45       20       100

How to read:
- Find required emotion in column (vertical)
- Find detected emotion in row (horizontal)
- Intersection = match score (0-100)

Examples:
- Required: happy, Detected: happy → Score: 100 (perfect match)
- Required: happy, Detected: surprise → Score: 70 (related emotions)
- Required: happy, Detected: sad → Score: 20 (opposite emotions)
- Required: angry, Detected: disgust → Score: 75 (related emotions)
```

---

## 📊 SCORING FORMULA BREAKDOWN

```
OVERALL SCORE CALCULATION

Step 1: Get Emotion Match Score
┌─────────────────────────────────────────┐
│ Look up in Similarity Matrix            │
│ Required: happy                         │
│ Detected: happy                         │
│ Result: emotionMatchScore = 100         │
└─────────────────────────────────────────┘

Step 2: Get Confidence Score
┌─────────────────────────────────────────┐
│ From DeepFace analysis                  │
│ confidence = 0-1 scale                  │
│ Example: confidence = 0.95              │
└─────────────────────────────────────────┘

Step 3: Calculate Overall Score
┌──────────────────────────────────────────────────────────┐
│ overallScore = (emotionMatch × 0.7) + (conf × 100 × 0.3)│
│                                                           │
│ Example:                                                 │
│ = (100 × 0.7) + (0.95 × 100 × 0.3)                     │
│ = 70 + 28.5                                             │
│ = 98.5                                                   │
│                                                           │
│ Formula explanation:                                     │
│ - 70% weight: How well emotions match (most important)   │
│ - 30% weight: Confidence of detection                    │
│ - Result: 0-100 scale                                    │
└──────────────────────────────────────────────────────────┘

SCORE INTERPRETATION

┌─────────────────────────────────────────────────┐
│  Score Range  │  Interpretation  │  Badge Color │
├─────────────────────────────────────────────────┤
│  90-100       │  Excellent       │  🟢 Green    │
│  80-89        │  Very Good       │  🟢 Green    │
│  70-79        │  Good            │  🟡 Yellow   │
│  60-69        │  Fair            │  🟡 Yellow   │
│  50-59        │  Partial Match   │  🟡 Yellow   │
│  40-49        │  Weak Match      │  🔴 Red      │
│  0-39         │  Poor Match      │  🔴 Red      │
└─────────────────────────────────────────────────┘
```

---

## 🚀 EXECUTION TIMELINE

```
Timeline: Actor Uploads Audition

T+0s     ┌──────────────────────────────────┐
         │ Actor: Upload Video              │
         └──────────────────────────────────┘
         │
         ▼
T+1s     ┌──────────────────────────────────┐
         │ Upload to Cloudinary             │
         └──────────────────────────────────┘
         │
         ▼
T+2s     ┌──────────────────────────────────┐
         │ Create Video Document (MongoDB)  │
         │ with aiAnalysis.analyzed = false │
         └──────────────────────────────────┘
         │
         ▼
T+3s     ┌──────────────────────────────────┐
         │ Response: 201 Created ✅         │
         │ (Return to Actor immediately)    │
         └──────────────────────────────────┘
         │
         │ MEANWHILE IN BACKGROUND...
         │ (Non-blocking)
         ▼
T+4s     ┌──────────────────────────────────┐
         │ Spawn Python: analyze.py         │
         └──────────────────────────────────┘
         │
         ▼
T+5-35s  ┌──────────────────────────────────┐
         │ Extract Frame (1-2s)             │
         │ Load DeepFace Model (10-15s)     │
         │ Analyze Emotion (5-10s)          │
         │ Compare & Score (1-2s)           │
         └──────────────────────────────────┘
         │
         ▼
T+40s    ┌──────────────────────────────────┐
         │ Parse Results, Update MongoDB    │
         │ aiAnalysis.analyzed = true       │
         │ + all scores & feedback          │
         └──────────────────────────────────┘
         │
         ▼
T+45s    ┌──────────────────────────────────┐
         │ ✅ ANALYSIS COMPLETE             │
         │ Recruiter can now view scores    │
         └──────────────────────────────────┘
```

---

## 🎨 UI COMPONENT LAYOUT

```
┌──────────────────────────────────────────────────────────────┐
│  🎬 CASTING SUBMISSIONS DASHBOARD                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  📊 Statistics Overview                                 │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │ │
│  │  │ Total: 5 │ │Analyzed: │ │Avg Score:│ │Top Score:│  │ │
│  │  │ Subm.   │ │    4     │ │  87.3    │ │  98.5    │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🔍 Filter & Sort                                       │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  Sort: [Highest Score ▼]  Min Score: [████░░] 50+     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🏆 JOHN DOE                                   ┌──────┐  │ │
│  │    john@example.com                           │98.5  │  │ │
│  │    [Happy] [Happy]                            └──────┘  │ │
│  │    ▼ EXPAND                                              │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ Emotion Match: 95% Confidence: 92% | Quality: 85      │ │
│  │ "Excellent emotional alignment! Your expression shows" │ │
│  │ [🎬 Play Video]   [🔄 Re-analyze]                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🥈 JANE SMITH                                 ┌──────┐  │ │
│  │    jane@example.com                           │85.2  │  │ │
│  │    [Happy] [Happy]                            └──────┘  │ │
│  │    ▼ EXPAND                                              │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ Emotion Match: 85% Confidence: 88% | Quality: 78      │ │
│  │ "Good emotional expression. Your video shows happy..." │ │
│  │ [🎬 Play Video]   [🔄 Re-analyze]                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ BOB JOHNSON                                   ┌──────┐  │ │
│  │    bob@example.com                            │45.8  │  │
│  │    [Happy] [Neutral]                          └──────┘  │ │
│  │    ▼ EXPAND                                              │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │ Emotion Match: 40% Confidence: 75% | Quality: 72      │ │
│  │ "Your expression does not strongly match the casting..." │ │
│  │ [🎬 Play Video]   [🔄 Re-analyze]                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ALICE WONDERLAND                              ┌──────┐  │ │
│  │    alice@example.com                          │⏳ ... │  │
│  │    [?] - Analysis Pending                     └──────┘  │ │
│  │    🔄 AI Analysis Pending...                            │ │
│  │    [🔄 Refresh]                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## ✨ COLOR LOGIC

```
EMOTION BADGE COLORS

Happy    → 🟡 Yellow
Sad      → 🔵 Blue  
Angry    → 🔴 Red
Fear     → 🟣 Purple
Surprise → 🩷 Pink
Disgust  → 🟠 Orange
Neutral  → ⚫ Gray

SCORE BADGE COLORS

> 80     → 🟢 Green (Excellent)
50-80    → 🟡 Yellow (Good/Fair)
< 50     → 🔴 Red (Poor)
```

---

This completes the visual architecture documentation!
