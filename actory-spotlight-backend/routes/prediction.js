const express = require('express');
const router = express.Router();

router.post('/predict', async (req, res) => {
  try {
    const { 
      daysUntil,
      travelTime, 
      pastNoShows, 
      isConfirmed, 
      timeOfDay, 
      isWeekend, 
      reminderSent 
    } = req.body;

    // Validate inputs
    if (typeof daysUntil !== 'number' || daysUntil < 0) {
      return res.status(400).json({ error: 'Invalid daysUntil value' });
    }
    if (typeof travelTime !== 'number' || travelTime < 0) {
      return res.status(400).json({ error: 'Invalid travelTime value' });
    }
    if (typeof pastNoShows !== 'number' || pastNoShows < 0) {
      return res.status(400).json({ error: 'Invalid pastNoShows value' });
    }
    if (!['yes', 'no'].includes(isConfirmed)) {
      return res.status(400).json({ error: 'Invalid isConfirmed value' });
    }
    if (!['morning', 'afternoon', 'evening'].includes(timeOfDay)) {
      return res.status(400).json({ error: 'Invalid timeOfDay value' });
    }
    if (typeof isWeekend !== 'boolean') {
      return res.status(400).json({ error: 'Invalid isWeekend value' });
    }
    if (typeof reminderSent !== 'boolean') {
      return res.status(400).json({ error: 'Invalid reminderSent value' });
    }
    
    // Mock prediction response
    // Check if travel is physically possible
    const hoursUntilAudition = daysUntil * 24;
    
    // If travel time is more than available time, attendance is impossible
    if (travelTime >= hoursUntilAudition) {
      return res.json({
        willAttend: false,
        confidence: 0.99,
        reason: `Travel time (${travelTime} hours) exceeds available time (${hoursUntilAudition} hours)`
      });
    }

    // Calculate attendance probability based on input factors
    const baseProb = 0.7; // Base 70% chance of attendance
    let probability = baseProb;
    
    // Adjust probability based on input factors
    if (daysUntil > 7) probability -= 0.1;
    // Travel time impact scales with how close it is to available time
    const travelTimeImpact = (travelTime / hoursUntilAudition) * 0.5;
    probability -= travelTimeImpact;
    
    if (pastNoShows > 0) probability -= 0.2 * pastNoShows;
    if (isConfirmed === 'yes') probability += 0.2;
    if (isWeekend) probability -= 0.05;
    if (reminderSent) probability += 0.1;
    if (timeOfDay === 'morning') probability -= 0.05;
    if (timeOfDay === 'evening') probability -= 0.1;
    
    // Ensure probability is between 0 and 1
    probability = Math.max(0, Math.min(1, probability));
    
    // Calculate confidence based on the distance from 0.5 (uncertainty)
    const confidence = Math.min(1, 0.6 + Math.abs(probability - 0.5));
    
    const prediction = {
      willAttend: probability >= 0.5,
      confidence
    };

    res.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'Failed to make prediction' });
  }
});

router.post('/retrain', async (req, res) => {
  try {
    // Mock retraining response
    const accuracy = Math.random() * 0.1 + 0.85; // Random accuracy between 85% and 95%
    res.json({ success: true, accuracy });
  } catch (error) {
    console.error('Retraining error:', error);
    res.status(500).json({ error: 'Failed to retrain model' });
  }
});

module.exports = router;