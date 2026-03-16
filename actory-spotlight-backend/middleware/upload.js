const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use a temporary directory for uploads
    cb(null, 'uploads/tmp/');
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const prefix = file.mimetype && file.mimetype.startsWith('image/') ? 'image' : 'media';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

// File filter to only allow image and video files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.mp4', '.mov', '.avi', '.wmv', '.webm', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  }
});

// Create upload directory if it doesn't exist
const fs = require('fs');
const uploadDir = 'uploads/tmp';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

module.exports = upload;
