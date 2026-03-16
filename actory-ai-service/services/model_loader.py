"""
Emotion Detection Model Loader

Loads the trained Keras CNN model for emotion classification.
Model has internal Rescaling layer - NO manual normalization needed.
"""

import os
import sys
import json
import zipfile
import tempfile
import numpy as np
from tensorflow import keras

class EmotionModelLoader:
    # Emotion labels matching model output (7 classes)
    EMOTION_LABELS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
    
    def __init__(self, model_path='models/fea-iter-2.keras'):
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
            print(f"❌ [ERROR] Model file not found at: {self.model_path}", flush=True)
            raise FileNotFoundError(f"Model file not found at: {self.model_path}")
        
        try:
            print(f"📥 [LOADING] Loading emotion detection model...", flush=True)
            self.model = keras.models.load_model(self.model_path)
            print(f"✅ [MODEL LOADED] Successfully loaded from {self.model_path}", flush=True)
            print(f"📐 [MODEL INFO] Input shape: {self.model.input_shape}", flush=True)
            print(f"📐 [MODEL INFO] Output shape: {self.model.output_shape} (7 emotions)", flush=True)
            print(f"🎭 [MODEL INFO] Emotions: {', '.join(self.EMOTION_LABELS)}", flush=True)
        except Exception as e:
            # Compatibility fallback for models serialized with InputLayer batch_shape.
            # Some TF/Keras combinations only accept batch_input_shape.
            if "InputLayer" in str(e) and "batch_shape" in str(e):
                try:
                    print("⚠️  [MODEL] Retrying with .keras config compatibility patch...", flush=True)

                    def _patch_batch_shape(obj):
                        if isinstance(obj, dict):
                            if 'batch_shape' in obj and 'batch_input_shape' not in obj:
                                obj['batch_input_shape'] = obj.pop('batch_shape')

                            # Some saved preprocessing layers include fields unsupported
                            # by older TF/Keras runtimes.
                            class_name = obj.get('class_name')
                            layer_cfg = obj.get('config')
                            if isinstance(class_name, str) and isinstance(layer_cfg, dict):
                                if class_name in {
                                    'RandomFlip',
                                    'RandomRotation',
                                    'RandomZoom',
                                    'RandomTranslation',
                                    'RandomContrast',
                                    'RandomBrightness',
                                }:
                                    layer_cfg.pop('data_format', None)

                            for v in obj.values():
                                _patch_batch_shape(v)
                        elif isinstance(obj, list):
                            for item in obj:
                                _patch_batch_shape(item)

                    # .keras files are zip archives containing config.json
                    with tempfile.TemporaryDirectory() as tmp_dir:
                        patched_model_path = os.path.join(tmp_dir, 'patched_model.keras')
                        with zipfile.ZipFile(self.model_path, 'r') as src_zip:
                            src_zip.extractall(tmp_dir)

                        config_path = os.path.join(tmp_dir, 'config.json')
                        if os.path.exists(config_path):
                            with open(config_path, 'r', encoding='utf-8') as f:
                                config_data = json.load(f)
                            _patch_batch_shape(config_data)
                            with open(config_path, 'w', encoding='utf-8') as f:
                                json.dump(config_data, f)

                        # Repack patched archive
                        with zipfile.ZipFile(patched_model_path, 'w', compression=zipfile.ZIP_DEFLATED) as out_zip:
                            for root, _, files in os.walk(tmp_dir):
                                for file_name in files:
                                    if file_name == 'patched_model.keras':
                                        continue
                                    full_path = os.path.join(root, file_name)
                                    rel_path = os.path.relpath(full_path, tmp_dir)
                                    out_zip.write(full_path, rel_path)

                        self.model = keras.models.load_model(patched_model_path)

                    print(f"✅ [MODEL LOADED] Successfully loaded from {self.model_path} (compat mode)", flush=True)
                    print(f"📐 [MODEL INFO] Input shape: {self.model.input_shape}", flush=True)
                    print(f"📐 [MODEL INFO] Output shape: {self.model.output_shape} (7 emotions)", flush=True)
                    print(f"🎭 [MODEL INFO] Emotions: {', '.join(self.EMOTION_LABELS)}", flush=True)
                    return
                except Exception as compat_error:
                    print(f"❌ [ERROR] Compatibility load failed: {str(compat_error)}", flush=True)
                    raise RuntimeError(f"Failed to load model: {str(compat_error)}")

            print(f"❌ [ERROR] Failed to load model: {str(e)}", flush=True)
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
                'scores': dict (emotion: probability for all 7 emotions)
            }
        """
        # Validate input shape
        if face_image.shape != (48, 48, 3):
            raise ValueError(f"Expected face shape (48,48,3), got {face_image.shape}")
        
        # Expand dimensions for batch processing
        face_batch = np.expand_dims(face_image, axis=0)
        
        # CRITICAL: Do NOT normalize manually
        # The model has internal Rescaling layer (scale=1/255)
        # Feed raw RGB values (0-255) directly
        
        # Predict
        predictions = self.model.predict(face_batch, verbose=0)[0]
        
        # Get dominant emotion
        dominant_idx = np.argmax(predictions)
        dominant_emotion = self.EMOTION_LABELS[dominant_idx]
        confidence = float(predictions[dominant_idx])
        
        # Create emotion scores dictionary for all emotions
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
        
        # Predict (no manual normalization)
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
