/**
 * MongoDB Schema for Audition Submissions with AI Analysis
 * 
 * Updated to include emotion analysis fields
 */

const mongoose = require('mongoose');

const auditionSchema = new mongoose.Schema({
  // Basic submission info
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  casting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Casting',
    required: true
  },
  
  // Video details
  videoURL: {
    type: String,
    required: true
  },
  thumbnailURL: {
    type: String
  },
  
  // AI Emotion Analysis Fields
  requiredEmotion: {
    type: String,
    enum: ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral'],
    lowercase: true
  },
  detectedEmotion: {
    type: String,
    enum: ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral', null],
    lowercase: true,
    default: null
  },
  emotionScores: {
    angry: { type: Number, min: 0, max: 1, default: 0 },
    disgust: { type: Number, min: 0, max: 1, default: 0 },
    fear: { type: Number, min: 0, max: 1, default: 0 },
    happy: { type: Number, min: 0, max: 1, default: 0 },
    sad: { type: Number, min: 0, max: 1, default: 0 },
    surprise: { type: Number, min: 0, max: 1, default: 0 },
    neutral: { type: Number, min: 0, max: 1, default: 0 }
  },
  emotionMatchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  feedback: {
    type: String,
    default: ''
  },
  framesAnalyzed: {
    type: Number,
    default: 0
  },
  aiAnalyzed: {
    type: Boolean,
    default: false
  },
  aiAnalysisError: {
    type: String,
    default: null
  },
  
  // Submission metadata
  submittedAt: {
    type: Date,
    default: Date.now
  },
  analyzedAt: {
    type: Date
  },
  
  // Actor details (for quick access)
  actorName: String,
  actorEmail: String,
  actorPhone: String,
  
  // Additional submission fields
  coverLetter: String,
  experience: String,
  availability: String,
  
  // Status
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'shortlisted', 'rejected', 'selected'],
    default: 'submitted'
  },
  
  // Recruiter notes
  recruiterNotes: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
auditionSchema.index({ casting: 1, submittedAt: -1 });
auditionSchema.index({ actor: 1, casting: 1 }, { unique: true });
auditionSchema.index({ emotionMatchScore: -1 });
auditionSchema.index({ aiAnalyzed: 1 });

module.exports = mongoose.model('Audition', auditionSchema);
