const express = require('express');
const { register, login, updatePassword, getMe } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/updatepassword', protect, updatePassword);
router.get('/me', protect, getMe);

module.exports = router;