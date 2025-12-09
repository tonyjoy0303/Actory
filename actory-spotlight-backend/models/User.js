const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Video schema that will be embedded in the User model
const VideoSchema = new mongoose.Schema({
  title: {
    type: String,
    maxlength: [100, 'Title cannot be more than 100 characters'],
    default: undefined
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    enum: ['Monologue', 'Dance', 'Demo Reel', 'Other'],
    default: 'Other'
  },
  url: {
    type: String,
    required: [true, 'Video URL is required']
  },
  thumbnailUrl: {
    type: String,
    required: [true, 'Thumbnail URL is required']
  },
  duration: {
    type: Number,
    required: [true, 'Video duration is required']
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Ensure sensible defaults for missing title/category when uploading profile videos
VideoSchema.pre('validate', function(next) {
  if (!this.title || !this.title.trim()) {
    if (this.description && this.description.trim()) {
      this.title = this.description.trim().slice(0, 80);
    } else {
      this.title = 'Profile Video';
    }
  }
  if (!this.category) {
    this.category = 'Other';
  }
  next();
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name must be at most 50 characters'],
    validate: {
      validator: function(v) {
        return /\S/.test(v);
      },
      message: 'Name cannot be blank'
    }
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
      'Please add a valid email',
    ],
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: String,
  emailVerificationOTPExpire: Date,
  phone: {
    type: String,
    required: false, // Will be conditionally required below using custom validator
    validate: {
      validator: function(v) {
        if (!v) return true; // optional unless role mandates
        // Accepts international formats with + and spaces/dashes
        return /^\+?[0-9\-\s]{7,15}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  role: {
    type: String,
    enum: ['Actor', 'Producer', 'Admin'],
    default: 'Actor',
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false, // Do not return password by default
  },
  // Common optional fields
  photo: { type: String, default: '' },
  location: { type: String },

  // Actor-specific
  age: { type: Number, min: 1, max: 120 },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
  experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'experienced', 'professional'] },
  bio: { type: String, maxlength: 500 },
  profileImage: { type: String },
  videos: [VideoSchema], // Add videos array to store actor's videos
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Producer-specific
  companyName: { type: String },
  website: { type: String },

  // Verification status
  isVerified: { type: Boolean, default: false },

  resetPasswordToken: String,
  resetPasswordExpire: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Conditional required validations by role
UserSchema.path('phone').validate(function(value) {
  if (this.role === 'Actor' || this.role === 'Producer') {
    return !!value; // required for both actor and producer
  }
  return true;
}, 'Phone number is required');

UserSchema.path('location').validate(function(value) {
  if (this.role === 'Actor' || this.role === 'Producer') {
    return !!value; // required for both actor and producer
  }
  return true;
}, 'Location is required');

UserSchema.path('companyName').validate(function(value) {
  if (this.role === 'Producer') {
    return !!value;
  }
  return true;
}, 'Company name is required');

UserSchema.path('age').validate(function(value) {
  if (this.role === 'Actor') {
    return typeof value === 'number' && value >= 1 && value <= 120;
  }
  return true;
}, 'Age is required and must be between 1 and 120');

UserSchema.path('gender').validate(function(value) {
  if (this.role === 'Actor') {
    return !!value;
  }
  return true;
}, 'Gender is required');

UserSchema.path('experienceLevel').validate(function(value) {
  if (this.role === 'Actor') {
    return !!value;
  }
  return true;
}, 'Experience level is required');

// Add instance method to add a video to user's profile
UserSchema.methods.addVideo = async function(videoData) {
  try {
    this.videos.push(videoData);
    await this.save();
    return this.videos[this.videos.length - 1];
  } catch (error) {
    throw new Error(`Failed to add video: ${error.message}`);
  }
};

// Add instance method to remove a video
UserSchema.methods.removeVideo = async function(videoId) {
  try {
    const videoIndex = this.videos.findIndex(v => v._id.toString() === videoId);
    if (videoIndex === -1) {
      throw new Error('Video not found');
    }
    this.videos.splice(videoIndex, 1);
    await this.save();
    return true;
  } catch (error) {
    throw new Error(`Failed to remove video: ${error.message}`);
  }
};

// Add instance method to increment video views
UserSchema.methods.incrementVideoViews = async function(videoId) {
  try {
    const video = this.videos.id(videoId);
    if (!video) {
      throw new Error('Video not found');
    }
    video.views += 1;
    await this.save();
    return video.views;
  } catch (error) {
    throw new Error(`Failed to increment video views: ${error.message}`);
  }
};

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);