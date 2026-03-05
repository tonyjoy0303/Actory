/**
 * AI Emotion Analysis Display Component
 * 
 * Displays emotion analysis results for audition submissions
 * including emotion match score, detected emotions, and feedback
 */

import React from 'react';
import PropTypes from 'prop-types';
import './EmotionAnalysisDisplay.css';

const EmotionAnalysisDisplay = ({ submission, darkTheme = false }) => {
  const {
    aiAnalyzed,
    requiredEmotion,
    detectedEmotion,
    emotionScores,
    emotionMatchScore,
    confidence,
    overallScore,
    feedback,
    framesAnalyzed,
    analyzedAt
  } = submission;

  // Emotion colors for visual feedback
  const emotionColors = {
    happy: '#FFD700',
    sad: '#4682B4',
    angry: '#DC143C',
    fear: '#9370DB',
    surprise: '#FF6347',
    disgust: '#8B4513',
    neutral: '#808080'
  };

  // Emotion icons
  const emotionIcons = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fear: '😨',
    surprise: '😲',
    disgust: '🤢',
    neutral: '😐'
  };

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 75) return '#10B981'; // Green
    if (score >= 50) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Not analyzed';
    return new Date(date).toLocaleString();
  };

  // Dark theme class helper
  const cardClass = darkTheme 
    ? 'emotion-analysis-card dark-theme' 
    : 'emotion-analysis-card';

  // Render loading state
  if (!aiAnalyzed) {
    return (
      <div className={cardClass}>
        <div className="analysis-pending">
          <div className="spinner"></div>
          <p style={darkTheme ? {color: '#94a3b8'} : {}}>AI Analysis Pending...</p>
          <small style={darkTheme ? {color: '#64748b'} : {}}>The video is being analyzed for emotion detection</small>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass} style={darkTheme ? {
      background: 'transparent',
      boxShadow: 'none',
      color: '#e2e8f0'
    } : {}}>
      {/* Header */}
      <div className="analysis-header" style={darkTheme ? {borderColor: '#475569'} : {}}>
        <h3 style={darkTheme ? {color: '#e2e8f0'} : {}}>🤖 AI Emotion Analysis</h3>
        <span className="analysis-date" style={darkTheme ? {color: '#94a3b8'} : {}}>
          Analyzed: {formatDate(analyzedAt)}
        </span>
      </div>

      {/* Overall Score */}
      <div className="overall-score-section">
        <div className="score-circle" style={{ 
          borderColor: getScoreColor(overallScore),
          background: darkTheme ? '#1e293b' : 'white'
        }}>
          <div className="score-value" style={{ color: getScoreColor(overallScore) }}>
            {overallScore}
          </div>
          <div className="score-label" style={darkTheme ? {color: '#94a3b8'} : {}}>Overall Score</div>
        </div>
      </div>

      {/* Emotion Comparison */}
      <div className="emotion-comparison">
        <div className="emotion-box required">
          <div className="emotion-label" style={darkTheme ? {color: '#94a3b8'} : {}}>Required</div>
          <div className="emotion-icon" style={{ backgroundColor: emotionColors[requiredEmotion] }}>
            {emotionIcons[requiredEmotion]}
          </div>
          <div className="emotion-name" style={darkTheme ? {color: '#e2e8f0'} : {}}>{requiredEmotion}</div>
        </div>

        <div className="comparison-arrow">→</div>

        <div className="emotion-box detected">
          <div className="emotion-label" style={darkTheme ? {color: '#94a3b8'} : {}}>Detected</div>
          <div className="emotion-icon" style={{ backgroundColor: emotionColors[detectedEmotion] }}>
            {emotionIcons[detectedEmotion]}
          </div>
          <div className="emotion-name" style={darkTheme ? {color: '#e2e8f0'} : {}}>{detectedEmotion}</div>
        </div>
      </div>

      {/* Match Score */}
      <div className="match-score-section">
        <div className="match-info">
          <span className="match-label" style={darkTheme ? {color: '#94a3b8'} : {}}>Emotion Match</span>
          <span className="match-value" style={{ color: getScoreColor(emotionMatchScore) }}>
            {emotionMatchScore}%
          </span>
        </div>
        <div className="progress-bar" style={darkTheme ? {background: '#334155'} : {}}>
          <div 
            className="progress-fill" 
            style={{ 
              width: `${emotionMatchScore}%`,
              backgroundColor: getScoreColor(emotionMatchScore)
            }}
          ></div>
        </div>
      </div>

      {/* Emotion Distribution Chart */}
      {emotionScores && (
        <div className="emotion-distribution">
          <h4 style={darkTheme ? {color: '#e2e8f0'} : {}}>Emotion Distribution</h4>
          <div className="emotion-bars">
            {Object.entries(emotionScores).map(([emotion, score]) => (
              <div key={emotion} className="emotion-bar-item">
                <div className="emotion-bar-header">
                  <span className="emotion-bar-icon">{emotionIcons[emotion]}</span>
                  <span className="emotion-bar-label" style={darkTheme ? {color: '#cbd5e1'} : {}}>{emotion}</span>
                  <span className="emotion-bar-value" style={darkTheme ? {color: '#94a3b8'} : {}}>
                    {(score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="emotion-bar-track" style={darkTheme ? {background: '#334155'} : {}}>
                  <div 
                    className="emotion-bar-fill"
                    style={{ 
                      width: `${score * 100}%`,
                      backgroundColor: emotionColors[emotion]
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Feedback */}
      <div className="ai-feedback" style={darkTheme ? {
        background: '#1e293b',
        borderColor: '#3b82f6'
      } : {}}>
        <div className="feedback-header">
          <span className="feedback-icon">💬</span>
          <span className="feedback-title" style={darkTheme ? {color: '#e2e8f0'} : {}}>AI Feedback</span>
        </div>
        <p className="feedback-text" style={darkTheme ? {color: '#cbd5e1'} : {}}>{feedback}</p>
      </div>

      {/* Analysis Stats */}
      <div className="analysis-stats" style={darkTheme ? {borderColor: '#475569'} : {}}>
        <div className="stat-item" style={darkTheme ? {background: '#1e293b'} : {}}>
          <span className="stat-label" style={darkTheme ? {color: '#94a3b8'} : {}}>Confidence</span>
          <span className="stat-value" style={darkTheme ? {color: '#e2e8f0'} : {}}>
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>
        <div className="stat-item" style={darkTheme ? {background: '#1e293b'} : {}}>
          <span className="stat-label" style={darkTheme ? {color: '#94a3b8'} : {}}>Frames Analyzed</span>
          <span className="stat-value" style={darkTheme ? {color: '#e2e8f0'} : {}}>
            {framesAnalyzed}
          </span>
        </div>
      </div>
    </div>
  );
};

EmotionAnalysisDisplay.propTypes = {
  submission: PropTypes.shape({
    aiAnalyzed: PropTypes.bool,
    requiredEmotion: PropTypes.string,
    detectedEmotion: PropTypes.string,
    emotionScores: PropTypes.object,
    emotionMatchScore: PropTypes.number,
    confidence: PropTypes.number,
    overallScore: PropTypes.number,
    feedback: PropTypes.string,
    framesAnalyzed: PropTypes.number,
    analyzedAt: PropTypes.string
  }).isRequired,
  darkTheme: PropTypes.bool
};

export default EmotionAnalysisDisplay;
