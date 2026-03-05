/**
 * Emotion Extractor Utility
 * 
 * Extracts required emotion from casting call descriptions using keyword matching
 */

/**
 * Extract emotion from casting description text
 * @param {string} description - Casting call description
 * @returns {string} - Detected emotion or 'neutral' as default
 */
const extractEmotionFromDescription = (description) => {
  if (!description || typeof description !== 'string') {
    return 'neutral';
  }
  
  // Convert to lowercase for matching
  const text = description.toLowerCase();
  
  // Emotion keyword patterns (ordered by priority)
  const emotionPatterns = [
    {
      emotion: 'happy',
      keywords: ['happy', 'happiness', 'joyful', 'joyfulness', 'cheerful', 'cheerfulness', 'excited', 'excitement', 'elated', 'delighted', 'pleased', 'content', 'upbeat', 'positive', 'smiling', 'laugh', 'laughter', 'joy']
    },
    {
      emotion: 'sad',
      keywords: ['sad', 'sadness', 'depressed', 'depression', 'melancholy', 'sorrowful', 'sorrow', 'grief', 'heartbroken', 'crying', 'tears', 'unhappy', 'miserable', 'mourning', 'despair']
    },
    {
      emotion: 'angry',
      keywords: ['angry', 'anger', 'furious', 'fury', 'enraged', 'mad', 'madness', 'irritated', 'annoyed', 'frustrated', 'frustration', 'rage', 'hostile', 'aggressive', 'bitter', 'resentful']
    },
    {
      emotion: 'fear',
      keywords: ['fear', 'fearful', 'afraid', 'scared', 'terrified', 'terror', 'frightened', 'anxious', 'anxiety', 'nervous', 'worried', 'worry', 'panic', 'horror', 'dread', 'alarmed']
    },
    {
      emotion: 'surprise',
      keywords: ['surprise', 'surprised', 'shocked', 'astonished', 'amazed', 'startled', 'stunned', 'unexpected', 'bewildered']
    },
    {
      emotion: 'disgust',
      keywords: ['disgust', 'disgusted', 'revolted', 'repulsed', 'nauseated', 'sick', 'appalled', 'horrified', 'contempt']
    },
    {
      emotion: 'neutral',
      keywords: ['neutral', 'calm', 'composed', 'stoic', 'indifferent', 'detached', 'expressionless', 'blank']
    }
  ];
  
  // Count keyword matches for each emotion
  const emotionScores = {};
  
  for (const pattern of emotionPatterns) {
    emotionScores[pattern.emotion] = 0;
    
    for (const keyword of pattern.keywords) {
      // Use word boundary regex to match whole words
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        emotionScores[pattern.emotion] += matches.length;
      }
    }
  }
  
  // Find emotion with highest score
  let maxScore = 0;
  let detectedEmotion = 'neutral';
  
  for (const [emotion, score] of Object.entries(emotionScores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedEmotion = emotion;
    }
  }
  
  return detectedEmotion;
};

/**
 * Extract all emotions mentioned in description
 * @param {string} description - Casting call description
 * @returns {Array<string>} - Array of detected emotions
 */
const extractAllEmotions = (description) => {
  if (!description || typeof description !== 'string') {
    return ['neutral'];
  }
  
  const text = description.toLowerCase();
  const foundEmotions = [];
  
  const emotionKeywords = {
    happy: ['happy', 'joyful', 'cheerful', 'excited'],
    sad: ['sad', 'depressed', 'melancholy', 'sorrowful'],
    angry: ['angry', 'furious', 'enraged', 'mad'],
    fear: ['fear', 'afraid', 'scared', 'terrified'],
    surprise: ['surprise', 'surprised', 'shocked', 'astonished'],
    disgust: ['disgust', 'disgusted', 'revolted'],
    neutral: ['neutral', 'calm', 'composed']
  };
  
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        if (!foundEmotions.includes(emotion)) {
          foundEmotions.push(emotion);
        }
        break;
      }
    }
  }
  
  return foundEmotions.length > 0 ? foundEmotions : ['neutral'];
};

module.exports = {
  extractEmotionFromDescription,
  extractAllEmotions
};
