"""
Emotion Detection Model Loader
Loads the trained Keras CNN model for emotion classification
"""

import os
import sys
import numpy as np
from tensorflow import keras

class EmotionModelLoader:
    # Emotion labels matching model output
    EMOTION_LABELS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
    
    def __init__(self, model_path='ai/fea-iter-2.keras'):
        """
        Initialize and load the emotion detection model
        
        Args:
            model_path: Path to the Keras model file
        """
        self.model_path = model_path
        self.model = None
        self.load_model()
    
    def load_model(self):
        """Load the Keras model from disk"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found at: {self.model_path}")
        
        try:
            self.model = keras.models.load_model(self.model_path)
            print(f"[OK] Model loaded successfully from {self.model_path}", file=sys.stderr)
            print(f"[OK] Model input shape: {self.model.input_shape}", file=sys.stderr)
            print(f"[OK] Model output shape: {self.model.output_shape}", file=sys.stderr)
        except Exception as e:
            raise RuntimeError(f"Failed to load model: {str(e)}")
    
    def predict_emotion(self, face_image):
        """
        Predict emotion from a single face image
        
        Args:
            face_image: 48x48x3 RGB face image (NOT normalized - model has internal rescaling)
            
        Returns:
            dict: {
                'emotion': str (dominant emotion),
                'confidence': float (0-1),
                'scores': dict (emotion: probability)
            }
        """
        # Validate input shape
        if face_image.shape != (48, 48, 3):
            raise ValueError(f"Expected face shape (48,48,3), got {face_image.shape}")
        
        # Expand dimensions for batch processing
        face_batch = np.expand_dims(face_image, axis=0)
        
        # IMPORTANT: Do NOT normalize - model has internal Rescaling layer
        # The model expects raw RGB values (0-255)
        
        # Predict
        predictions = self.model.predict(face_batch, verbose=0)[0]
        
        # Get dominant emotion
        dominant_idx = np.argmax(predictions)
        dominant_emotion = self.EMOTION_LABELS[dominant_idx]
        confidence = float(predictions[dominant_idx])
        
        # Create emotion scores dictionary
        emotion_scores = {
            emotion: float(predictions[i])
            for i, emotion in enumerate(self.EMOTION_LABELS)
        }
        
        return {
            'emotion': dominant_emotion,
            'confidence': confidence,
            'scores': emotion_scores
        }
    
    def predict_batch(self, face_images):
        """
        Predict emotions for multiple face images
        
        Args:
            face_images: List of 48x48x3 RGB face images
            
        Returns:
            list: List of prediction dictionaries
        """
        if not face_images:
            return []
        
        # Stack images into batch
        face_batch = np.array(face_images)
        
        # Predict
        predictions = self.model.predict(face_batch, verbose=0)
        
        # Convert to result format
        results = []
        for pred in predictions:
            dominant_idx = np.argmax(pred)
            dominant_emotion = self.EMOTION_LABELS[dominant_idx]
            confidence = float(pred[dominant_idx])
            
            emotion_scores = {
                emotion: float(pred[i])
                for i, emotion in enumerate(self.EMOTION_LABELS)
            }
            
            results.append({
                'emotion': dominant_emotion,
                'confidence': confidence,
                'scores': emotion_scores
            })
        
        return results
