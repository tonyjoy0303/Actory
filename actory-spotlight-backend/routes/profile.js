const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const admin = require('../middleware/admin');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// @route   POST /api/profile/videos
// @desc    Upload a video to user's profile
// @access  Private (Actor only)
router.post('/videos', protect, upload.single('video'), async (req, res) => {
  try {
    // Check if user is an actor
    if (req.user.role !== 'Actor') {
      return res.status(403).json({ message: 'Only actors can upload videos' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const { title, description, category } = req.body;

    // Upload video to Cloudinary
    const videoResult = await new Promise((resolve) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: `actory/videos/${req.user._id}`,
          public_id: `${uuidv4()}-${Date.now()}`,
          eager: [
            { width: 300, height: 300, crop: 'thumb', format: 'jpg' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({ message: 'Error uploading video' });
          }
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    // Create video data object
    const videoData = {
      title,
      description,
      category: category || 'Other',
      url: videoResult.secure_url,
      thumbnailUrl: videoResult.eager[0].secure_url,
      duration: Math.ceil(videoResult.duration || 0)
    };

    // Add video to user's profile
    const user = await User.findById(req.user._id);
    const video = await user.addVideo(videoData);

    res.status(201).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -resetPasswordToken -resetPasswordExpire -__v')
      .populate({
        path: 'videos',
        select: 'title description category url thumbnailUrl duration views uploadedAt isActive',
        options: { sort: { uploadedAt: -1 } }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get submission count from Video model
    const Video = require('../models/Video');
    const submissionCount = await Video.countDocuments({
      actor: req.user._id,
      type: 'audition'
    });

    // Calculate stats
    const publicVideos = user.videos.filter(video => video.isActive);
    const stats = {
      videoCount: publicVideos.length,
      totalViews: publicVideos.reduce((sum, video) => sum + (video.views || 0), 0),
      followerCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      submissionCount
    };

    // Create profile response object
    const profile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      bio: user.bio,
      location: user.location,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      age: user.dateOfBirth ? 
        new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear() : null,
      experienceLevel: user.experienceLevel,
      skills: user.skills || [],
      socialLinks: user.socialLinks || {},
      isVerified: user.isVerified,
      role: user.role,
      joinedAt: user.createdAt,
      videos: user.videos,
      stats
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/profile/search
// @desc    Search users by username
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ message: 'Username query parameter is required' });
    }

    const users = await User.find({
      name: { $regex: username, $options: 'i' },
      role: { $in: ['Actor', 'Producer'] }
    }).select('_id name role profileImage isVerified');

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/profile/:id
// @desc    Get public profile by user ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire -__v')
      .populate({
        path: 'videos',
        match: { isActive: true },
        select: 'title description category url thumbnailUrl duration views uploadedAt',
        options: { sort: { uploadedAt: -1 } }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get submission count from Video model
    const Video = require('../models/Video');
    const submissionCount = await Video.countDocuments({
      actor: req.params.id,
      type: 'audition'
    });

    // Only show active videos for public profiles
    const publicVideos = user.videos.filter(video => video.isActive);

    // Calculate stats
    const stats = {
      videoCount: publicVideos.length,
      totalViews: publicVideos.reduce((sum, video) => sum + (video.views || 0), 0),
      followerCount: user.followers ? user.followers.length : 0,
      submissionCount
    };

    // Create public profile object
    const publicProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      bio: user.bio,
      location: user.location,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      age: user.dateOfBirth ?
        new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear() : null,
      experienceLevel: user.experienceLevel,
      skills: user.skills || [],
      socialLinks: user.socialLinks || {},
      isVerified: user.isVerified,
      role: user.role,
      joinedAt: user.createdAt,
      videos: publicVideos,
      videoCount: stats.videoCount,
      followerCount: stats.followerCount,
      viewCount: stats.totalViews,
      submissionCount,
      stats
    };

    res.json(publicProfile);
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/profile/videos/:videoId/view
// @desc    Increment video view count
// @access  Public
router.put('/videos/:videoId/view', async (req, res) => {
  try {
    const user = await User.findOne({ 'videos._id': req.params.videoId });
    
    if (!user) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const views = await user.incrementVideoViews(req.params.videoId);
    
    res.json({ success: true, views });
  } catch (error) {
    console.error('Error incrementing video views:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/profile/videos/:videoId
// @desc    Delete a video (Admin only)
// @access  Private (Admin only)
router.delete('/videos/:videoId', protect, admin, async (req, res) => {
  try {
    const user = await User.findOne({ 'videos._id': req.params.videoId });

    if (!user) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Only allow admins or the video owner to delete
    if (user._id.toString() !== req.user._id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete this video' });
    }

    const video = user.videos.id(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Delete from Cloudinary
    const publicId = video.url.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`actory/videos/${user._id}/${publicId}`, {
      resource_type: 'video'
    });

    // Remove from user's videos array
    await user.removeVideo(req.params.videoId);

    res.json({ success: true, message: 'Video removed successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/profile/me
// @desc    Update current user's profile
// @access  Private (only owner)
router.put('/me', protect, async (req, res) => {
  try {
    const allowedFields = ['bio', 'location', 'socialLinks', 'skills', 'experienceLevel'];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .select('-password -resetPasswordToken -resetPasswordExpire -__v');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/profile/:id/follow
// @desc    Follow a user
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    // Check if already following
    if (userToFollow.followers.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Add to followers
    userToFollow.followers.push(req.user._id);
    await userToFollow.save();

    // Add to following
    const currentUser = await User.findById(req.user._id);
    currentUser.following.push(req.params.id);
    await currentUser.save();

    res.json({ success: true, message: 'Followed successfully' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/profile/:id/unfollow
// @desc    Unfollow a user
// @access  Private
router.delete('/:id/unfollow', protect, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from followers
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== req.user._id.toString());
    await userToUnfollow.save();

    // Remove from following
    const currentUser = await User.findById(req.user._id);
    currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
    await currentUser.save();

    res.json({ success: true, message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
