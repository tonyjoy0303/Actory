const CastingCall = require('../models/CastingCall');
const User = require('../models/User');

// @desc    Get all casting calls
// @route   GET /api/v1/casting
// @access  Public
exports.getCastingCalls = async (req, res, next) => {
  try {
    const now = new Date();
    const castingCalls = await CastingCall.find({ auditionDate: { $gte: now } }).populate('producer', 'name email');
    res.status(200).json({ success: true, count: castingCalls.length, data: castingCalls });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get single casting call
// @route   GET /api/v1/casting/:id
// @access  Public
exports.getCastingCall = async (req, res, next) => {
  try {
    const castingCall = await CastingCall.findById(req.params.id).populate('producer', 'name email');
    if (!castingCall) {
      return res.status(404).json({ success: false, message: 'Casting call not found' });
    }
    // If expired, treat as not found for public consumers
    if (castingCall.auditionDate && castingCall.auditionDate < new Date()) {
      return res.status(404).json({ success: false, message: 'Casting call not found' });
    }
    res.status(200).json({ success: true, data: castingCall });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Create new casting call
// @route   POST /api/v1/casting
// @access  Private (Producer only)
exports.createCastingCall = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.producer = req.user.id;

    const castingCall = await CastingCall.create(req.body);
    res.status(201).json({ success: true, data: castingCall });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update casting call
// @route   PUT /api/v1/casting/:id
// @access  Private (Producer only)
exports.updateCastingCall = async (req, res, next) => {
  try {
    let castingCall = await CastingCall.findById(req.params.id);

    if (!castingCall) {
      return res.status(404).json({ success: false, message: 'Casting call not found' });
    }

    // Make sure user is casting call owner
    if (castingCall.producer.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this casting call' });
    }

    castingCall = await CastingCall.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: castingCall });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete casting call
// @route   DELETE /api/v1/casting/:id
// @access  Private (Producer only)
exports.deleteCastingCall = async (req, res, next) => {
  try {
    const castingCall = await CastingCall.findById(req.params.id);

    if (!castingCall) {
      return res.status(404).json({ success: false, message: 'Casting call not found' });
    }

    // Make sure user is casting call owner
    if (castingCall.producer.toString() !== req.user.id) {
        return res.status(401).json({ success: false, message: 'Not authorized to delete this casting call' });
    }

    await castingCall.remove();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};