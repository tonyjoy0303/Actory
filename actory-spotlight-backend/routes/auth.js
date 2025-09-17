const express = require('express');
const { 
  register, 
  login, 
  updatePassword, 
  getMe, 
  googleLogin, 
  updateMe, 
  uploadPhoto,
  checkEmail,
  forgotPassword,
  resetPassword,
  checkResetToken
} = require('../controllers/auth');
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
  fileFilter: function (req, file, cb) {
    const filetypes = /jpe?g|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/check-email', checkEmail);
router.post('/forgotpassword', forgotPassword);
router.get('/check-reset-token/:resettoken', checkResetToken);
router.put('/resetpassword/:resettoken', resetPassword);

// Protected routes (require authentication)
router.use(protect);
router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/updatepassword', updatePassword);
router.put('/me/photo', upload.single('photo'), uploadPhoto);

module.exports = router;