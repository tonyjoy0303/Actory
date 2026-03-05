#!/usr/bin/env python3
"""
Video Emotion Analyzer for Actory Casting Platform

This script analyzes audition videos and detects emotions from facial expressions.
It compares the detected emotion with the required emotion for the casting role.

Usage:
    python emotion_video_analyzer.py <video_url> <required_emotion>

Output:
    JSON object with analysis results (printed to stdout)
"""

import sys
import json
import cv2
import numpy as np
import tempfile
import os
import urllib.request
import traceback
from collections import Counter

# Import local modules
from face_detector import FaceDetector
from model_loader import EmotionModelLoader


class VideoEmotionAnalyzer:
    def __init__(self, model_path='ai/fea-iter-2.keras'):
        """Initialize analyzer with emotion model and face detector"""
        self.model_loader = EmotionModelLoader(model_path)
        self.face_detector = FaceDetector()
        
        # Performance optimization settings
        self.FRAME_SKIP = 10  # Analyze every 10th frame
        self.MAX_FRAMES = 100  # Stop after analyzing 100 frames
    
    def download_video(self, video_url):
        """
        Download video from URL to temporary file
        
        Args:
            video_url: URL to video file (e.g., Cloudinary URL)
            
        Returns:
            str: Path to downloaded temporary file
        """
        try:
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
            temp_path = temp_file.name
            temp_file.close()
            
            # Download video
            print(f"Downloading video from: {video_url}", file=sys.stderr)
            urllib.request.urlretrieve(video_url, temp_path)
            print(f"[OK] Video downloaded to: {temp_path}", file=sys.stderr)
            
            return temp_path
        except Exception as e:
            raise RuntimeError(f"Failed to download video: {str(e)}")
    
    def extract_frames(self, video_path):
        """
        Extract frames from video for analysis
        
        Args:
            video_path: Path to video file
            
        Returns:
            list: List of frame images (OpenCV BGR format)
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise RuntimeError(f"Failed to open video file: {video_path}")
        
        frames = []
        frame_count = 0
        analyzed_count = 0
        
        print(f"Extracting frames from video...", file=sys.stderr)
        
        while True:
            ret, frame = cap.read()
            
            if not ret:
                break
            
            # Skip frames for performance
            if frame_count % self.FRAME_SKIP == 0:
                frames.append(frame)
                analyzed_count += 1
                
                # Stop after max frames
                if analyzed_count >= self.MAX_FRAMES:
                    break
            
            frame_count += 1
        
        cap.release()
        
        print(f"[OK] Extracted {analyzed_count} frames from {frame_count} total frames", file=sys.stderr)
        
        if not frames:
            raise RuntimeError("No frames could be extracted from video")
        
        return frames
    
    def analyze_frames(self, frames):
        """
        Analyze emotions in video frames
        
        Args:
            frames: List of video frames (OpenCV BGR images)
            
        Returns:
            dict: Analysis results
        """
        emotion_predictions = []
        frames_with_faces = 0
        
        print(f"Analyzing {len(frames)} frames for emotions...", file=sys.stderr)
        
        for i, frame in enumerate(frames):
            # Detect face in frame
            face = self.face_detector.detect_face(frame)
            
            if face is None:
                # Skip frames without faces
                continue
            
            frames_with_faces += 1
            
            # Predict emotion
            prediction = self.model_loader.predict_emotion(face)
            emotion_predictions.append(prediction)
            
            if (i + 1) % 20 == 0:
                print(f"  Processed {i + 1}/{len(frames)} frames...", file=sys.stderr)
        
        print(f"[OK] Found faces in {frames_with_faces}/{len(frames)} frames", file=sys.stderr)
        
        if not emotion_predictions:
            raise RuntimeError("No faces detected in video. Please ensure the actor's face is clearly visible.")
        
        return emotion_predictions
    
    def aggregate_predictions(self, predictions):
        """
        Aggregate emotion predictions across all frames
        
        Args:
            predictions: List of prediction dictionaries
            
        Returns:
            dict: Aggregated results
        """
        # Get all detected emotions
        detected_emotions = [pred['emotion'] for pred in predictions]
        
        # Calculate dominant emotion (most frequent)
        emotion_counter = Counter(detected_emotions)
        dominant_emotion = emotion_counter.most_common(1)[0][0]
        
        # Calculate average emotion scores across all frames
        emotion_scores = {
            'angry': 0.0,
            'disgust': 0.0,
            'fear': 0.0,
            'happy': 0.0,
            'sad': 0.0,
            'surprise': 0.0,
            'neutral': 0.0
        }
        
        for pred in predictions:
            for emotion, score in pred['scores'].items():
                emotion_scores[emotion] += score
        
        # Average the scores
        num_predictions = len(predictions)
        for emotion in emotion_scores:
            emotion_scores[emotion] /= num_predictions
        
        # Get confidence for dominant emotion
        dominant_confidence = emotion_scores[dominant_emotion]
        
        return {
            'detectedEmotion': dominant_emotion,
            'confidence': round(dominant_confidence, 3),
            'emotionScores': {k: round(v, 3) for k, v in emotion_scores.items()},
            'framesAnalyzed': num_predictions
        }
    
    def calculate_emotion_match(self, required_emotion, detected_emotion, emotion_scores):
        """
        Calculate how well the detected emotion matches the required emotion
        
        Args:
            required_emotion: Required emotion for the casting
            detected_emotion: Detected dominant emotion
            emotion_scores: Dictionary of emotion probabilities
            
        Returns:
            dict: Match score and feedback
        """
        # Normalize required emotion to lowercase
        required_emotion = required_emotion.lower()
        
        # Get score for required emotion
        required_score = emotion_scores.get(required_emotion, 0.0)
        
        # Calculate match score (0-100)
        # If detected emotion matches required emotion, use high score
        if detected_emotion == required_emotion:
            emotion_match_score = int(required_score * 100)
            feedback = f"Excellent! Actor's {detected_emotion} expression strongly matches the required emotion."
        else:
            # Use the score of required emotion even if not dominant
            emotion_match_score = int(required_score * 100)
            
            if emotion_match_score >= 50:
                feedback = f"Good match. Actor shows some {required_emotion} emotion ({emotion_match_score}%) though {detected_emotion} is dominant."
            elif emotion_match_score >= 30:
                feedback = f"Partial match. Actor displays {detected_emotion} primarily, with moderate {required_emotion} ({emotion_match_score}%)."
            else:
                feedback = f"Low match. Actor shows {detected_emotion} emotion, but minimal {required_emotion} expression ({emotion_match_score}%)."
        
        return {
            'emotionMatchScore': emotion_match_score,
            'feedback': feedback
        }
    
    def analyze_video(self, video_url, required_emotion):
        """
        Complete video analysis pipeline
        
        Args:
            video_url: URL to video file
            required_emotion: Required emotion for casting
            
        Returns:
            dict: Complete analysis results
        """
        temp_video_path = None
        
        try:
            # Download video
            temp_video_path = self.download_video(video_url)
            
            # Extract frames
            frames = self.extract_frames(temp_video_path)
            
            # Analyze frames
            predictions = self.analyze_frames(frames)
            
            # Aggregate predictions
            aggregated = self.aggregate_predictions(predictions)
            
            # Calculate emotion match
            match_result = self.calculate_emotion_match(
                required_emotion,
                aggregated['detectedEmotion'],
                aggregated['emotionScores']
            )
            
            # Combine results
            result = {
                'success': True,
                'requiredEmotion': required_emotion.lower(),
                'detectedEmotion': aggregated['detectedEmotion'],
                'emotionScores': aggregated['emotionScores'],
                'emotionMatchScore': match_result['emotionMatchScore'],
                'confidence': aggregated['confidence'],
                'overallScore': int((match_result['emotionMatchScore'] + aggregated['confidence'] * 100) / 2),
                'feedback': match_result['feedback'],
                'framesAnalyzed': aggregated['framesAnalyzed']
            }
            
            return result
            
        finally:
            # Clean up temporary video file
            if temp_video_path and os.path.exists(temp_video_path):
                try:
                    os.unlink(temp_video_path)
                    print(f"[OK] Cleaned up temporary file", file=sys.stderr)
                except:
                    pass


def main():
    """Main execution function"""
    # Check arguments
    if len(sys.argv) != 3:
        error_result = {
            'success': False,
            'error': 'Invalid arguments. Usage: python emotion_video_analyzer.py <video_url> <required_emotion>'
        }
        print(json.dumps(error_result))
        sys.exit(1)
    
    video_url = sys.argv[1]
    required_emotion = sys.argv[2]
    
    try:
        # Initialize analyzer
        print("Initializing emotion analyzer...", file=sys.stderr)
        analyzer = VideoEmotionAnalyzer()
        
        # Run analysis
        result = analyzer.analyze_video(video_url, required_emotion)
        
        # Output result as JSON to stdout
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        # Output error as JSON
        error_result = {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
