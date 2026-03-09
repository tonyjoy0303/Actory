"""
Face Detector using OpenCV Haar Cascade

Detects faces in video frames for emotion analysis.
"""

import cv2
import numpy as np

class FaceDetector:
    def __init__(self, cascade_path='haarcascade_frontalface_default.xml'):
        """
        Initialize face detector with Haar Cascade
        """
        # Always use OpenCV's built-in Haar Cascade data
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        if self.face_cascade.empty():
            raise RuntimeError(f"Failed to load Haar Cascade from {cascade_path}")
        
        print(f"[OK] Face detector loaded successfully", flush=True)
    
    def detect_faces(self, frame):
        """
        Detect faces in a frame
        
        Args:
            frame: BGR image from OpenCV
            
        Returns:
            list: List of (x, y, w, h) tuples for detected faces
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
        
        return faces
    
    def extract_face(self, frame, face_coords, target_size=(48, 48)):
        """
        Extract and resize face region from frame
        
        Args:
            frame: BGR image from OpenCV
            face_coords: (x, y, w, h) tuple
            target_size: Target size for resized face (width, height)
            
        Returns:
            numpy.ndarray: Resized face image in RGB format (48x48x3)
        """
        x, y, w, h = face_coords
        
        # Crop face region
        face = frame[y:y+h, x:x+w]
        
        # Resize to target size
        face_resized = cv2.resize(face, target_size)
        
        # Convert BGR to RGB
        face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
        
        return face_rgb
    
    def detect_and_extract(self, frame, target_size=(48, 48)):
        """
        Detect faces and extract the largest one
        
        Args:
            frame: BGR image from OpenCV
            target_size: Target size for resized face
            
        Returns:
            numpy.ndarray or None: Extracted face in RGB or None if no face found
        """
        faces = self.detect_faces(frame)
        
        if len(faces) == 0:
            return None
        
        # Get largest face (by area)
        largest_face = max(faces, key=lambda f: f[2] * f[3])
        
        # Extract and return
        return self.extract_face(frame, largest_face, target_size)
