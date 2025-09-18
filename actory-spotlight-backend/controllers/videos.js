const Video = require('../models/Video');
const CastingCall = require('../models/CastingCall');

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
// @access  Private (Owner of video only)
exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Make sure user is the video owner
    if (video.actor.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this video' });
    }

    // Here you would also add logic to delete the video from Cloudinary
    
    await video.remove();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};