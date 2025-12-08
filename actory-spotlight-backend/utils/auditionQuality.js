const calculateLightingScore = (videoMetadata) => {
  // Analyze brightness, contrast, and lighting consistency
  // For now, we'll use a placeholder score
  return videoMetadata.brightness || 0.75;
};

const calculateAudioScore = (videoMetadata) => {
  // Analyze audio clarity, volume levels, and background noise
  // For now, we'll use a placeholder score
  return videoMetadata.audioQuality || 0.8;
};

const calculateKeywordOverlap = (roleDescription, auditionMetadata) => {
  const roleKeywords = roleDescription.toLowerCase().split(/\W+/);
  const auditionKeywords = auditionMetadata.description.toLowerCase().split(/\W+/);
  
  const overlap = roleKeywords.filter(word => 
    auditionKeywords.includes(word) && word.length > 3
  ).length;
  
  return Math.min(overlap / 10, 1); // Normalize to 0-1
};

const evaluateAuditionQuality = ({
  videoMetadata,
  auditionMetadata,
  roleDescription,
  producerWatchTime,
  previousShortlists = 0
}) => {
  // Calculate individual scores
  const scores = {
    video: {
      resolution: videoMetadata.height >= 720 ? 1 : videoMetadata.height >= 480 ? 0.5 : 0.3,
      duration: videoMetadata.duration >= 60 && videoMetadata.duration <= 180 ? 1 : 0.5,
      lighting: calculateLightingScore(videoMetadata),
      audio: calculateAudioScore(videoMetadata)
    },
    engagement: {
      watchTimePercentage: producerWatchTime / 100,
      retakes: Math.min(auditionMetadata.retakes || 1, 3) / 3,
      shortlistHistory: Math.min(previousShortlists, 5) / 5
    },
    relevance: {
      keywordMatch: calculateKeywordOverlap(roleDescription, auditionMetadata)
    }
  };

  // Calculate weighted scores
  const weights = {
    video: {
      resolution: 0.15,
      duration: 0.1,
      lighting: 0.2,
      audio: 0.2
    },
    engagement: {
      watchTimePercentage: 0.15,
      retakes: 0.05,
      shortlistHistory: 0.05
    },
    relevance: {
      keywordMatch: 0.1
    }
  };

  // Calculate final score
  const finalScore = 
    (scores.video.resolution * weights.video.resolution) +
    (scores.video.duration * weights.video.duration) +
    (scores.video.lighting * weights.video.lighting) +
    (scores.video.audio * weights.video.audio) +
    (scores.engagement.watchTimePercentage * weights.engagement.watchTimePercentage) +
    (scores.engagement.retakes * weights.engagement.retakes) +
    (scores.engagement.shortlistHistory * weights.engagement.shortlistHistory) +
    (scores.relevance.keywordMatch * weights.relevance.keywordMatch);

  // Determine quality level
  let quality;
  if (finalScore >= 0.8) {
    quality = 'High';
  } else if (finalScore >= 0.6) {
    quality = 'Medium';
  } else {
    quality = 'Low';
  }

  return {
    quality,
    score: finalScore,
    details: {
      scores,
      weights
    }
  };
};

module.exports = {
  evaluateAuditionQuality
};