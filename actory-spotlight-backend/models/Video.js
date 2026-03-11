const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
  },
  videoUrl: {
    type: String,
    required: true,
  },
  cloudinaryId: {
    type: String,
    required: true,
  },
  // URL to the actor's portfolio PDF (required for audition submissions)
  portfolioUrl: {
    type: String,
    required: function() { return this.type === 'audition'; },
  },
  // Government ID proof (required for audition submissions)
  idProofUrl: {
    type: String,
    required: function() { return this.type === 'audition'; },
  },
  // Webcam photo (required for audition submissions)
  webcamPhotoUrl: {
    type: String,
    required: function() { return this.type === 'audition'; },
  },
  actor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  castingCall: {
    type: mongoose.Schema.ObjectId,
    ref: 'CastingCall',
    // Make this optional for profile videos
    required: function() { return this.type === 'audition'; },
  },
  // Add type field to distinguish between profile and audition videos
  type: {
    type: String,
    enum: ['profile', 'audition'],
    default: 'audition', // Default to 'audition' for backward compatibility
    required: true,
  },
  // Added physical attributes (only required for auditions)
  height: {
    type: Number,
    required: function() { return this.type === 'audition'; },
    min: [50, 'Height seems too low'],
    max: [300, 'Height seems too high'],
  },
  weight: {
    type: Number,
    required: function() { return this.type === 'audition'; },
    min: [10, 'Weight seems too low'],
    max: [500, 'Weight seems too high'],
  },
  age: {
    type: Number,
    required: function() { return this.type === 'audition'; },
    min: [1, 'Age seems too low'],
    max: [120, 'Age seems too high'],
  },
  skills: {
    type: [String],
    required: function() { return this.type === 'audition'; },
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Please add at least one skill',
    },
  },
  permanentAddress: {
    type: String,
    required: function() { return this.type === 'audition'; },
    trim: true,
  },
  livingCity: {
    type: String,
    required: function() { return this.type === 'audition'; },
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: function() { return this.type === 'audition'; },
  },
  phoneNumber: {
    type: String,
    required: function() { return this.type === 'audition'; },
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending',
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  qualityAssessment: {
    level: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    score: {
      type: Number,
      default: 0
    },
    details: {
      scores: {
        video: {
          resolution: Number,
          duration: Number,
          lighting: Number,
          audio: Number
        },
        engagement: {
          watchTimePercentage: Number,
          retakes: Number,
          shortlistHistory: Number
        },
        relevance: {
          keywordMatch: Number
        }
      },
      weights: {
        video: {
          resolution: Number,
          duration: Number,
          lighting: Number,
          audio: Number
        },
        engagement: {
          watchTimePercentage: Number,
          retakes: Number,
          shortlistHistory: Number
        },
        relevance: {
          keywordMatch: Number
        }
      }
    }
  },
  videoMetrics: {
    height: Number,
    duration: Number,
    brightness: Number,
    audioQuality: Number,
    retakes: {
      type: Number,
      default: 1
    },
    watchTime: {
      type: Number,
      default: 0
    }
  },
  // 🤖 AI Emotion Analysis Fields
  aiAnalysis: {
    // Has AI analysis been performed
    analyzed: {
      type: Boolean,
      default: false,
    },
    // Required emotion from casting (stored when analysis is run)
    requiredEmotion: {
      type: String,
      enum: ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral'],
      default: 'neutral',
    },
    // Detected emotion from video analysis
    detectedEmotion: {
      type: String,
      enum: ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral'],
    },
    // Detailed emotion probability scores for all emotions (0-1)
    emotionScores: {
      angry: { type: Number, min: 0, max: 1 },
      disgust: { type: Number, min: 0, max: 1 },
      fear: { type: Number, min: 0, max: 1 },
      happy: { type: Number, min: 0, max: 1 },
      sad: { type: Number, min: 0, max: 1 },
      surprise: { type: Number, min: 0, max: 1 },
      neutral: { type: Number, min: 0, max: 1 },
    },
    // How well the detected emotion matches the required emotion (0-100)
    emotionMatchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    // Performance Metrics (0-100)
    emotionConsistency: {
      type: Number,
      min: 0,
      max: 100,
    },
    expressionIntensity: {
      type: Number,
      min: 0,
      max: 100,
    },
    faceVisibility: {
      type: Number,
      min: 0,
      max: 100,
    },
    // Overall performance score combining all metrics (0-100)
    overallPerformanceScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    // Emotion timeline showing transitions over time
    emotionTimeline: [{
      emotion: {
        type: String,
        enum: ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral'],
      },
      start: Number, // seconds
      end: Number,   // seconds
    }],
    // Number of frames analyzed in the video
    framesAnalyzed: {
      type: Number,
      min: 0,
    },
    // Confidence level of emotion detection (0-1)
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    // Legacy overall score (deprecated in favor of overallPerformanceScore)
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    // AI feedback message
    feedback: String,
    // Timestamp of last AI analysis
    analyzedAt: Date,
    // Error message if analysis failed
    error: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries on casting and ai analysis
VideoSchema.index({ castingCall: 1 });
VideoSchema.index({ 'aiAnalysis.analyzed': 1 });
VideoSchema.index({ 'aiAnalysis.overallScore': -1 });

module.exports = mongoose.model('Video', VideoSchema);