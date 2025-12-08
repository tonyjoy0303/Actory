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
  checkResetToken,
  verifyEmail,
  resendVerificationEmail
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer storage configuration - using memory storage for Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB (increased for better quality)
  fileFilter: function (req, file, cb) {
    const filetypes = /jpe?g|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg, .jpeg and .webp format allowed!'));
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
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Protected routes (require authentication)
router.use(protect);
router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/updatepassword', updatePassword);
router.put('/me/photo', upload.single('photo'), uploadPhoto);

module.exports = router;