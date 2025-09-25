const CastingCall = require('../models/CastingCall');
const User = require('../models/User');

// @desc    Get all casting calls
// @route   GET /api/v1/casting
// @access  Public
exports.getCastingCalls = async (req, res, next) => {
  try {
    const now = new Date();
    const query = {
      $and: [
        { auditionDate: { $gte: now } },
        { submissionDeadline: { $gte: now } }
      ]
    };
    
    // Filter by producer if provided (for producer dashboard)
    if (req.query.producer) {
      query.producer = req.query.producer;
    }
    
    // Filter by experience level if provided
    if (req.query.experienceLevel) {
      query.experienceLevel = req.query.experienceLevel;
    }
    
    // Filter by gender requirement if provided
    if (req.query.genderRequirement) {
      query.genderRequirement = req.query.genderRequirement;
    }
    
    // Filter by location if provided
    if (req.query.location) {
      query.location = { $regex: req.query.location, $options: 'i' };
    }

    const castingCalls = await CastingCall.find(query)
      .populate('producer', 'name email')
      .sort({ submissionDeadline: 1 }); // Sort by submission deadline
      
    res.status(200).json({ success: true, count: castingCalls.length, data: castingCalls });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get all producer casting calls (including past ones)
// @route   GET /api/v1/casting/producer
// @access  Private (Producer only)
exports.getProducerCastingCalls = async (req, res, next) => {
  try {
    // Find all casting calls for the logged-in producer
    const castingCalls = await CastingCall.find({ producer: req.user.id })
      .populate('producer', 'name email')
      .sort({ createdAt: -1 }); // Sort by creation date, newest first
      
    res.status(200).json({ 
      success: true, 
      count: castingCalls.length, 
      data: castingCalls 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + err.message 
    });
  }
};

exports.getCastingCall = async (req, res, next) => {
  try {
    console.log('getCastingCall called with ID:', req.params.id);
    
    // First try to find the casting call without any date filtering
    const castingCall = await CastingCall.findById(req.params.id).populate('producer', 'name email');
    
    console.log('Database query result:', castingCall ? 'Found' : 'Not found');
    
    if (!castingCall) {
      return res.status(404).json({ 
        success: false, 
        message: 'Casting call not found in database' 
      });
    }
    
    // For now, skip the date checks completely for debugging
    console.log('Returning casting call:', {
      id: castingCall._id,
      title: castingCall.roleTitle
    });
    
    return res.status(200).json({ 
      success: true, 
      data: castingCall 
    });

  } catch (err) {
    console.error('Error in getCastingCall:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + err.message 
    });
  }
};

// @desc    Create new casting call
// @route   POST /api/v1/casting
// @access  Private (Producer only)
exports.createCastingCall = async (req, res, next) => {
  try {
    // Extract and validate required fields
    const {
      roleTitle,
      description,
      ageRange,
      genderRequirement,
      experienceLevel,
      location,
      numberOfOpenings,
      skills,
      auditionDate,
      submissionDeadline,
      shootStartDate,
      shootEndDate
    } = req.body;

    // Basic validation (Mongoose schema handles most, but we add some custom validation)
    if (!roleTitle || !description || !ageRange || !genderRequirement || 
        !experienceLevel || !location || !numberOfOpenings || !skills || 
        !auditionDate || !submissionDeadline || !shootStartDate || !shootEndDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    // Create the casting call
    const castingCall = await CastingCall.create({
      roleTitle,
      description,
      ageRange: {
        min: parseInt(ageRange.min),
        max: parseInt(ageRange.max)
      },
      genderRequirement,
      experienceLevel,
      location,
      numberOfOpenings: parseInt(numberOfOpenings),
      skills: Array.isArray(skills) ? skills : [skills],
      auditionDate: new Date(auditionDate),
      submissionDeadline: new Date(submissionDeadline),
      shootStartDate: new Date(shootStartDate),
      shootEndDate: new Date(shootEndDate),
      producer: req.user.id
    });

    res.status(201).json({ success: true, data: castingCall });
  } catch (err) {
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    res.status(500).json({ success: false, message: err.message });
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
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to update this casting call' 
      });
    }

    // Prevent updating certain fields if submission deadline has passed
    const now = new Date();
    if (castingCall.submissionDeadline < now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update casting call after submission deadline has passed'
      });
    }

    // Prepare update data
    const updateData = { ...req.body };
    
    // Convert date strings to Date objects
    if (updateData.auditionDate) updateData.auditionDate = new Date(updateData.auditionDate);
    if (updateData.submissionDeadline) updateData.submissionDeadline = new Date(updateData.submissionDeadline);
    if (updateData.shootStartDate) updateData.shootStartDate = new Date(updateData.shootStartDate);
    if (updateData.shootEndDate) updateData.shootEndDate = new Date(updateData.shootEndDate);
    
    // Convert ageRange strings to numbers if provided
    if (updateData.ageRange) {
      if (updateData.ageRange.min) updateData.ageRange.min = parseInt(updateData.ageRange.min);
      if (updateData.ageRange.max) updateData.ageRange.max = parseInt(updateData.ageRange.max);
    }
    
    // Convert skills to array if it's a string
    if (updateData.skills && !Array.isArray(updateData.skills)) {
      updateData.skills = [updateData.skills];
    }
    
    // Convert numberOfOpenings to number
    if (updateData.numberOfOpenings) {
      updateData.numberOfOpenings = parseInt(updateData.numberOfOpenings);
    }

    // Update the casting call
    castingCall = await CastingCall.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({ success: true, data: castingCall });
  } catch (err) {
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    res.status(500).json({ success: false, message: err.message });
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
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to delete this casting call' 
      });
    }

    // Prevent deletion if submission deadline has passed
    if (castingCall.submissionDeadline < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete casting call after submission deadline has passed'
      });
    }

    await CastingCall.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};