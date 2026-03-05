"""
Face Detection Utility for Emotion Analysis
Uses OpenCV Haar Cascade for fast face detection in video frames
"""

import cv2
import numpy as np
import os

class FaceDetector:
    def __init__(self):
        """Initialize Haar Cascade face detector"""
        # Try multiple common paths for haarcascade file
        cascade_paths = [
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml',
            'haarcascade_frontalface_default.xml',
            os.path.join(os.path.dirname(__file__), 'haarcascade_frontalface_default.xml')
        ]
        
        self.face_cascade = None
        for path in cascade_paths:
            if os.path.exists(path):
                self.face_cascade = cv2.CascadeClassifier(path)
                break
        
        if self.face_cascade is None or self.face_cascade.empty():
            raise RuntimeError("Could not load Haar Cascade classifier. Please ensure OpenCV is properly installed.")
    
    def detect_face(self, frame):
        """
        Detect the largest face in a frame
        
        Args:
            frame: OpenCV BGR image
            
        Returns:
            face_region: Cropped face as RGB image (48x48x3), or None if no face detected
        """
        # Convert to grayscale for detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        # If no faces found
        if len(faces) == 0:
            return None
        
        # Get the largest face (by area)
        largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
        x, y, w, h = largest_face
        
        # Extract face region from original BGR frame
        face_bgr = frame[y:y+h, x:x+w]
        
        # Convert BGR to RGB
        face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
        
        # Resize to 48x48 (model input size)
        face_resized = cv2.resize(face_rgb, (48, 48))
        
        return face_resized
    
    def detect_faces_batch(self, frames):
        """
        Detect faces in multiple frames
        
        Args:
            frames: List of OpenCV BGR images
            
        Returns:
            faces: List of 48x48 RGB face images (None for frames without faces)
        """
        return [self.detect_face(frame) for frame in frames]
