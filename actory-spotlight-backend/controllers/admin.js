const RoleSwitchRequest = require('../models/RoleSwitchRequest');
const User = require('../models/User');
const CastingCall = require('../models/CastingCall');
const Video = require('../models/Video');

// @desc    Get all role switch requests
// @route   GET /api/v1/admin/switch-requests
// @access  Private (Admin)
exports.getSwitchRequests = async (req, res, next) => {
  try {
    const requests = await RoleSwitchRequest.find().populate('actorId', 'name email');
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Approve a role switch request
// @route   PUT /api/v1/admin/switch-requests/:id/approve
// @access  Private (Admin)
exports.approveSwitchRequest = async (req, res, next) => {
  try {
    const request = await RoleSwitchRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'Pending') {
        return res.status(400).json({ success: false, message: `Request has already been ${request.status.toLowerCase()}` });
    }

    // Update user role
    await User.findByIdAndUpdate(request.actorId, { role: 'Producer' });

    // Update request status
    request.status = 'Approved';
    request.reviewedBy = req.user.id;
    request.reviewedAt = Date.now();
    await request.save();

    res.status(200).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Reject a role switch request
// @route   PUT /api/v1/admin/switch-requests/:id/reject
// @access  Private (Admin)
exports.rejectSwitchRequest = async (req, res, next) => {
  try {
    const request = await RoleSwitchRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

     if (request.status !== 'Pending') {
        return res.status(400).json({ success: false, message: `Request has already been ${request.status.toLowerCase()}` });
    }

    // Update request status
    request.status = 'Rejected';
    request.reviewedBy = req.user.id;
    request.reviewedAt = Date.now();
    await request.save();

    res.status(200).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update user details
// @route   PUT /api/v1/admin/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all casting calls
// @route   GET /api/v1/admin/castingcalls
// @access  Private (Admin)
exports.getCastingCalls = async (req, res, next) => {
    try {
        const castingCalls = await CastingCall.find().populate('producer', 'name email');
        res.status(200).json({ success: true, count: castingCalls.length, data: castingCalls });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update a casting call
// @route   PUT /api/v1/admin/castingcalls/:id
// @access  Private (Admin)
exports.updateCastingCall = async (req, res, next) => {
    try {
        let castingCall = await CastingCall.findById(req.params.id);

        if (!castingCall) {
            return res.status(404).json({ success: false, message: 'Casting call not found' });
        }

        castingCall = await CastingCall.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: castingCall });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a casting call
// @route   DELETE /api/v1/admin/castingcalls/:id
// @access  Private (Admin)
exports.deleteCastingCall = async (req, res, next) => {
    try {
        const castingCall = await CastingCall.findById(req.params.id);

        if (!castingCall) {
            return res.status(404).json({ success: false, message: 'Casting call not found' });
        }

        await castingCall.remove();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all videos
// @route   GET /api/v1/admin/videos
// @access  Private (Admin)
exports.getVideos = async (req, res, next) => {
    try {
        const videos = await Video.find()
          .populate('actor', 'name email')
          .populate('castingCall', 'roleName');
        res.status(200).json({ success: true, count: videos.length, data: videos });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update a video
// @route   PUT /api/v1/admin/videos/:id
// @access  Private (Admin)
exports.updateVideo = async (req, res, next) => {
    try {
        let video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        video = await Video.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: video });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a video
// @route   DELETE /api/v1/admin/videos/:id
// @access  Private (Admin)
exports.deleteVideo = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        await video.remove();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};