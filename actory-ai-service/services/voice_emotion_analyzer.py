"""
Voice Emotion Analyzer

Primary backend: SpeechBrain wav2vec2 emotion model.
Fallback backend: Hugging Face audio classification pipeline when SpeechBrain
cannot initialize (e.g., optional k2 dependency issues on some environments).
"""

from typing import Any, Dict, Optional

import numpy as np


class VoiceEmotionAnalyzer:
    """SpeechBrain-based voice emotion analyzer."""

    LABEL_MAPPING = {
        "ang": "angry",
        "anger": "angry",
        "angry": "angry",
        "hap": "happy",
        "exc": "happy",
        "happy": "happy",
        "sad": "sad",
        "neu": "neutral",
        "neutral": "neutral",
    }

    def __init__(self):
        self.classifier = None
        self.hf_model = None
        self.hf_tf_model = None
        self.hf_feature_extractor = None
        self.backend = None

        # Slower but more accurate HF inference settings.
        self.sample_rate = 16000
        self.min_duration_sec = 1.0
        self.max_segment_sec = 4.0
        self.max_segments = 12
        self._load_model()

    def _load_model(self):
        """Load voice emotion model with HF-first strategy."""
        hf_error_message = None
        hf_tf_error_message = None
        # HF-first avoids SpeechBrain optional k2 import failures on Windows.
        try:
            self._load_hf_fallback()
            return
        except Exception as hf_error:
            hf_error_message = str(hf_error)
            print(f"⚠️  [VOICE] HF (PyTorch) fallback unavailable, trying HF (TensorFlow): {str(hf_error)}", flush=True)

        try:
            self._load_hf_tf_fallback()
            return
        except Exception as hf_tf_error:
            hf_tf_error_message = str(hf_tf_error)
            print(f"⚠️  [VOICE] HF (TensorFlow) fallback unavailable, trying SpeechBrain: {hf_tf_error_message}", flush=True)

        try:
            print("\n🎙️  [VOICE] Loading SpeechBrain voice emotion model...", flush=True)
            from speechbrain.inference.interfaces import foreign_class

            self.classifier = foreign_class(
                source="speechbrain/emotion-recognition-wav2vec2-IEMOCAP",
                pymodule_file="custom_interface.py",
                classname="CustomEncoderWav2vec2Classifier",
            )
            self.backend = "speechbrain"
            print("✅ [VOICE] SpeechBrain voice model loaded", flush=True)
        except Exception as sb_error:
            self.classifier = None
            self.backend = None
            raise RuntimeError(
                f"Failed to load voice model backends. HF(torch) error: {hf_error_message or 'unknown'} | HF(tf) error: {hf_tf_error_message or 'unknown'} | SpeechBrain error: {str(sb_error)}"
            )

    def _load_hf_fallback(self):
        """Load a fallback audio emotion classifier from Hugging Face."""
        try:
            print("🎙️  [VOICE] Loading HF fallback model (PyTorch, superb/wav2vec2-base-superb-er)...", flush=True)
            from transformers import AutoFeatureExtractor, AutoModelForAudioClassification

            model_id = "superb/wav2vec2-base-superb-er"
            self.hf_feature_extractor = AutoFeatureExtractor.from_pretrained(model_id)
            self.hf_model = AutoModelForAudioClassification.from_pretrained(model_id)
            self.backend = "hf"
            print("✅ [VOICE] HF (PyTorch) fallback model loaded", flush=True)
        except Exception as e:
            self.hf_model = None
            self.hf_feature_extractor = None
            self.backend = None
            raise RuntimeError(f"Failed to load HF (PyTorch) fallback model: {str(e)}")

    def _load_hf_tf_fallback(self):
        """Load a TensorFlow fallback audio emotion classifier from Hugging Face."""
        try:
            print("🎙️  [VOICE] Loading HF fallback model (TensorFlow, superb/wav2vec2-base-superb-er)...", flush=True)
            from transformers import AutoFeatureExtractor, TFAutoModelForAudioClassification

            model_id = "superb/wav2vec2-base-superb-er"
            self.hf_feature_extractor = AutoFeatureExtractor.from_pretrained(model_id)
            self.hf_tf_model = TFAutoModelForAudioClassification.from_pretrained(model_id, from_pt=True)
            self.backend = "hf-tf"
            print("✅ [VOICE] HF (TensorFlow) fallback model loaded", flush=True)
        except Exception as e:
            self.hf_tf_model = None
            self.backend = None
            raise RuntimeError(f"Failed to load HF (TensorFlow) fallback model: {str(e)}")

    def _extract_label(self, text_lab: Any) -> str:
        """Normalize classifier label to project emotion names."""
        if isinstance(text_lab, (list, tuple)) and text_lab:
            label = str(text_lab[0]).strip().lower()
        else:
            label = str(text_lab).strip().lower()

        return self.LABEL_MAPPING.get(label, "neutral")

    def _extract_confidence(self, out_prob: Any, index: Any, score: Any) -> float:
        """Extract confidence robustly from model output."""
        try:
            # Prefer probability at predicted index when available.
            predicted_idx = int(index.item()) if hasattr(index, "item") else int(index)

            if hasattr(out_prob, "squeeze"):
                probs = out_prob.squeeze()
                if hasattr(probs, "numel") and probs.numel() > predicted_idx:
                    val = float(probs[predicted_idx].item())
                    return max(0.0, min(1.0, val))
        except Exception:
            pass

        try:
            val = float(score.item()) if hasattr(score, "item") else float(score)
            return max(0.0, min(1.0, val))
        except Exception:
            return 0.0

    def analyze(self, audio_path: str) -> Dict[str, Optional[float]]:
        """
        Analyze voice emotion for a WAV audio file.

        Args:
            audio_path: Path to WAV audio file.

        Returns:
            Dict with keys:
            - voiceEmotion (str)
            - voiceConfidence (float 0..1)
        """
        if self.backend is None:
            raise RuntimeError("Voice classifier is not initialized")

        print("\n🎙️  [VOICE] Running voice emotion analysis...", flush=True)
        print(f"📁 [VOICE] Audio file: {audio_path}", flush=True)

        if self.backend == "speechbrain":
            out_prob, score, index, text_lab = self.classifier.classify_file(audio_path)
            voice_emotion = self._extract_label(text_lab)
            voice_confidence = self._extract_confidence(out_prob, index, score)
        elif self.backend == "hf":
            import librosa
            import torch

            wav, sr = librosa.load(audio_path, sr=self.sample_rate, mono=True)
            if wav.size == 0:
                return {"voiceEmotion": "neutral", "voiceConfidence": 0.0}

            # Reject near-silent clips early.
            rms = float(np.sqrt(np.mean(np.square(wav))))
            if rms < 0.002:
                print("⚠️  [VOICE] Low-energy audio detected; returning neutral", flush=True)
                return {"voiceEmotion": "neutral", "voiceConfidence": 0.0}

            # Keep voiced intervals so long silence/background does not dominate.
            intervals = librosa.effects.split(wav, top_db=28)
            segments = []
            for start, end in intervals:
                seg = wav[start:end]
                if len(seg) >= int(self.min_duration_sec * sr):
                    segments.append(seg)

            if not segments:
                segments = [wav]

            max_len = int(self.max_segment_sec * sr)
            chunk_probs = []
            chunk_weights = []

            for seg in segments[: self.max_segments]:
                windows = [seg[i:i + max_len] for i in range(0, len(seg), max_len)] if len(seg) > max_len else [seg]

                for w in windows:
                    if len(w) < int(0.5 * sr):
                        continue

                    inputs = self.hf_feature_extractor(
                        w,
                        sampling_rate=sr,
                        return_tensors="pt",
                        padding=True,
                    )
                    with torch.no_grad():
                        logits = self.hf_model(**inputs).logits
                        probs = torch.softmax(logits, dim=-1)[0].cpu().numpy()

                    energy = float(np.sqrt(np.mean(np.square(w))))
                    chunk_probs.append(probs)
                    chunk_weights.append(max(energy, 1e-6))

            if not chunk_probs:
                return {"voiceEmotion": "neutral", "voiceConfidence": 0.0}

            weighted = np.average(np.vstack(chunk_probs), axis=0, weights=np.array(chunk_weights))
            pred_idx = int(np.argmax(weighted))
            label = str(self.hf_model.config.id2label.get(pred_idx, "neutral")).lower()
            voice_emotion = self._extract_label(label)
            voice_confidence = float(weighted[pred_idx])
        elif self.backend == "hf-tf":
            import librosa
            import tensorflow as tf

            wav, sr = librosa.load(audio_path, sr=self.sample_rate, mono=True)
            if wav.size == 0:
                return {"voiceEmotion": "neutral", "voiceConfidence": 0.0}

            # Reject near-silent clips early.
            rms = float(np.sqrt(np.mean(np.square(wav))))
            if rms < 0.002:
                print("⚠️  [VOICE] Low-energy audio detected; returning neutral", flush=True)
                return {"voiceEmotion": "neutral", "voiceConfidence": 0.0}

            # Keep voiced intervals so long silence/background does not dominate.
            intervals = librosa.effects.split(wav, top_db=28)
            segments = []
            for start, end in intervals:
                seg = wav[start:end]
                if len(seg) >= int(self.min_duration_sec * sr):
                    segments.append(seg)

            if not segments:
                segments = [wav]

            max_len = int(self.max_segment_sec * sr)
            chunk_probs = []
            chunk_weights = []

            for seg in segments[: self.max_segments]:
                windows = [seg[i:i + max_len] for i in range(0, len(seg), max_len)] if len(seg) > max_len else [seg]

                for w in windows:
                    if len(w) < int(0.5 * sr):
                        continue

                    inputs = self.hf_feature_extractor(
                        w,
                        sampling_rate=sr,
                        return_tensors="tf",
                        padding=True,
                    )
                    logits = self.hf_tf_model(**inputs).logits
                    probs = tf.nn.softmax(logits, axis=-1)[0].numpy()

                    energy = float(np.sqrt(np.mean(np.square(w))))
                    chunk_probs.append(probs)
                    chunk_weights.append(max(energy, 1e-6))

            if not chunk_probs:
                return {"voiceEmotion": "neutral", "voiceConfidence": 0.0}

            weighted = np.average(np.vstack(chunk_probs), axis=0, weights=np.array(chunk_weights))
            pred_idx = int(np.argmax(weighted))
            label = str(self.hf_tf_model.config.id2label.get(pred_idx, "neutral")).lower()
            voice_emotion = self._extract_label(label)
            voice_confidence = float(weighted[pred_idx])
        else:
            raise RuntimeError(f"Unsupported voice backend: {self.backend}")

        print(
            f"✅ [VOICE] ({self.backend}) Detected voice emotion: {voice_emotion} ({voice_confidence:.1%})",
            flush=True,
        )

        return {
            "voiceEmotion": voice_emotion,
            "voiceConfidence": voice_confidence,
        }
