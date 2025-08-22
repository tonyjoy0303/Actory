import express from 'express';
const router = express.Router();

// Example: Get all users
router.get('/users', (req, res) => {
  res.json([{ id: 1, name: 'John Doe' }]);
});

// Example: Create a new audition
router.post('/auditions', (req, res) => {
  // In a real app, you would save to DB here
  res.status(201).json({ message: 'Audition created', data: req.body });
});

// Example: Get all messages
router.get('/messages', (req, res) => {
  res.json([{ id: 1, text: 'Hello!' }]);
});

export default router;
