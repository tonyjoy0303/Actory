# Copilot Instructions - Actory

## Big picture
- **Monorepo structure:** React/Vite frontend (`actory-spotlight-ui/`), Node/Express API (`actory-spotlight-backend/`), Flask ML service (`audition-prediction/`), Python AI analysis (`actory-spotlight-backend/ai/`).
- **API architecture:** All REST routes under `/api/v1` mounted in `server.js` with per-domain route/controller/model files. Socket.IO for notifications and WebRTC signaling in `server.js`.
- **Data persistence:** MongoDB via Mongoose (`config/db.js`); uses `MONGODB_URI` with optional `MONGODB_URI_SEEDLIST` fallback.
- **Frontend API:** Centralized axios instance in `src/lib/api.ts` with `baseURL = VITE_API_URL/api/v1`; JWT token from localStorage key "token" sent as Bearer.
- **External integrations:** Cloudinary (video uploads), Brevo/SMTP (email), Google OAuth, Socket.IO (real-time), Python CLI spawning for AI.

## AI Emotion Analysis System
- **Python AI module** in `actory-spotlight-backend/ai/`: `emotion_video_analyzer.py` (main orchestrator), `model_loader.py` (Keras CNN inference), `face_detector.py` (OpenCV Haar Cascades).
- **Model**: `fea-iter-2.keras` (48×48 RGB input, 7 emotions: angry, disgust, fear, happy, sad, surprise, neutral). **Critical:** Model has internal Rescaling layer—pass raw pixel values (0-255), NO manual normalization.
- **Data flow:** Video upload → `controllers/videos.js` triggers `safeAnalyzeVideo()` → spawns Python process → parses JSON result → stores in `Video.aiAnalysis` schema (emotionScores, emotionMatchScore, overallScore, feedback, framesAnalyzed).
- **Backend integration:** `utils/aiIntegration.js` spawns Python process, validates inputs, parses stdout (JSON only) vs stderr (logging). Timeout: 5 minutes. Returns emotionScores (0-1 for each emotion) and overall/match scores (0-100).
- **Emotion extraction:** `utils/emotionExtractor.js` parses casting description for required emotion; used in `controllers/casting.js` and AI analysis to set baseline.

## Frontend patterns (Submissions Page)
- **EmotionAnalysisDisplay component** (`components/EmotionAnalysisDisplay.jsx`): Displays aiAnalyzed flag, emotionScores bar chart, emotionMatchScore, confidence, feedback, framesAnalyzed. Supports darkTheme prop for Submissions Page integration.
- **Data flow:** `/castings/{castingId}/submissions` → fetch videos with `aiAnalysis` fields → format for display → show emotion comparison (expected vs detected), score badges, feedback preview.
- **Field mapping:** Video.aiAnalysis.{requiredEmotion, detectedEmotion, emotionScores, emotionMatchScore, confidence, overallScore, feedback, framesAnalyzed} → submission object properties for rendering.

## Key workflows
- **Backend dev:** `npm run dev` from `actory-spotlight-backend/` (nodemon); AI tests: `node test-ai-integration.js`.
- **Frontend dev:** `npm run dev` from `actory-spotlight-ui/` (Vite); E2E: `npm run test:e2e` (Playwright).
- **Python setup:** `pip install -r actory-spotlight-backend/ai/requirements.txt` (NumPy ≥1.26.0, TensorFlow ≥2.13.0, OpenCV ≥4.8.0).

## Project-specific patterns
- **Routes + Controllers pattern:** New endpoints use `routes/{domain}.js` → `controllers/{domain}.js` → `models/{Schema}.js`. Each controller has auth checks (isAuthorizedForCasting helper).
- **Async AI analysis:** safeAnalyzeVideo wraps analyzeVideoEmotion with error handling; analysis runs in background (non-blocking), results saved to DB when complete.
- **Video schema conditional fields:** Audition videos require castingCall, height, weight, age, skills, idProofUrl; profile videos don't (see Video.js conditionals).
- **stdout/stderr discipline:** Python scripts print JSON to stdout (for parsing), status messages to stderr. Node.js reads only stdout for JSON.
- **Emotion validation:** 7 enum values ('happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral') used consistently in Video.aiAnalysis schema, emotionScores object, and validation functions.

## CORS & deployment
- CORS allowlist in `server.js` uses FRONTEND_URL/CLIENT_ORIGIN env vars; update when adding new frontend origins.
- KNN role-fit endpoint: `/api/v1/fit/knn` implemented directly in `server.js` (not in controllers/).
- Prediction routes: `/api/v1/predict` (backend) + Flask service in `audition-prediction/`; avoid port conflicts locally.
