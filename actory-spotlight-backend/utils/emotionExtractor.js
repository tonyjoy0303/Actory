/**
 * Emotion Extractor Utility
 * 
 * Extracts required emotion from casting call descriptions using keyword matching
 */

const EMOTION_KEYWORDS = {
  happy: [
    'happy', 'happiness', 'joy', 'joyful', 'joyfulness', 'cheerful', 'cheerfulness',
    'excited', 'excitement', 'elated', 'delighted', 'pleased', 'content', 'contented',
    'upbeat', 'positive', 'smiling', 'smile', 'laugh', 'laughing', 'laughter',
    'playful', 'gleeful', 'thrilled', 'thrill', 'ecstatic', 'radiant', 'sunny',
    'lighthearted', 'light-hearted', 'bubbly', 'jolly', 'merry', 'blissful',
    'optimistic', 'hopeful', 'celebratory', 'celebrate', 'fun-loving', 'fun loving',
    'good-humored', 'good humored', 'warm', 'chipper', 'bright', 'buoyant'
  ],
  sad: [
    'sad', 'sadness', 'depressed', 'depression', 'melancholy', 'melancholic',
    'sorrowful', 'sorrow', 'grief', 'grieving', 'heartbroken', 'heartbreak',
    'crying', 'cry', 'tears', 'tearful', 'unhappy', 'miserable', 'mourning',
    'despair', 'despairing', 'gloomy', 'downcast', 'downhearted', 'dejected',
    'hopeless', 'lonely', 'forlorn', 'hurt', 'broken', 'tragic', 'troubled',
    'anguished', 'blue', 'somber', 'sombre', 'weep', 'weeping', 'grieving mother',
    'devastated', 'distressed'
  ],
  angry: [
    'angry', 'anger', 'furious', 'fury', 'enraged', 'enrage', 'mad', 'madness',
    'irritated', 'irritation', 'annoyed', 'annoyance', 'frustrated', 'frustration',
    'rage', 'raging', 'hostile', 'aggressive', 'bitter', 'resentful', 'resentment',
    'outraged', 'outrage', 'heated', 'confrontational', 'snappy', 'short-tempered',
    'short tempered', 'hot-headed', 'hot headed', 'fuming', 'vengeful', 'wrathful',
    'wrath', 'irate', 'boiling', 'seething', 'livid', 'temper', 'explosive'
  ],
  fear: [
    'fear', 'fearful', 'afraid', 'scared', 'terrified', 'terror', 'frightened',
    'frightening', 'anxious', 'anxiety', 'nervous', 'nervousness', 'worried',
    'worry', 'panic', 'panicked', 'panicky', 'horror', 'dread', 'alarmed',
    'alarming', 'tense', 'uneasy', 'paranoid', 'paranoia', 'suspicious', 'shaken',
    'disturbed', 'haunted', 'apprehensive', 'timid', 'cautious', 'startled',
    'on edge', 'on-edge', 'petrified', 'traumatized', 'traumatised'
  ],
  surprise: [
    'surprise', 'surprised', 'shocked', 'shock', 'astonished', 'astonishing',
    'amazed', 'amazing', 'startled', 'stunned', 'unexpected', 'bewildered',
    'speechless', 'taken aback', 'taken-aback', 'caught off guard', 'caught-off-guard',
    'flabbergasted', 'astounded', 'wide-eyed', 'wide eyed', 'jaw-dropping',
    'jaw dropping', 'disbelief', 'disbelieving'
  ],
  disgust: [
    'disgust', 'disgusted', 'revolted', 'revolting', 'repulsed', 'repulsive',
    'nauseated', 'nauseous', 'sickened', 'sickening', 'appalled', 'appalling',
    'horrified', 'contempt', 'contemptuous', 'grossed out', 'grossed-out', 'gross',
    'revulsion', 'abhorrent', 'abhorrence', 'loathing', 'loathe', 'distaste',
    'distasteful', 'offended', 'off-putting', 'off putting', 'cringe', 'cringing'
  ],
  neutral: [
    'neutral', 'calm', 'composed', 'stoic', 'indifferent', 'detached',
    'expressionless', 'blank', 'plain', 'steady', 'measured', 'reserved', 'subtle',
    'restrained', 'serene', 'collected', 'cool-headed', 'cool headed', 'relaxed',
    'matter-of-fact', 'matter of fact', 'balanced', 'still', 'controlled'
  ]
};

const WEIGHTED_EMOTION_PHRASES = {
  happy: [
    { phrase: 'rom com lead', weight: 3 },
    { phrase: 'rom-com lead', weight: 3 },
    { phrase: 'sunny personality', weight: 3 }
  ],
  sad: [
    { phrase: 'grieving mother', weight: 5 },
    { phrase: 'grieving father', weight: 5 },
    { phrase: 'recent loss', weight: 4 },
    { phrase: 'mourning parent', weight: 4 }
  ],
  angry: [
    { phrase: 'villainous', weight: 5 },
    { phrase: 'crime lord', weight: 4 },
    { phrase: 'revenge driven', weight: 4 },
    { phrase: 'cold rage', weight: 4 }
  ],
  fear: [
    { phrase: 'final girl', weight: 4 },
    { phrase: 'panic attack', weight: 4 },
    { phrase: 'survival horror', weight: 4 }
  ],
  surprise: [
    { phrase: 'plot twist reveal', weight: 4 },
    { phrase: 'sudden revelation', weight: 4 },
    { phrase: 'caught off guard', weight: 3 }
  ],
  disgust: [
    { phrase: 'grossed out', weight: 4 },
    { phrase: 'body horror', weight: 4 },
    { phrase: 'repulsed reaction', weight: 4 }
  ],
  neutral: [
    { phrase: 'deadpan cop', weight: 5 },
    { phrase: 'deadpan detective', weight: 5 },
    { phrase: 'matter of fact cop', weight: 4 },
    { phrase: 'stoic officer', weight: 4 }
  ]
};

const NEGATION_TERMS = new Set([
  'not', 'no', 'never', 'without', 'hardly', 'barely', 'scarcely',
  'isnt', 'arent', 'wasnt', 'werent', 'dont', 'doesnt', 'didnt',
  'cant', 'couldnt', 'wont', 'wouldnt', 'shouldnt'
]);

const CONTRAST_SPLITTER = /\b(?:but|however|though|although|yet|instead|rather|except)\b/gi;
const EARLY_STAGE_MARKERS = [
  'at first',
  'initially',
  'in the beginning',
  'starts out',
  'started out',
  'early on'
];
const RECENCY_MARKERS = [
  'now',
  'currently',
  'by the end',
  'in the end',
  'eventually',
  'ultimately',
  'later'
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const countKeywordMatches = (text, keyword) => {
  const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
  let count = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (!isNegated(text, match.index)) {
      count += 1;
    }
  }

  return count;
};

const isNegated = (text, matchIndex) => {
  const lookBehind = text.slice(Math.max(0, matchIndex - 50), matchIndex);
  const sentenceBreakIndex = Math.max(
    lookBehind.lastIndexOf('.'),
    lookBehind.lastIndexOf('!'),
    lookBehind.lastIndexOf('?'),
    lookBehind.lastIndexOf(';'),
    lookBehind.lastIndexOf(':')
  );
  const scopedContext = sentenceBreakIndex >= 0
    ? lookBehind.slice(sentenceBreakIndex + 1)
    : lookBehind;

  const normalizedWords = scopedContext
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(-4)
    .map((word) => word.replace(/'/g, ''));

  return normalizedWords.some((word) => NEGATION_TERMS.has(word));
};

const buildEmotionScores = (text) => {
  const scores = {};

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    scores[emotion] = 0;

    for (const keyword of keywords) {
      scores[emotion] += countKeywordMatches(text, keyword);
    }

    const weightedPhrases = WEIGHTED_EMOTION_PHRASES[emotion] || [];
    for (const item of weightedPhrases) {
      const phraseHits = countKeywordMatches(text, item.phrase);
      scores[emotion] += phraseHits * item.weight;
    }
  }

  return scores;
};

const mergeScores = (targetScores, sourceScores, multiplier = 1) => {
  for (const [emotion, score] of Object.entries(sourceScores)) {
    targetScores[emotion] = (targetScores[emotion] || 0) + (score * multiplier);
  }
};

const hasAnyMarker = (text, markers) => markers.some((marker) => text.includes(marker));

const buildContrastAwareEmotionScores = (text) => {
  const segments = text
    .split(CONTRAST_SPLITTER)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length <= 1) {
    return buildEmotionScores(text);
  }

  const combinedScores = {};
  for (const emotion of Object.keys(EMOTION_KEYWORDS)) {
    combinedScores[emotion] = 0;
  }

  segments.forEach((segment, index) => {
    let multiplier = index === 0 ? 1 : 2;

    if (index === 0 && hasAnyMarker(segment, EARLY_STAGE_MARKERS)) {
      multiplier = 0.6;
    }

    if (index > 0 && hasAnyMarker(segment, RECENCY_MARKERS)) {
      multiplier += 0.5;
    }

    mergeScores(combinedScores, buildEmotionScores(segment), multiplier);
  });

  return combinedScores;
};

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
  
  const emotionScores = buildContrastAwareEmotionScores(text);
  
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
  const scores = buildContrastAwareEmotionScores(text);
  const foundEmotions = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .map(([emotion]) => emotion);
  
  return foundEmotions.length > 0 ? foundEmotions : ['neutral'];
};

module.exports = {
  extractEmotionFromDescription,
  extractAllEmotions
};
