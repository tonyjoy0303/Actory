const Video = require('../models/Video');
const CastingCall = require('../models/CastingCall');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Get all videos for a casting call
// @route   GET /api/v1/casting/:castingCallId/videos
// @access  Private (Producer of the call only)
exports.getVideos = async (req, res, next) => {
  try {
    const castingCall = await CastingCall.findById(req.params.castingCallId);

    if (!castingCall) {
      return res.status(404).json({ success: false, message: 'Casting call not found' });
    }

    // Make sure user is the owner of the casting call
    if (castingCall.producer.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to view these submissions' });
    }

    const videos = await Video.find({ castingCall: req.params.castingCallId }).populate('actor', 'name email');
    res.status(200).json({ success: true, count: videos.length, data: videos });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Add a video submission
// @route   POST /api/v1/casting/:castingCallId/videos
// @access  Private (Actor only)
exports.addVideo = async (req, res, next) => {
  try {
    req.body.castingCall = req.params.castingCallId;
    req.body.actor = req.user.id;

    const castingCall = await CastingCall.findById(req.params.castingCallId);

    if (!castingCall) {
      return res.status(404).json({ success: false, message: 'Casting call not found' });
    }

    const video = await Video.create(req.body);
    res.status(201).json({ success: true, data: video });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get current actor's submissions
// @route   GET /api/v1/videos/mine
// @access  Private (Actor)
exports.getMyVideos = async (req, res, next) => {
  try {
    const videos = await Video.find({ actor: req.user.id })
      .sort({ createdAt: -1 })
      .populate('castingCall', 'roleTitle roleName');
    res.status(200).json({ success: true, count: videos.length, data: videos });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get current actor's profile videos
// @route   GET /api/v1/videos/profile
// @access  Private (Actor)
exports.getMyProfileVideos = async (req, res, next) => {
  try {
    console.log('Getting profile videos for user:', req.user.id);
    
    // First, check if there are any videos for this user at all
    const allUserVideos = await Video.find({ actor: req.user.id }).lean();
    console.log('All videos for user:', {
      count: allUserVideos.length,
      videos: allUserVideos.map(v => ({
        _id: v._id,
        title: v.title,
        type: v.type,
        videoUrl: v.videoUrl ? 'URL present' : 'No URL'
      }))
    });
    
    // Now get just the profile videos from the Video collection
    const videoDocs = await Video.find({ 
      actor: req.user.id,
      type: 'profile' // Only get profile videos
    })
    .sort({ createdAt: -1 })
    .lean();

    // Also load embedded profile videos from the User document
    const user = await User.findById(req.user.id).lean();
    const embedded = (user && Array.isArray(user.videos)) ? user.videos.map(v => ({
      _id: v._id,
      title: v.title,
      description: v.description,
      videoUrl: v.url, // map to common field
      thumbnailUrl: v.thumbnailUrl,
      duration: v.duration,
      views: v.views,
      uploadedAt: v.uploadedAt,
      category: v.category,
      type: 'profile',
      actor: req.user.id
    })) : [];

    // Merge both sources and de-duplicate by videoUrl + title
    const mergedMap = new Map();
    [...videoDocs, ...embedded].forEach(v => {
      const key = `${v.videoUrl || ''}::${v.title || ''}`;
      if (!mergedMap.has(key)) mergedMap.set(key, v);
    });
    const videos = Array.from(mergedMap.values());
    
    console.log('Profile videos query:', {
      query: { actor: req.user.id, type: 'profile' },
      counts: { videoDocs: videoDocs.length, embedded: embedded.length, merged: videos.length },
      sample: videos.slice(0, 2).map(v => ({
        _id: v._id,
        title: v.title,
        videoUrl: v.videoUrl ? 'URL present' : 'No URL',
        type: v.type,
        createdAt: v.createdAt || v.uploadedAt
      }))
    });
    
    // Transform videos to include all required fields for the frontend
    const transformedVideos = videos.map(video => ({
      ...video,
      _id: (video._id && video._id.toString) ? video._id.toString() : String(video._id || ''),
      thumbnailUrl: video.thumbnailUrl || (video.videoUrl ? 
        video.videoUrl.replace(/\.(mp4|mov|avi|wmv|flv|webm)$/i, '.jpg') : 
        'https://via.placeholder.com/300x169?text=No+Thumbnail'),
      views: video.views || 0,
      duration: video.duration || 0,
      uploadedAt: video.uploadedAt || video.createdAt || new Date(),
      category: video.category || 'Profile Video'
    }));
    
    console.log('Returning profile videos:', {
      count: transformedVideos.length,
      firstVideo: transformedVideos[0] || 'No videos found'
    });
    
    res.status(200).json({ 
      success: true, 
      count: transformedVideos.length, 
      data: transformedVideos 
    });
  } catch (err) {
    console.error('Error in getMyProfileVideos:', {
      error: err.message,
      stack: err.stack,
      user: req.user ? req.user.id : 'No user in request'
    });
    res.status(400).json({ 
      success: false, 
      message: err.message || 'Error fetching profile videos' 
    });
  }
};

// @desc    Update submission status (Accept/Reject)
// @route   PATCH /api/v1/videos/:id/status
// @access  Private (Producer owner of the casting call)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'Accepted' | 'Rejected' | 'Pending'
    if (!['Accepted', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const video = await Video.findById(req.params.id).populate('castingCall', 'producer');
    if (!video) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Ensure current user is the producer who owns the casting call
    if (video.castingCall.producer.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this submission' });
    }

    video.status = status;
    await video.save();

    res.status(200).json({ success: true, data: video });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete a video
// @route   DELETE /api/v1/videos/:id
// @access  Private (Owner of video only, or Admin)
exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Make sure user is the video owner or an admin
    if (video.actor.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this video' });
    }

    // Delete from cloudinary if exists
    if (video.cloudinaryId) {
      await cloudinary.uploader.destroy(video.cloudinaryId, { resource_type: 'video' });
    }

    await video.remove();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Upload a profile video
// @route   POST /api/v1/profile/videos
// @access  Private (Actor)
exports.uploadProfileVideo = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a video file'
      });
    }

    const videoFile = req.files.video;
    
    // Upload to Cloudinary (or your preferred storage)
    const result = await cloudinary.uploader.upload(videoFile.tempFilePath, {
      resource_type: 'video',
      folder: 'profile-videos',
    });

    // Create video in database
    const video = await Video.create({
      title: req.body.description?.slice(0, 80) || 'Profile Video',
      description: req.body.description || '',
      videoUrl: result.secure_url,
      cloudinaryId: result.public_id,
      actor: req.user.id,
      type: 'profile', // Mark as profile video
      // No castingCall or category for profile videos
    });

    res.status(201).json({
      success: true,
      data: video
    });
  } catch (err) {
    console.error('Error uploading profile video:', err);
    res.status(500).json({
      success: false,
      message: 'Error uploading video. Please try again.'
    });
  }
};

// @desc    Delete a profile video
// @route   DELETE /api/v1/videos/profile/videos/:id
// @access  Private (Actor)
exports.deleteProfileVideo = async (req, res, next) => {
  try {
    const videoId = req.params.id;

    // First, try to find and delete from Video collection
    let video;
    if (req.user.role === 'Admin') {
      // Admin can delete any profile video
      video = await Video.findOne({ _id: videoId, type: 'profile' });
    } else {
      // Actor can only delete their own videos
      video = await Video.findOne({ _id: videoId, actor: req.user.id, type: 'profile' });
    }

    if (video) {
      // Delete from cloudinary if exists
      if (video.cloudinaryId) {
        await cloudinary.uploader.destroy(video.cloudinaryId, { resource_type: 'video' });
      }
      await video.remove();
      return res.status(200).json({ success: true, data: {} });
    }

    // If not in Video collection, try to remove from embedded videos in User
    let user;
    if (req.user.role === 'Admin') {
      // Find the user who owns the embedded video
      user = await User.findOne({ 'videos._id': videoId });
    } else {
      // Actor can only access their own profile
      user = await User.findById(req.user.id);
    }

    if (user) {
      const videoIndex = user.videos.findIndex(v => v._id.toString() === videoId);
      if (videoIndex !== -1) {
        const video = user.videos[videoIndex];
        // Delete from cloudinary for embedded videos
        if (video.url) {
          const publicId = video.url.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`actory/videos/${user._id}/${publicId}`, { resource_type: 'video' });
        }
        user.videos.splice(videoIndex, 1);
        await user.save();
        return res.status(200).json({ success: true, data: {} });
      }
    }

    // If not found in either
    return res.status(404).json({ success: false, message: 'Profile video not found' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
