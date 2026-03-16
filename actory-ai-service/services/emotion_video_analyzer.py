"""
Video Emotion Analyzer

Downloads videos from Cloudinary, analyzes emotions frame-by-frame,
and returns aggregated emotion analysis results.
"""

import os
import cv2
import numpy as np
import requests
import tempfile
from typing import Dict, List, Optional
from services.model_loader import EmotionModelLoader
from services.face_detector import FaceDetector
from services.audio_extractor import extract_audio_from_video
from services.voice_emotion_analyzer import VoiceEmotionAnalyzer

class VideoEmotionAnalyzer:
    # Frame sampling settings
    FRAME_SKIP = 10  # Analyze every 10th frame
    MAX_FRAMES = 100  # Maximum frames to analyze
    
    def __init__(self, model_path='models/fea-iter-2.keras'):
        """
        Initialize video emotion analyzer
        
        Args:
            model_path: Path to emotion detection model
        """
        print("\n🔧 [INIT] Initializing Video Emotion Analyzer...", flush=True)
        self.model_loader = EmotionModelLoader(model_path)
        self.face_detector = FaceDetector()
        self.require_voice_analysis = os.getenv("REQUIRE_VOICE_ANALYSIS", "false").strip().lower() in {
            "1",
            "true",
            "yes",
            "on",
        }

        # Voice analyzer is optional at runtime. If it fails to initialize,
        # the facial pipeline still runs.
        self.voice_analyzer: Optional[VoiceEmotionAnalyzer] = None
        try:
            self.voice_analyzer = VoiceEmotionAnalyzer()
        except Exception as e:
            print(f"⚠️  [VOICE] Voice analyzer unavailable at startup: {str(e)}", flush=True)
            if self.require_voice_analysis:
                raise RuntimeError(
                    "Voice analyzer backend is required but unavailable. "
                    "Run the AI service with the project venv interpreter "
                    "(D:/Actoryy/actory-ai-service/venv/Scripts/python.exe)."
                )

        print("✅ [READY] Video Emotion Analyzer initialized and ready\n", flush=True)
    
    def download_video(self, video_url: str) -> str:
        """
        Download video from Cloudinary URL to temporary file
        
        Args:
            video_url: Public Cloudinary video URL
            
        Returns:
            str: Path to downloaded temporary video file
        """
        print(f"\n☁️  [DOWNLOAD] Downloading video from Cloudinary...", flush=True)
        print(f"🔗 URL: {video_url}", flush=True)
        
        try:
            response = requests.get(video_url, stream=True, timeout=60)
            
            if response.status_code != 200:
                print(f"❌ [ERROR] Download failed. HTTP {response.status_code}", flush=True)
                raise Exception(f"Failed to download video. Status code: {response.status_code}")
            
            # Get content length for progress tracking
            file_size = int(response.headers.get('content-length', 0))
            file_size_mb = file_size / (1024 * 1024) if file_size > 0 else 0
            
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
            
            # Download in chunks
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    temp_file.write(chunk)
                    downloaded += len(chunk)
            
            temp_file.close()
            downloaded_mb = downloaded / (1024 * 1024)
            
            print(f"✅ [DOWNLOADED] Video saved to temporary file", flush=True)
            print(f"📦 Size: {downloaded_mb:.2f} MB", flush=True)
            print(f"📁 Path: {temp_file.name}", flush=True)
            return temp_file.name
            
        except Exception as e:
            print(f"❌ [ERROR] Video download failed: {str(e)}", flush=True)
            raise Exception(f"Video download failed: {str(e)}")
    
    def extract_frames(self, video_path: str) -> tuple:
        """
        Extract frames from video (every 10th frame, max 100 frames)
        
        Args:
            video_path: Path to video file
            
        Returns:
            Tuple of (frames_list, fps, total_frames_in_video)
        """
        print(f"\n🎬 [EXTRACT] Extracting frames from video...", flush=True)
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            print(f"❌ [ERROR] Failed to open video file", flush=True)
            raise Exception("Failed to open video file")
        
        # Get video properties
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps if fps > 0 else 0
        
        print(f"📊 Video info: {total_frames} total frames, {fps:.2f} FPS, {duration:.2f} seconds", flush=True)
        print(f"⚙️  Sampling: Every {self.FRAME_SKIP}th frame (max {self.MAX_FRAMES} frames)", flush=True)
        
        frames = []
        frame_count = 0
        frame_index = 0
        
        while True:
            ret, frame = cap.read()
            
            if not ret:
                break
            
            # Sample every 10th frame
            if frame_index % self.FRAME_SKIP == 0:
                frames.append(frame)
                frame_count += 1
                
                # Stop after MAX_FRAMES
                if frame_count >= self.MAX_FRAMES:
                    break
            
            frame_index += 1
        
        cap.release()
        
        print(f"✅ [EXTRACTED] {len(frames)} frames ready for emotion analysis", flush=True)
        return frames, fps, total_frames
    
    def analyze_frames(self, frames: List[np.ndarray], fps: float) -> tuple:
        """
        Analyze emotion in each frame with timestamp tracking
        
        Args:
            frames: List of video frames (BGR format)
            fps: Video frames per second for timestamp calculation
            
        Returns:
            Tuple of (predictions_list, frame_results_list, total_frames_processed, frames_with_faces)
        """
        print(f"\n🔍 [ANALYZE] Analyzing emotions in {len(frames)} frames...", flush=True)
        print(f"⏳ Processing frames: ", end='', flush=True)
        
        predictions = []
        frame_results = []
        faces_detected = 0
        total_frames_processed = len(frames)
        
        for idx, frame in enumerate(frames):
            # Show progress every 10 frames
            if idx % 10 == 0:
                print(f"{idx}...", end='', flush=True)
            
            # Calculate timestamp for this frame
            # Frame index in sampled frames * FRAME_SKIP gives actual frame number
            # Divide by FPS to get seconds
            timestamp = (idx * self.FRAME_SKIP) / fps if fps > 0 else idx * 0.1
            
            # Detect and extract face
            face = self.face_detector.detect_and_extract(frame, target_size=(48, 48))
            
            if face is None:
                continue  # Skip frames with no face detected
            
            faces_detected += 1
            
            # Predict emotion (face is already 48x48 RGB, no normalization needed)
            prediction = self.model_loader.predict_emotion(face)
            predictions.append(prediction)
            
            # Store frame-level data for performance metrics
            frame_results.append({
                'emotion': prediction['emotion'],
                'confidence': prediction['confidence'],
                'time': round(timestamp, 2)
            })
        
        print(f" Done!", flush=True)
        
        detection_rate = (faces_detected / len(frames) * 100) if len(frames) > 0 else 0
        print(f"✅ [FACES] Detected faces in {faces_detected}/{len(frames)} frames ({detection_rate:.1f}%)", flush=True)
        
        if len(predictions) == 0:
            print(f"❌ [ERROR] No faces detected in any frame", flush=True)
            raise Exception("No faces detected in video frames")
        
        return predictions, frame_results, total_frames_processed, faces_detected
    
    def aggregate_predictions(self, predictions: List[Dict]) -> Dict:
        """
        Aggregate emotion predictions across all frames
        
        Args:
            predictions: List of emotion prediction dictionaries
            
        Returns:
            Dict with aggregated emotion scores and dominant emotion
        """
        print(f"\n📊 [AGGREGATE] Aggregating {len(predictions)} emotion predictions...", flush=True)
        
        # Initialize aggregated scores for all emotions
        aggregated_scores = {
            'angry': 0.0,
            'disgust': 0.0,
            'fear': 0.0,
            'happy': 0.0,
            'sad': 0.0,
            'surprise': 0.0,
            'neutral': 0.0
        }
        
        # Sum scores across all predictions
        for pred in predictions:
            for emotion, score in pred['scores'].items():
                aggregated_scores[emotion] += score
        
        # Calculate average scores
        num_predictions = len(predictions)
        for emotion in aggregated_scores:
            aggregated_scores[emotion] /= num_predictions
        
        # Determine dominant emotion
        dominant_emotion = max(aggregated_scores, key=aggregated_scores.get)
        dominant_score = aggregated_scores[dominant_emotion]
        
        print(f"🎭 [EMOTION SCORES] Average across all frames:", flush=True)
        # Sort emotions by score for better readability
        sorted_emotions = sorted(aggregated_scores.items(), key=lambda x: x[1], reverse=True)
        for emotion, score in sorted_emotions:
            bar = '█' * int(score * 20)  # Visual bar (max 20 chars)
            marker = '⭐' if emotion == dominant_emotion else '  '
            print(f"   {marker} {emotion:8s}: {score:.3f} {bar}", flush=True)
        
        print(f"✅ [DOMINANT] Detected emotion: {dominant_emotion} ({dominant_score:.1%} confidence)", flush=True)
        
        return {
            'detectedEmotion': dominant_emotion,
            'emotionScores': aggregated_scores
        }
    
    def calculate_emotion_match(self, required_emotion: str, detected_emotion: str, 
                                emotion_scores: Dict[str, float]) -> int:
        """
        Calculate emotion match score (0-100)
        
        Args:
            required_emotion: Emotion required by casting
            detected_emotion: Detected dominant emotion
            emotion_scores: Dictionary of all emotion scores
            
        Returns:
            int: Match score (0-100)
        """
        required_emotion = required_emotion.lower()
        
        if required_emotion not in emotion_scores:
            return 0
        
        # Base score from required emotion strength
        required_score = emotion_scores[required_emotion]
        
        # Bonus if detected emotion matches required
        if detected_emotion == required_emotion:
            match_score = int(required_score * 100)
        else:
            # Partial score if required emotion is present but not dominant
            match_score = int(required_score * 70)
        
        return min(100, max(0, match_score))
    
    def generate_feedback(self, emotion_match_score: int, required_emotion: str, 
                         detected_emotion: str) -> str:
        """
        Generate human-readable feedback
        
        Args:
            emotion_match_score: Calculated match score
            required_emotion: Required emotion
            detected_emotion: Detected emotion
            
        Returns:
            str: Feedback message
        """
        if emotion_match_score >= 80:
            return f"Excellent! Actor strongly expresses '{required_emotion}' emotion as required."
        elif emotion_match_score >= 60:
            return f"Good match. Actor shows '{required_emotion}' emotion, though '{detected_emotion}' is more prominent."
        elif emotion_match_score >= 40:
            return f"Partial match. Actor shows some '{required_emotion}', but '{detected_emotion}' dominates."
        else:
            return f"Low match. Actor primarily shows '{detected_emotion}' instead of required '{required_emotion}'."
    
    def calculate_emotion_consistency(self, frame_results: List[Dict], required_emotion: str) -> int:
        """
        Calculate emotion consistency score (0-100)
        
        Args:
            frame_results: List of frame-level emotion data
            required_emotion: Required emotion from casting
            
        Returns:
            int: Consistency score (0-100)
        """
        if not frame_results:
            return 0
        
        required_emotion = required_emotion.lower()
        frames_with_required = sum(1 for frame in frame_results if frame['emotion'] == required_emotion)
        total_frames = len(frame_results)
        
        consistency = (frames_with_required / total_frames) * 100
        return int(round(consistency))
    
    def calculate_expression_intensity(self, frame_results: List[Dict], required_emotion: str) -> int:
        """
        Calculate expression intensity score (0-100)
        
        Args:
            frame_results: List of frame-level emotion data
            required_emotion: Required emotion from casting
            
        Returns:
            int: Intensity score (0-100)
        """
        required_emotion = required_emotion.lower()
        
        # Get confidence scores for frames where required emotion was detected
        required_confidences = [
            frame['confidence'] for frame in frame_results 
            if frame['emotion'] == required_emotion
        ]
        
        if not required_confidences:
            return 0
        
        # Calculate average confidence
        avg_confidence = sum(required_confidences) / len(required_confidences)
        intensity = avg_confidence * 100
        
        return int(round(intensity))
    
    def calculate_face_visibility(self, frames_with_faces: int, total_frames_processed: int) -> int:
        """
        Calculate face visibility score (0-100)
        
        Args:
            frames_with_faces: Number of frames where face was detected
            total_frames_processed: Total number of frames analyzed
            
        Returns:
            int: Visibility score (0-100)
        """
        if total_frames_processed == 0:
            return 0
        
        visibility = (frames_with_faces / total_frames_processed) * 100
        return int(round(visibility))
    
    def calculate_overall_performance_score(self, emotion_match_score: int, consistency: int, 
                                           intensity: int, visibility: int) -> int:
        """
        Calculate overall performance score using weighted average (0-100)
        
        Weights:
        - Emotion Match Score: 40%
        - Emotion Consistency: 25%
        - Expression Intensity: 20%
        - Face Visibility: 15%
        
        Args:
            emotion_match_score: Emotion match score (0-100)
            consistency: Emotion consistency score (0-100)
            intensity: Expression intensity score (0-100)
            visibility: Face visibility score (0-100)
            
        Returns:
            int: Overall performance score (0-100)
        """
        overall = (
            (emotion_match_score * 0.40) +
            (consistency * 0.25) +
            (intensity * 0.20) +
            (visibility * 0.15)
        )
        
        return int(round(overall))
    
    def generate_emotion_timeline(self, frame_results: List[Dict]) -> List[Dict]:
        """
        Generate emotion timeline showing emotion transitions over time
        
        Args:
            frame_results: List of frame-level emotion data
            
        Returns:
            List of timeline segments with emotion, start, and end times
        """
        if not frame_results:
            return []
        
        timeline = []
        current_emotion = frame_results[0]['emotion']
        start_time = frame_results[0]['time']
        
        for i in range(1, len(frame_results)):
            if frame_results[i]['emotion'] != current_emotion:
                # Emotion changed - save current segment
                timeline.append({
                    'emotion': current_emotion,
                    'start': start_time,
                    'end': frame_results[i-1]['time']
                })
                
                # Start new segment
                current_emotion = frame_results[i]['emotion']
                start_time = frame_results[i]['time']
        
        # Add final segment
        timeline.append({
            'emotion': current_emotion,
            'start': start_time,
            'end': frame_results[-1]['time']
        })
        
        return timeline
    
    def analyze_video(self, video_url: str, required_emotion: str) -> Dict:
        """
        Complete video emotion analysis pipeline with performance metrics
        
        Args:
            video_url: Cloudinary video URL
            required_emotion: Required emotion from casting
            
        Returns:
            Dict: Complete analysis results with performance metrics
        """
        video_path = None
        audio_path = None
        
        try:
            print(f"\n{'='*80}", flush=True)
            print(f"🎬 [START] NEW VIDEO ANALYSIS REQUEST", flush=True)
            print(f"🎯 Required emotion: {required_emotion.upper()}", flush=True)
            print(f"[REQUIRED_EMOTION] {required_emotion.lower()}", flush=True)
            print(f"{'='*80}", flush=True)
            
            # Step 1: Download video
            video_path = self.download_video(video_url)

            # Step 2: Extract audio + run voice emotion analysis
            voice_result = {
                'voiceEmotion': 'neutral',
                'voiceConfidence': 0.0,
                'voiceAvailable': False,
            }

            try:
                print("🎙️  [VOICE][STATUS] Starting voice pipeline...", flush=True)
                audio_path = extract_audio_from_video(video_path)

                if self.voice_analyzer is None:
                    self.voice_analyzer = VoiceEmotionAnalyzer()

                voice_result = {
                    **self.voice_analyzer.analyze(audio_path),
                    'voiceAvailable': True,
                }
                print(
                    f"🎙️  [VOICE][STATUS] available=True emotion={voice_result.get('voiceEmotion', 'neutral')} confidence={float(voice_result.get('voiceConfidence', 0.0)):.1%}",
                    flush=True,
                )
            except Exception as e:
                if self.require_voice_analysis:
                    raise RuntimeError(
                        "Voice emotion analysis failed in strict mode. "
                        "Ensure the service uses the project venv interpreter with voice dependencies. "
                        f"Root cause: {str(e)}"
                    )
                print(f"⚠️  [VOICE] Voice emotion analysis failed, continuing with facial analysis: {str(e)}", flush=True)
                print("🎙️  [VOICE][STATUS] available=False emotion=neutral confidence=0.0% (fallback)", flush=True)
            
            # Step 3: Extract frames (now returns fps and total_frames too)
            frames, fps, total_frames = self.extract_frames(video_path)
            
            # Step 4: Analyze frames (now returns frame_results and detection stats)
            predictions, frame_results, total_frames_processed, frames_with_faces = self.analyze_frames(frames, fps)
            
            # Step 5: Aggregate results
            aggregated = self.aggregate_predictions(predictions)

            face_emotion = aggregated['detectedEmotion']
            face_confidence = float(aggregated['emotionScores'].get(face_emotion, 0.0))
            voice_emotion = str(voice_result.get('voiceEmotion', 'neutral'))
            voice_confidence = float(voice_result.get('voiceConfidence', 0.0))

            if voice_result.get('voiceAvailable', False):
                combined_confidence = (face_confidence * 0.6) + (voice_confidence * 0.4)
            else:
                combined_confidence = face_confidence

            print(
                f"🧾 [VOICE][SUMMARY] available={voice_result.get('voiceAvailable', False)} | face={face_emotion} ({face_confidence:.1%}) | voice={voice_emotion} ({voice_confidence:.1%})",
                flush=True,
            )
            
            # Step 6: Calculate emotion match score
            emotion_match_score = self.calculate_emotion_match(
                required_emotion,
                aggregated['detectedEmotion'],
                aggregated['emotionScores']
            )
            
            # Step 7: Calculate performance metrics
            print(f"\n📊 [METRICS] Calculating performance metrics...", flush=True)
            
            emotion_consistency = self.calculate_emotion_consistency(frame_results, required_emotion)
            expression_intensity = self.calculate_expression_intensity(frame_results, required_emotion)
            face_visibility = self.calculate_face_visibility(frames_with_faces, total_frames_processed)
            
            overall_performance_score = self.calculate_overall_performance_score(
                emotion_match_score,
                emotion_consistency,
                expression_intensity,
                face_visibility
            )
            
            # Step 8: Generate emotion timeline
            emotion_timeline = self.generate_emotion_timeline(frame_results)
            
            # Step 9: Generate feedback
            feedback = self.generate_feedback(
                emotion_match_score,
                required_emotion,
                aggregated['detectedEmotion']
            )
            
            # Prepare final result with all metrics
            result = {
                'success': True,
                'requiredEmotion': required_emotion.lower(),
                'faceEmotion': face_emotion,
                'voiceEmotion': voice_emotion,
                'faceConfidence': round(face_confidence, 4),
                'voiceConfidence': round(voice_confidence, 4),
                'combinedEmotionConfidence': round(combined_confidence, 4),
                'detectedEmotion': aggregated['detectedEmotion'],
                'emotionScores': aggregated['emotionScores'],
                'emotionMatchScore': emotion_match_score,
                'emotionConsistency': emotion_consistency,
                'expressionIntensity': expression_intensity,
                'faceVisibility': face_visibility,
                'overallPerformanceScore': overall_performance_score,
                'emotionTimeline': emotion_timeline,
                'framesAnalyzed': len(predictions),
                'feedback': feedback
            }
            
            print(f"\n{'='*80}", flush=True)
            print(f"✅ [SUCCESS] ANALYSIS COMPLETE", flush=True)
            print(f"🎯 Required: {required_emotion} | Detected: {aggregated['detectedEmotion']}", flush=True)
            print(f"[ANALYZED_EMOTION] {aggregated['detectedEmotion']}", flush=True)
            print(f"🎭 Face: {face_emotion} ({face_confidence:.1%})", flush=True)
            print(f"🎙️  Voice: {voice_emotion} ({voice_confidence:.1%})", flush=True)
            print(f"🧠 Combined Confidence: {combined_confidence:.1%}", flush=True)
            print(f"\n📈 PERFORMANCE METRICS:", flush=True)
            print(f"   • Emotion Match Score:    {emotion_match_score}%", flush=True)
            print(f"   • Emotion Consistency:    {emotion_consistency}%", flush=True)
            print(f"   • Expression Intensity:   {expression_intensity}%", flush=True)
            print(f"   • Face Visibility:        {face_visibility}%", flush=True)
            print(f"   • Overall Performance:    {overall_performance_score}%", flush=True)
            print(f"\n📊 Frames Analyzed: {len(predictions)}", flush=True)
            print(f"💬 Feedback: {feedback}", flush=True)
            print(f"{'='*80}\n", flush=True)
            
            return result
            
        except Exception as e:
            print(f"\n{'='*80}", flush=True)
            print(f"❌ [ERROR] ANALYSIS FAILED", flush=True)
            print(f"💔 Error: {str(e)}", flush=True)
            print(f"{'='*80}\n", flush=True)
            raise
            
        finally:
            # Clean up temporary files
            if video_path and os.path.exists(video_path):
                try:
                    os.remove(video_path)
                    print(f"🧹 [CLEANUP] Temporary video file deleted: {video_path}\n", flush=True)
                except Exception as e:
                    print(f"⚠️  [WARNING] Failed to delete temp file: {str(e)}\n", flush=True)

            if audio_path and os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                    print(f"🧹 [CLEANUP] Temporary audio file deleted: {audio_path}\n", flush=True)
                except Exception as e:
                    print(f"⚠️  [WARNING] Failed to delete temp audio file: {str(e)}\n", flush=True)
