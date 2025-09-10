const express = require('express');
const { register, login, updatePassword, getMe, googleLogin, updateMe, uploadPhoto } = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure uploads directory
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeExt = ext && ext.length <= 8 ? ext : '.jpg';
    cb(null, `photo_${req.user.id}_${Date.now()}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

router.post('/register', register);
router.post('/login', login);
router.put('/updatepassword', protect, updatePassword);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/me/photo', protect, upload.single('photo'), uploadPhoto);
router.post('/google', googleLogin);

module.exports = router;