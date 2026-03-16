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
    emotionConsistency,
    expressionIntensity,
    faceVisibility,
    overallPerformanceScore,
    confidence,
    overallScore,
    feedback,
    framesAnalyzed,
    analyzedAt,
    faceEmotion,
    voiceEmotion,
    faceConfidence,
    voiceConfidence,
    combinedEmotionConfidence,
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

  // Emotion markers (text-only, no emoji)
  const emotionIcons = {
    happy: 'H',
    sad: 'S',
    angry: 'A',
    fear: 'F',
    surprise: 'SU',
    disgust: 'D',
    neutral: 'N'
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

  const displayOverallScore = Number(overallPerformanceScore ?? overallScore ?? 0);

  const metricCards = [
    { key: 'match', label: 'Emotion Match', value: Number(emotionMatchScore || 0) },
    { key: 'consistency', label: 'Consistency', value: Number(emotionConsistency || 0) },
    { key: 'intensity', label: 'Intensity', value: Number(expressionIntensity || 0) },
    { key: 'visibility', label: 'Face Visibility', value: Number(faceVisibility || 0) },
  ];

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
        <h3 style={darkTheme ? {color: '#e2e8f0'} : {}}>AI Emotion Analysis</h3>
        <span className="analysis-date" style={darkTheme ? {color: '#94a3b8'} : {}}>
          Analyzed: {formatDate(analyzedAt)}
        </span>
      </div>

      {/* Overall Score */}
      <div className="overall-score-section">
        <div className="score-circle" style={{ 
          borderColor: getScoreColor(displayOverallScore),
          background: darkTheme ? '#1e293b' : 'white'
        }}>
          <div className="score-value" style={{ color: getScoreColor(displayOverallScore) }}>
            {Math.round(displayOverallScore)}
          </div>
          <div className="score-label" style={darkTheme ? {color: '#94a3b8'} : {}}>Overall Performance</div>
        </div>
      </div>

      <div className="metrics-grid">
        {metricCards.map((metric) => (
          <div key={metric.key} className="metric-card" style={darkTheme ? { background: '#1e293b', borderColor: '#334155' } : {}}>
            <div className="metric-label" style={darkTheme ? { color: '#94a3b8' } : {}}>{metric.label}</div>
            <div className="metric-value" style={{ color: getScoreColor(metric.value) }}>{Math.round(metric.value)}%</div>
            <div className="metric-track" style={darkTheme ? { background: '#334155' } : {}}>
              <div
                className="metric-fill"
                style={{
                  width: `${Math.min(Math.max(metric.value, 0), 100)}%`,
                  backgroundColor: getScoreColor(metric.value),
                }}
              ></div>
            </div>
          </div>
        ))}
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

      {/* Multimodal Analysis */}
      {(faceEmotion || voiceEmotion) && (
        <div className="multimodal-analysis" style={darkTheme ? { borderColor: '#475569', background: '#0f172a' } : {}}>
          <h4 style={darkTheme ? { color: '#e2e8f0' } : {}}>Multimodal Analysis</h4>
          <div className="modality-grid">
            <div className="modality-item" style={darkTheme ? { background: '#1e293b' } : {}}>
              <div className="modality-header">
                <span>Face</span>
                <span>{emotionIcons[faceEmotion] || 'N'}</span>
              </div>
              <div className="modality-emotion" style={darkTheme ? { color: '#e2e8f0' } : {}}>
                {faceEmotion || 'unknown'}
              </div>
              <div className="modality-confidence-bar" style={darkTheme ? { background: '#334155' } : {}}>
                <div
                  className="modality-confidence-fill"
                  style={{ width: `${(faceConfidence || 0) * 100}%`, backgroundColor: '#6366f1' }}
                />
              </div>
              <div className="modality-confidence-label" style={darkTheme ? { color: '#94a3b8' } : {}}>
                {((faceConfidence || 0) * 100).toFixed(1)}% confident
              </div>
            </div>
            <div className="modality-item" style={darkTheme ? { background: '#1e293b' } : {}}>
              <div className="modality-header">
                <span>Voice</span>
                <span>{emotionIcons[voiceEmotion] || 'N'}</span>
              </div>
              <div className="modality-emotion" style={darkTheme ? { color: '#e2e8f0' } : {}}>
                {voiceEmotion || 'neutral'}
              </div>
              <div className="modality-confidence-bar" style={darkTheme ? { background: '#334155' } : {}}>
                <div
                  className="modality-confidence-fill"
                  style={{ width: `${(voiceConfidence || 0) * 100}%`, backgroundColor: '#10b981' }}
                />
              </div>
              <div className="modality-confidence-label" style={darkTheme ? { color: '#94a3b8' } : {}}>
                {((voiceConfidence || 0) * 100).toFixed(1)}% confident
              </div>
            </div>
          </div>
          <div className="combined-confidence" style={darkTheme ? { borderColor: '#334155' } : {}}>
            <div className="combined-label" style={darkTheme ? { color: '#94a3b8' } : {}}>
              Combined Confidence (60% face + 40% voice)
            </div>
            <div className="combined-bar-row">
              <div className="progress-bar" style={darkTheme ? { background: '#334155' } : {}}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${(combinedEmotionConfidence || 0) * 100}%`,
                    backgroundColor: getScoreColor((combinedEmotionConfidence || 0) * 100),
                  }}
                />
              </div>
              <span
                className="combined-value"
                style={{ color: getScoreColor((combinedEmotionConfidence || 0) * 100) }}
              >
                {((combinedEmotionConfidence || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Emotion Distribution Chart */}
      {emotionScores && (
        <div className="emotion-distribution">
          <h4 style={darkTheme ? {color: '#e2e8f0'} : {}}>Emotion Distribution</h4>
          <div className="emotion-bars">
            {Object.entries(emotionScores).map(([emotion, score]) => (
              <div key={emotion} className="emotion-bar-item">
                <div className="emotion-bar-header">
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
          <span className="feedback-icon">AI</span>
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
    emotionConsistency: PropTypes.number,
    expressionIntensity: PropTypes.number,
    faceVisibility: PropTypes.number,
    overallPerformanceScore: PropTypes.number,
    confidence: PropTypes.number,
    overallScore: PropTypes.number,
    feedback: PropTypes.string,
    framesAnalyzed: PropTypes.number,
    analyzedAt: PropTypes.string,
    faceEmotion: PropTypes.string,
    voiceEmotion: PropTypes.string,
    faceConfidence: PropTypes.number,
    voiceConfidence: PropTypes.number,
    combinedEmotionConfidence: PropTypes.number,
  }).isRequired,
  darkTheme: PropTypes.bool
};

export default EmotionAnalysisDisplay;
