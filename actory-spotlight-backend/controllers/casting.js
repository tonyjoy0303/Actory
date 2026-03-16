const CastingCall = require('../models/CastingCall');
const FilmProject = require('../models/FilmProject');
const User = require('../models/User');
const ProductionTeam = require('../models/ProductionTeam');
const { extractEmotionFromDescription } = require('../utils/emotionExtractor');

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

    // Exclude castings whose project is archived
    const archivedProjectIds = await FilmProject.find({ status: 'archived' }).distinct('_id');
    if (archivedProjectIds.length > 0) {
      query.$and.push({ $or: [
        { project: { $exists: false } },
        { project: { $nin: archivedProjectIds } }
      ]});
    }
    
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
      .populate('project', 'name description')
      .sort({ submissionDeadline: 1 }); // Sort by submission deadline
      
    res.status(200).json({ success: true, count: castingCalls.length, data: castingCalls });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get team casting calls (for team members to see all castings in their team's projects)
// @route   GET /api/v1/casting/team/:teamId
// @access  Private (Team members only)
exports.getTeamCastingCalls = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    
    // Verify user is team member
    const team = await ProductionTeam.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    const isTeamMember = String(team.owner) === String(req.user._id) || 
      team.members.some(m => String(m.user) === String(req.user._id));
    
    if (!isTeamMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this team\'s castings' });
    }

    // Find all castings for projects in this team
    const castingCalls = await CastingCall.find({ team: teamId })
      .populate('producer', 'name email')
      .populate('project', 'name description')
      .sort({ createdAt: -1 });
      
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

// @desc    Get all producer casting calls (including past ones) + team castings
// @route   GET /api/v1/casting/producer
// @access  Private (Producer, ProductionTeam)
exports.getProducerCastingCalls = async (req, res, next) => {
  try {
    // Find all teams where the user is owner or member
    const teams = await ProductionTeam.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    }).select('_id');
    
    const teamIds = teams.map(team => team._id);
    
    // Find casting calls where:
    // 1. User is the producer (their own castings)
    // 2. Casting belongs to any team the user is part of
    const query = {
      $or: [
        { producer: req.user._id },
        { team: { $in: teamIds } }
      ]
    };
    
    const castingCalls = await CastingCall.find(query)
      .populate('producer', 'name email')
      .populate('project', 'name description')
      .populate('team', 'name')
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
    // 🤖 Extract required emotion from description
    const requiredEmotion = extractEmotionFromDescription(description);

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
      producer: req.user._id,
      // Include project and team if provided (for role-based castings)
      project: req.body.project || req.body.projectId,
      team: req.body.team || req.body.teamId,
      projectRole: req.body.projectRole || req.body.roleId,
      // 🤖 AI: Extracted emotion
      requiredEmotion,
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
    if (castingCall.producer.toString() !== String(req.user._id)) {
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

    // Authorization rules:
    // - Single casting (no project): only casting owner can delete.
    // - Project casting: any member/owner of the linked team can delete.
    let canDelete = false;

    if (castingCall.project) {
      const project = await FilmProject.findById(castingCall.project).select('team');
      const teamId = project?.team || castingCall.team;

      if (teamId) {
        const team = await ProductionTeam.findById(teamId).select('owner members.user');
        if (team) {
          const requesterId = String(req.user._id);
          const isTeamOwner = String(team.owner) === requesterId;
          const isTeamMember = (team.members || []).some(
            (member) => String(member.user) === requesterId
          );
          canDelete = isTeamOwner || isTeamMember;
        }
      }
    } else {
      canDelete = castingCall.producer.toString() === String(req.user._id);
    }

    if (!canDelete) {
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