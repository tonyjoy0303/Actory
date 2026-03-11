const Video = require('../models/Video');
const CastingCall = require('../models/CastingCall');
const User = require('../models/User');
const Comment = require('../models/Comment');
const ProductionHouse = require('../models/ProductionHouse');
const ProductionTeam = require('../models/ProductionTeam');
const FilmProject = require('../models/FilmProject');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { createNotification } = require('../utils/notificationService');
const { safeAnalyzeVideo, validateVideoFile } = require('../utils/aiServiceClient');

// Helper: authorize casting call access.
// allowWrite=false → any team member (or producer) can read.
// allowWrite=true  → only producer, owner, or members whose role is not 'Viewer'.
async function isAuthorizedForCasting(castingCall, userId, { allowWrite = false } = {}) {
  const requesterId = String(userId);

  // Producer always allowed
  if (castingCall.producer && castingCall.producer.toString() === requesterId) {
    return true;
  }

  // If no team, only producer could authorize
  if (!castingCall.team) {
    return false;
  }

  const team = await ProductionTeam.findById(castingCall.team);
  if (!team) {
    return false;
  }

  const isOwner = team.owner && team.owner.toString() === requesterId;
  const member = team.members.find(m => m.user && m.user.toString() === requesterId);
  const hasTeamAccess = isOwner || Boolean(member);

  if (!hasTeamAccess) {
    return false;
  }

  // Read access: any team member (including owner)
  if (!allowWrite) {
    return true;
  }

  // Write access: owner, or member whose role is not 'Viewer'
  const role = isOwner ? 'Owner' : member?.role;
  return role && role !== 'Viewer';
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Get all videos for a casting call
// @route   GET /api/v1/casting/:castingCallId/videos
// @access  Private (Producer or Team Members)
exports.getVideos = async (req, res, next) => {
  try {
    const castingCall = await CastingCall.findById(req.params.castingCallId);

    if (!castingCall) {
      return res.status(404).json({ success: false, message: 'Casting call not found' });
    }

    // Check if user is authorized (producer or team member)
    const authorized = await isAuthorizedForCasting(castingCall, req.user._id);
    if (!authorized) {
      return res.status(401).json({ success: false, message: 'Not authorized to view these submissions' });
    }

    const videos = await Video.find({ castingCall: req.params.castingCallId }).populate('actor', 'name email gender');
    res.status(200).json({ success: true, count: videos.length, data: videos });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Add a video submission
// @route   POST /api/v1/casting/:castingCallId/videos
// @access  Private (Actor only)
exports.addVideo = async (req, res, next) => {
  console.log(`🎬 [VIDEO UPLOAD] Received video upload request from user: ${req.user?._id}`);
  console.log(`🎬 [VIDEO UPLOAD] Casting call ID: ${req.params.castingCallId}`);
  console.log(`🎬 [VIDEO UPLOAD] Video URL: ${req.body.videoUrl}`);
  
  try {
    req.body.castingCall = req.params.castingCallId;
    req.body.actor = req.user._id;

    const castingCall = await CastingCall.findById(req.params.castingCallId);

    if (!castingCall) {
      return res.status(404).json({ success: false, message: 'Casting call not found' });
    }

    // Get the quality assessment utility
    const { evaluateAuditionQuality } = require('../utils/auditionQuality');

    // Extract video metadata from the request
    const videoMetadata = {
      height: req.body.videoHeight || 720, // Default to 720p if not provided
      duration: req.body.duration || 0,
      brightness: req.body.brightness || 0.75,
      audioQuality: req.body.audioQuality || 0.8
    };

    // Prepare audition metadata
    const auditionMetadata = {
      description: req.body.description || '',
      retakes: req.body.retakes || 1
    };

    // Get previous shortlist history for the actor
    const previousShortlists = await Video.countDocuments({
      actor: req.user._id,
      status: 'Accepted'
    });

    // Evaluate the audition quality
    const qualityAssessment = evaluateAuditionQuality({
      videoMetadata,
      auditionMetadata,
      roleDescription: castingCall.roleDescription || '',
      producerWatchTime: 0, // Initial watch time is 0
      previousShortlists
    });

    // Add quality assessment to the video data
    req.body.qualityAssessment = {
      level: qualityAssessment.quality,
      score: qualityAssessment.score,
      details: qualityAssessment.details
    };

    const video = await Video.create(req.body);

    // Notify all users associated with the casting (producer and team members)
    try {
      const notifyUsers = [];
      
      // Always notify the producer
      if (castingCall.producer && String(castingCall.producer) !== String(req.user._id)) {
        notifyUsers.push(castingCall.producer);
      }
      
      // If casting has a team, notify all team members
      if (castingCall.team) {
        const team = await ProductionTeam.findById(castingCall.team)
          .populate('owner')
          .populate('members.user');
        
        if (team) {
          // Add team owner
          if (team.owner && String(team.owner._id || team.owner) !== String(req.user._id)) {
            const ownerId = team.owner._id || team.owner;
            if (!notifyUsers.some(id => String(id) === String(ownerId))) {
              notifyUsers.push(ownerId);
            }
          }
          
          // Add all team members
          if (team.members && Array.isArray(team.members)) {
            team.members.forEach(member => {
              if (member.user) {
                const userId = member.user._id || member.user;
                if (String(userId) !== String(req.user._id) && 
                    !notifyUsers.some(id => String(id) === String(userId))) {
                  notifyUsers.push(userId);
                }
              }
            });
          }
        }
      }

      // If casting is linked to a project, notify project collaborators and creator
      if (castingCall.project) {
        const project = await FilmProject.findById(castingCall.project)
          .select('createdBy collaborators');
        if (project) {
          const creatorId = project.createdBy;
          if (creatorId && String(creatorId) !== String(req.user._id) &&
              !notifyUsers.some(id => String(id) === String(creatorId))) {
            notifyUsers.push(creatorId);
          }
          if (Array.isArray(project.collaborators)) {
            project.collaborators.forEach(collabId => {
              if (collabId && String(collabId) !== String(req.user._id) &&
                  !notifyUsers.some(id => String(id) === String(collabId))) {
                notifyUsers.push(collabId);
              }
            });
          }
        }
      }
      
      // Send notifications to all users
      await Promise.all(
        notifyUsers.map(userId =>
          createNotification({
            user: userId,
            title: 'New Casting Submission',
            message: `${req.user?.name || 'An actor'} submitted an audition for "${castingCall.roleTitle}"`,
            type: 'casting-submission',
            relatedId: castingCall._id,
            relatedType: 'casting-call'
          }).catch(err => console.error(`Failed to notify user ${userId}:`, err.message))
        )
      );
    } catch (notifyErr) {
      console.error('Failed to send submission notifications:', notifyErr.message);
      // Non-blocking - don't fail the submission if notifications fail
    }

    // 🤖 AI: Trigger emotion analysis (BLOCKING for audition videos)
    console.log(`[AI TRIGGER] Initiating AI analysis for video: ${video._id}`);
    if (video.type === 'audition') {
      try {
        console.log(`[AI] Starting emotion analysis for video ${video._id}`);
        
        // Validate video file
        if (!validateVideoFile(video.videoUrl)) {
          console.warn(`[AI] Invalid video file: ${video.videoUrl}`);
          video.aiAnalysis.error = 'Invalid video file format';
          await video.save();
        } else {
          // Run AI analysis SYNCHRONOUSLY - wait for it to complete
          const analysisResult = await safeAnalyzeVideo(
            video.videoUrl,
            castingCall.requiredEmotion || 'neutral'
          );
          const analysisData = analysisResult.data || analysisResult;

          if (analysisResult.success) {
            // Update video with AI results including new performance metrics
            video.aiAnalysis = {
              analyzed: true,
              requiredEmotion: analysisData.requiredEmotion,
              detectedEmotion: analysisData.detectedEmotion,
              emotionScores: analysisData.emotionScores,
              emotionMatchScore: analysisData.emotionMatchScore,
              emotionConsistency: analysisData.emotionConsistency || 0,
              expressionIntensity: analysisData.expressionIntensity || 0,
              faceVisibility: analysisData.faceVisibility || 0,
              overallPerformanceScore: analysisData.overallPerformanceScore || 0,
              emotionTimeline: analysisData.emotionTimeline || [],
              confidence: analysisData.confidence || 0,
              overallScore: analysisData.overallPerformanceScore || analysisData.emotionMatchScore || 0,
              feedback: analysisData.feedback,
              framesAnalyzed: analysisData.framesAnalyzed || 0,
              analyzedAt: new Date(),
              error: null,
            };
            console.log(`[AI] Analysis complete for video ${video._id}: performance=${analysisData.overallPerformanceScore || 0}% match=${analysisData.emotionMatchScore || 0}%`);
          } else {
            // Save error
            video.aiAnalysis = {
              analyzed: false,
              error: analysisResult.error,
              analyzedAt: new Date(),
            };
            console.error(`[AI] Analysis failed for video ${video._id}: ${analysisResult.error}`);
          }

          // Save with AI results
          await video.save();
        }
      } catch (aiError) {
        console.error(`[AI] Unexpected error in analysis: ${aiError.message}`);
        console.error(aiError.stack);
        // Still save even if analysis fails - don't block submission
        video.aiAnalysis = {
          analyzed: false,
          error: aiError.message,
          analyzedAt: new Date(),
        };
        await video.save();
      }
    } else {
      // For profile videos, run analysis async (non-blocking)
      try {
        setImmediate(async () => {
          try {
            console.log(`[AI] Starting async analysis for profile video ${video._id}`);
            const analysisResult = await safeAnalyzeVideo(
              video.videoUrl,
              'neutral'
            );
            const analysisData = analysisResult.data || analysisResult;
            if (analysisResult.success) {
              video.aiAnalysis = {
                analyzed: true,
                requiredEmotion: analysisData.requiredEmotion,
                detectedEmotion: analysisData.detectedEmotion,
                emotionScores: analysisData.emotionScores,
                emotionMatchScore: analysisData.emotionMatchScore,
                emotionConsistency: analysisData.emotionConsistency || 0,
                expressionIntensity: analysisData.expressionIntensity || 0,
                faceVisibility: analysisData.faceVisibility || 0,
                overallPerformanceScore: analysisData.overallPerformanceScore || 0,
                emotionTimeline: analysisData.emotionTimeline || [],
                confidence: analysisData.confidence || 0,
                overallScore: analysisData.overallPerformanceScore || analysisData.emotionMatchScore || 0,
                feedback: analysisData.feedback,
                framesAnalyzed: analysisData.framesAnalyzed || 0,
                analyzedAt: new Date(),
                error: null,
              };
            }
            await video.save();
          } catch (err) {
            console.error(`[AI] Async analysis failed: ${err.message}`);
          }
        });
      } catch (aiErr) {
        console.error(`[AI] Failed to trigger async analysis: ${aiErr.message}`);
      }
    }

    res.status(201).json({ 
      success: true, 
      data: {
        ...video.toObject(),
        qualityAssessment: {
          level: qualityAssessment.quality,
          score: qualityAssessment.score
        },
        // aiAnalysis already populated if audition video, or indicates pending if profile
        aiAnalysis: video.aiAnalysis || {
          analyzed: video.type === 'audition' ? true : false,
          requiredEmotion: castingCall?.requiredEmotion || 'neutral'
        }
      } 
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get current actor's submissions
// @route   GET /api/v1/videos/mine
// @access  Private (Actor)
exports.getMyVideos = async (req, res, next) => {
  try {
    const videos = await Video.find({ actor: req.user._id })
      .sort({ createdAt: -1 })
      .populate('castingCall', 'roleTitle roleName');
    res.status(200).json({ success: true, count: videos.length, data: videos });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get all public videos for feeds
// @route   GET /api/v1/videos/public
// @access  Public
exports.getPublicVideos = async (req, res, next) => {
  try {
    console.log('Getting public videos for feeds');
    
    // Get all profile videos from the Video collection
    const videoDocs = await Video.find({ 
      type: 'profile' // Only get profile videos
    })
    .populate('actor', 'name email profileImage')
    .sort({ createdAt: -1 })
    .lean();

    // Also get embedded profile videos from User documents
    const usersWithVideos = await User.find({ 
      videos: { $exists: true, $not: { $size: 0 } }
    })
    .select('name email profileImage videos')
    .lean();

    // Transform embedded videos to match Video collection format
    const embeddedVideos = usersWithVideos.flatMap(user => 
      user.videos.map(video => ({
        _id: video._id,
        title: video.title,
        description: video.description,
        videoUrl: video.url,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        views: video.views,
        // Ensure like/comment metadata is carried over for persistence
        likes: typeof video.likes === 'number' ? video.likes : 0,
        comments: typeof video.comments === 'number' ? video.comments : 0,
        likedBy: Array.isArray(video.likedBy) ? video.likedBy : [],
        uploadedAt: video.uploadedAt,
        createdAt: video.uploadedAt,
        category: video.category,
        type: 'profile',
        actor: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage
        }
      }))
    );

    // Merge both sources and de-duplicate by videoUrl + title
    const mergedMap = new Map();
    [...videoDocs, ...embeddedVideos].forEach(v => {
      const key = `${v.videoUrl || ''}::${v.title || ''}`;
      if (!mergedMap.has(key)) mergedMap.set(key, v);
    });
    const videos = Array.from(mergedMap.values());
    
    // Sort merged videos by creation date (most recent first)
    videos.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.uploadedAt || 0);
      const dateB = new Date(b.createdAt || b.uploadedAt || 0);
      return dateB - dateA; // Most recent first
    });
    
    // Get current user ID if authenticated (for checking if user liked each video)
    const currentUserId = req.user ? req.user._id : null;
    
    // Transform videos to include all required fields for the frontend
    const transformedVideos = videos.map(video => {
      // Check if current user has liked this video
      const isLiked = currentUserId && video.likedBy && 
        video.likedBy.some(id => id.toString() === currentUserId);
      
      return {
        ...video,
        _id: (video._id && video._id.toString) ? video._id.toString() : String(video._id || ''),
        thumbnailUrl: video.thumbnailUrl || (video.videoUrl ? 
          video.videoUrl.replace(/\.(mp4|mov|avi|wmv|flv|webm)$/i, '.jpg') : 
          'https://via.placeholder.com/300x169?text=No+Thumbnail'),
        views: video.views || 0,
        likes: video.likes || 0,
        comments: video.comments || 0,
        isLiked: isLiked || false,
        duration: video.duration || 0,
        uploadedAt: video.uploadedAt || video.createdAt || new Date(),
        createdAt: video.createdAt || video.uploadedAt || new Date(),
        category: video.category || 'Profile Video'
      };
    });
    
    console.log('Returning public videos:', {
      count: transformedVideos.length,
      firstVideo: transformedVideos[0] || 'No videos found'
    });
    
    res.status(200).json({ 
      success: true, 
      count: transformedVideos.length, 
      data: transformedVideos 
    });
  } catch (err) {
    console.error('Error in getPublicVideos:', {
      error: err.message,
      stack: err.stack
    });
    res.status(400).json({ 
      success: false, 
      message: err.message || 'Error fetching public videos' 
    });
  }
};

// @desc    Get current actor's profile videos
// @route   GET /api/v1/videos/profile
// @access  Private (Actor)
exports.getMyProfileVideos = async (req, res, next) => {
  try {
    console.log('Getting profile videos for user:', req.user._id);
    
    // First, check if there are any videos for this user at all
    const allUserVideos = await Video.find({ actor: req.user._id }).lean();
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
      actor: req.user._id,
      type: 'profile' // Only get profile videos
    })
    .sort({ createdAt: -1 })
    .lean();

    // Also load embedded profile videos from the User document
    const user = await User.findById(req.user._id).lean();
    const embedded = (user && Array.isArray(user.videos)) ? user.videos.map(v => ({
      _id: v._id,
      title: v.title,
      description: v.description,
      videoUrl: v.url, // map to common field
      thumbnailUrl: v.thumbnailUrl,
      duration: v.duration,
      views: v.views,
      // propagate reaction fields so profile reflects feed actions
      likes: typeof v.likes === 'number' ? v.likes : 0,
      comments: typeof v.comments === 'number' ? v.comments : 0,
      likedBy: Array.isArray(v.likedBy) ? v.likedBy : [],
      uploadedAt: v.uploadedAt,
      category: v.category,
      type: 'profile',
      actor: req.user._id
    })) : [];

    // Merge both sources and de-duplicate by videoUrl + title
    const mergedMap = new Map();
    [...videoDocs, ...embedded].forEach(v => {
      const key = `${v.videoUrl || ''}::${v.title || ''}`;
      if (!mergedMap.has(key)) mergedMap.set(key, v);
    });
    const videos = Array.from(mergedMap.values());
    
    console.log('Profile videos query:', {
      query: { actor: req.user._id, type: 'profile' },
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
      likes: video.likes || 0,
      comments: video.comments || 0,
      likedBy: Array.isArray(video.likedBy) ? video.likedBy : [],
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
      user: req.user ? req.user._id : 'No user in request'
    });
    res.status(400).json({ 
      success: false, 
      message: err.message || 'Error fetching profile videos' 
    });
  }
};

// @desc    Update submission status (Accept/Reject)
// @route   PATCH /api/v1/videos/:id/status
// @access  Private (Producer, Owner, Recruiter)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'Accepted' | 'Rejected' | 'Pending'
    if (!['Accepted', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const video = await Video.findById(req.params.id).populate('castingCall');
    if (!video) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Check if user is authorized to write (producer or non-viewer team member)
    const authorized = await isAuthorizedForCasting(video.castingCall, req.user._id, { allowWrite: true });
    if (!authorized) {
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
    if (video.actor.toString() !== String(req.user._id) && req.user.role !== 'Admin') {
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
      actor: req.user._id,
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
      video = await Video.findOne({ _id: videoId, actor: req.user._id, type: 'profile' });
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
      user = await User.findById(req.user._id);
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

// @desc    Get a viewable portfolio URL for a submission (handles authenticated/raw PDFs)
// @route   GET /api/v1/videos/:id/portfolio
// @access  Private (Producer or Team Members or Admin)
exports.getPortfolio = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id).populate('castingCall');
    if (!video) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    if (!video.portfolioUrl) {
      return res.status(404).json({ success: false, message: 'Portfolio not uploaded for this submission' });
    }
    
    // Check authorization
    const isAdmin = req.user && req.user.role === 'Admin';
    const authorized = isAdmin || await isAuthorizedForCasting(video.castingCall, req.user._id);
    
    console.log('[getPortfolio] Authorization check:', {
      videoId: req.params.id,
      userId: req.user._id,
      userRole: req.user.role,
      castingCallProducer: video.castingCall?.producer,
      isAdmin,
      authorized
    });
    
    if (!authorized) {
      return res.status(401).json({ success: false, message: 'Not authorized to view this portfolio' });
    }

    const url = video.portfolioUrl;
    
    // Handle raw/upload URLs (new format for PDFs)
    if (url.includes('/raw/upload/')) {
      console.log('[getPortfolio] Raw URL detected:', url);
      
      // Try to access the raw URL directly first
      try {
        const axios = require('axios');
        const testRes = await axios.head(url, { timeout: 5000 });
        if (testRes.status === 200) {
          console.log('[getPortfolio] Raw URL is accessible');
          if (String(req.query.format).toLowerCase() === 'json') {
            return res.status(200).json({ success: true, url });
          }
          return res.redirect(302, url);
        }
      } catch (error) {
        console.log('[getPortfolio] Raw URL not accessible, generating signed URL');
      }
      
      // If direct access fails, generate a signed URL
      const uploadIdx = url.indexOf('/upload/');
      if (uploadIdx !== -1) {
        let tail = url.substring(uploadIdx + '/upload/'.length);
        if (tail.startsWith('v')) {
          const firstSlash = tail.indexOf('/');
          if (firstSlash !== -1) tail = tail.substring(firstSlash + 1);
        }
        if (tail.toLowerCase().endsWith('.pdf')) tail = tail.slice(0, -4);
        const publicId = tail;
        
        const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
          resource_type: 'raw',
          type: 'authenticated',
          expires_at: Math.floor(Date.now() / 1000) + 60 * 5,
          attachment: false,
        });
        
        console.log('[getPortfolio] Generated signed URL:', signedUrl);
        if (String(req.query.format).toLowerCase() === 'json') {
          return res.status(200).json({ success: true, url: signedUrl });
        }
        return res.redirect(302, signedUrl);
      }
    }
    
    // If already public (image/upload), test accessibility first (legacy format)
    if (url.includes('/image/upload/')) {
      console.log('[getPortfolio] Image upload URL detected:', url);
      
      // Test if the image upload URL is accessible
      try {
        const axios = require('axios');
        const testRes = await axios.head(url, { timeout: 5000 });
        if (testRes.status === 200) {
          console.log('[getPortfolio] Image upload URL is accessible');
          if (String(req.query.format).toLowerCase() === 'json') {
            return res.status(200).json({ success: true, url });
          }
          return res.redirect(302, url);
        }
      } catch (error) {
        console.log('[getPortfolio] Image upload URL not accessible, generating signed URL');
        
        // Generate signed URL for image uploads that are not publicly accessible
        const uploadIdx = url.indexOf('/upload/');
        if (uploadIdx !== -1) {
          let tail = url.substring(uploadIdx + '/upload/'.length);
          if (tail.startsWith('v')) {
            const firstSlash = tail.indexOf('/');
            if (firstSlash !== -1) tail = tail.substring(firstSlash + 1);
          }
          if (tail.toLowerCase().endsWith('.pdf')) tail = tail.slice(0, -4);
          const publicId = tail;
          
          const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
            resource_type: 'image',
            type: 'authenticated',
            expires_at: Math.floor(Date.now() / 1000) + 60 * 5,
            attachment: false,
          });
          
          console.log('[getPortfolio] Generated signed URL for image upload:', signedUrl);
          if (String(req.query.format).toLowerCase() === 'json') {
            return res.status(200).json({ success: true, url: signedUrl });
          }
          return res.redirect(302, signedUrl);
        }
      }
    }

    // Handle other raw/upload URLs by generating a signed, time-limited URL
    // Extract public_id from URL: .../raw/upload/v12345/<public_id>.pdf
    const uploadIdx = url.indexOf('/upload/');
    if (uploadIdx === -1) {
      return res.status(400).json({ success: false, message: 'Unrecognized portfolio URL format' });
    }
    let tail = url.substring(uploadIdx + '/upload/'.length);
    // Remove version prefix if present
    if (tail.startsWith('v')) {
      const firstSlash = tail.indexOf('/');
      if (firstSlash !== -1) tail = tail.substring(firstSlash + 1);
    }
    // Strip extension
    if (tail.toLowerCase().endsWith('.pdf')) {
      tail = tail.slice(0, -4);
    }
    const publicId = tail; // may include folders

    // Generate a signed download URL for authenticated/raw resources
    const signedUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
      resource_type: 'raw',
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
      attachment: false,
    });

    // If `?format=json`, return JSON instead of redirect
    if (String(req.query.format).toLowerCase() === 'json') {
      return res.status(200).json({ success: true, url: signedUrl });
    }

    return res.redirect(302, signedUrl);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Stream the portfolio PDF through the server (avoids 401s/private access)
// @route   GET /api/v1/videos/:id/portfolio/file
// @access  Private (Producer or Team Members or Admin)
exports.getPortfolioFile = async (req, res, next) => {
  try {
    console.log('[getPortfolioFile] params.id=', req.params.id);
    let video = await Video.findById(req.params.id).populate('castingCall');
    if (!video) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    if (!video.portfolioUrl) {
      return res.status(404).json({ success: false, message: 'Portfolio not uploaded for this submission' });
    }
    
    // Check authorization
    const isAdmin = req.user && req.user.role === 'Admin';
    const authorized = isAdmin || await isAuthorizedForCasting(video.castingCall, req.user._id);
    
    if (!authorized) {
      console.warn('[getPortfolioFile] Not authorized', { userId: req.user._id, videoId: String(video._id) });
      return res.status(401).json({ success: false, message: 'Not authorized to view this portfolio' });
    }

    const directUrl = video.portfolioUrl;
    
    // Handle raw/upload URLs (new format for PDFs) - these should be publicly accessible
    const isRawUpload = directUrl.includes('/raw/upload/');
    // If it's a public image upload of a PDF, we can proxy it directly (legacy format)
    const isImageUpload = directUrl.includes('/image/upload/');

    let downloadUrl = directUrl;
    
    // For image uploads, test accessibility first
    if (isImageUpload) {
      try {
        const axios = require('axios');
        const testRes = await axios.head(directUrl, { timeout: 5000 });
        if (testRes.status === 200) {
          downloadUrl = directUrl; // Use direct URL if accessible
        } else {
          // Generate signed URL if not accessible
          const uploadIdx = directUrl.indexOf('/upload/');
          if (uploadIdx !== -1) {
            let tail = directUrl.substring(uploadIdx + '/upload/'.length);
            if (tail.startsWith('v')) {
              const firstSlash = tail.indexOf('/');
              if (firstSlash !== -1) tail = tail.substring(firstSlash + 1);
            }
            if (tail.toLowerCase().endsWith('.pdf')) tail = tail.slice(0, -4);
            const publicId = tail;
            downloadUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
              resource_type: 'image',
              type: 'authenticated',
              expires_at: Math.floor(Date.now() / 1000) + 60 * 5,
              attachment: false,
            });
          }
        }
      } catch (error) {
        console.log('[getPortfolioFile] Image upload URL not accessible, generating signed URL');
        // Generate signed URL as fallback
        const uploadIdx = directUrl.indexOf('/upload/');
        if (uploadIdx !== -1) {
          let tail = directUrl.substring(uploadIdx + '/upload/'.length);
          if (tail.startsWith('v')) {
            const firstSlash = tail.indexOf('/');
            if (firstSlash !== -1) tail = tail.substring(firstSlash + 1);
          }
          if (tail.toLowerCase().endsWith('.pdf')) tail = tail.slice(0, -4);
          const publicId = tail;
          downloadUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
            resource_type: 'image',
            type: 'authenticated',
            expires_at: Math.floor(Date.now() / 1000) + 60 * 5,
            attachment: false,
          });
        }
      }
    } else if (!isRawUpload) {
      // If the URL does not contain /upload/, fallback to proxying the original URL
      const uploadIdx = directUrl.indexOf('/upload/');
      if (uploadIdx === -1) {
        // Some storage providers might give already signed URLs; proxy as-is
        downloadUrl = directUrl;
      } else {
        // Build a short-lived signed URL for authenticated/raw
        let tail = directUrl.substring(uploadIdx + '/upload/'.length);
        if (tail.startsWith('v')) {
          const firstSlash = tail.indexOf('/');
          if (firstSlash !== -1) tail = tail.substring(firstSlash + 1);
        }
        if (tail.toLowerCase().endsWith('.pdf')) tail = tail.slice(0, -4);
        const publicId = tail;
        downloadUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
          resource_type: 'raw',
          type: 'authenticated',
          expires_at: Math.floor(Date.now() / 1000) + 60 * 5,
          attachment: false,
        });
      }
    }

    // Stream file to client using axios (avoid node-fetch dependency)
    const axios = require('axios');
    const upstreamRes = await axios.get(downloadUrl, { responseType: 'stream', validateStatus: () => true });
    if (upstreamRes.status >= 400) {
      console.warn('[getPortfolioFile] Upstream fetch failed', { status: upstreamRes.status, url: downloadUrl });
      return res.status(upstreamRes.status).json({ success: false, message: 'Failed to fetch portfolio' });
    }
    // Forward content-type if present, default to application/pdf
    const contentType = upstreamRes.headers['content-type'] || 'application/pdf';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=60');
    upstreamRes.data.pipe(res);
  } catch (err) {
    console.error('[getPortfolioFile] Error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Increment video view count
// @route   PUT /api/v1/videos/:videoId/view
// @access  Public
exports.incrementVideoView = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId } = req.body; // Optional: to track unique views per user
    
    // First try to find video in Video collection
    let video = await Video.findById(videoId);
    
    if (video) {
      // Video found in Video collection
      video.views = (video.views || 0) + 1;
      await video.save();
      
      return res.json({ 
        success: true, 
        views: video.views,
        message: 'View count updated successfully'
      });
    }
    
    // If not found in Video collection, try to find in User's embedded videos
    const user = await User.findOne({ 'videos._id': videoId });
    
    if (user) {
      const embeddedVideo = user.videos.id(videoId);
      if (embeddedVideo) {
        embeddedVideo.views = (embeddedVideo.views || 0) + 1;
        await user.save();
        
        return res.json({ 
          success: true, 
          views: embeddedVideo.views,
          message: 'View count updated successfully'
        });
      }
    }
    
    return res.status(404).json({ 
      success: false, 
      message: 'Video not found' 
    });
    
  } catch (error) {
    console.error('Error incrementing video view:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Toggle like on video
// @route   PUT /api/v1/videos/:videoId/like
// @access  Public
exports.toggleVideoLike = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId } = req.body;
    
    console.log('Toggle like request:', { videoId, userId });
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }
    
    // First try to find video in Video collection
    let video = await Video.findById(videoId);
    let isVideoCollection = true;
    
    if (!video) {
      // If not found in Video collection, try to find in User's embedded videos
      const user = await User.findOne({ 'videos._id': videoId });
      
      if (user) {
        video = user.videos.id(videoId);
        isVideoCollection = false;
      }
    }
    
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }
    
    // Check if user already liked this video
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isLiked = video.likedBy && video.likedBy.some(id => id.toString() === userId);
    
    if (isLiked) {
      // Unlike: remove user from likedBy array and decrement likes
      video.likedBy = video.likedBy.filter(id => id.toString() !== userId);
      video.likes = Math.max(0, (video.likes || 0) - 1);
    } else {
      // Like: add user to likedBy array and increment likes
      if (!video.likedBy) video.likedBy = [];
      video.likedBy.push(userObjectId);
      video.likes = (video.likes || 0) + 1;

      // Send notification to video owner for profile videos (only when liking, not unliking)
      try {
        const videoOwnerId = video.actor ? video.actor.toString() : null;
        // Don't notify if user is liking their own video
        if (videoOwnerId && videoOwnerId !== userId && video.type === 'profile') {
          const liker = await User.findById(userId).select('name');
          await createNotification({
            user: videoOwnerId,
            title: 'New Like on Your Video',
            message: `${liker?.name || 'Someone'} liked your video "${video.title || 'Untitled'}"`,
            type: 'system',
            relatedId: videoId,
            relatedType: 'video',
            metadata: {
              videoId: videoId,
              videoTitle: video.title,
              likerId: userId,
              likerName: liker?.name
            }
          });
        }
      } catch (notifErr) {
        console.error('Failed to create like notification:', notifErr.message);
        // Don't fail the like operation if notification fails
      }
    }
    
    // Save changes and sync to counterpart storage (embedded <-> collection)
    if (isVideoCollection) {
      await video.save();

      // Also try to update an embedded copy if one exists for the same asset
      try {
        const syncUser = await User.findOne({ 
          'videos.url': video.videoUrl, 
          'videos.title': video.title 
        });
        if (syncUser) {
          const emb = syncUser.videos.find(v => v.url === video.videoUrl && v.title === video.title);
          if (emb) {
            emb.likes = video.likes;
            emb.likedBy = video.likedBy;
            await syncUser.save();
          }
        }
      } catch (syncErr) {
        console.warn('Like sync to embedded video failed (non-fatal):', syncErr.message);
      }
    } else {
      // For embedded videos, we need to update the parent user document
      const user = await User.findOne({ 'videos._id': videoId });
      if (user) {
        const embeddedVideo = user.videos.id(videoId);
        if (embeddedVideo) {
          embeddedVideo.likes = video.likes;
          embeddedVideo.likedBy = video.likedBy;
          await user.save();
        }
      }

      // Also try to update the collection copy if it exists
      try {
        const collVideo = await Video.findOne({ videoUrl: video.url, title: video.title });
        if (collVideo) {
          collVideo.likes = video.likes;
          collVideo.likedBy = video.likedBy;
          await collVideo.save();
        }
      } catch (syncErr) {
        console.warn('Like sync to collection video failed (non-fatal):', syncErr.message);
      }
    }
    
    res.json({ 
      success: true, 
      likes: video.likes,
      isLiked: !isLiked,
      message: isLiked ? 'Video unliked' : 'Video liked'
    });
    
  } catch (error) {
    console.error('Error toggling video like:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Helper: ensure comment has a user-like object even for legacy ProductionHouse IDs
async function hydrateCommentUser(comment) {
  // When populate succeeds, keep as-is
  if (comment.user && (comment.user.name || comment.user.companyName)) return comment;

  const userId = comment.user || comment?._id || comment?.user?._id || comment?.user?.id;
  if (!userId) return comment;

  try {
    const ph = await ProductionHouse.findById(userId).select('companyName profileImage');
    if (ph) {
      // Attach a pseudo-user object so frontend can render the name
      const hydrated = comment.toObject ? comment.toObject() : { ...comment };
      hydrated.user = {
        _id: ph._id,
        name: ph.companyName,
        companyName: ph.companyName,
        profileImage: ph.profileImage,
        role: 'ProductionHouse'
      };
      return hydrated;
    }
  } catch (err) {
    console.warn('hydrateCommentUser: failed to hydrate production house user', err.message);
  }
  return comment;
}

// @desc    Get comments for a video
// @route   GET /api/v1/videos/:videoId/comments
// @access  Public
exports.getVideoComments = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    console.log('Get comments request for video:', videoId);
    
    // Fetch comments for this video, populated with user data
    const comments = await Comment.find({ video: videoId })
      .populate('user', 'name companyName role profileImage')
      .sort({ createdAt: -1 })
      .lean(); // lean so we can mutate easily

    const hydrated = await Promise.all(comments.map(hydrateCommentUser));
    
    res.json({
      success: true,
      data: hydrated,
      count: hydrated.length
    });
    
  } catch (error) {
    console.error('Error fetching video comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
};

// @desc    Add comment to video
// @route   POST /api/v1/videos/:videoId/comment
// @access  Public
exports.addVideoComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { userId, comment } = req.body;
    
    console.log('Add comment request:', { videoId, userId, comment });
    
    if (!userId || !comment) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and comment are required' 
      });
    }
    
    // First try to find video in Video collection
    let video = await Video.findById(videoId);
    let isVideoCollection = true;
    
    if (!video) {
      // If not found in Video collection, try to find in User's embedded videos
      const user = await User.findOne({ 'videos._id': videoId });
      
      if (user) {
        video = user.videos.id(videoId);
        isVideoCollection = false;
      }
    }
    
    if (!video) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }
    
    // Create the comment in the Comment collection
    const newComment = await Comment.create({
      video: videoId,
      user: userId,
      comment: comment.trim()
    });
    
    // Populate the user data for the response (include companyName for production users)
    await newComment.populate('user', 'name companyName role profileImage');

    // If populate failed because this is a legacy ProductionHouse user, hydrate manually
    const hydratedNewComment = await hydrateCommentUser(newComment);
    
    // Increment comment count on the video
    video.comments = (video.comments || 0) + 1;

    // Send notification to video owner for profile videos
    try {
      const videoOwnerId = video.actor ? video.actor.toString() : null;
      // Don't notify if user is commenting on their own video
      if (videoOwnerId && videoOwnerId !== userId && video.type === 'profile') {
        // Fetch commenter from User first; if not found, fallback to ProductionHouse
        let commenter = await User.findById(userId).select('name companyName');
        if (!commenter) {
          commenter = await ProductionHouse.findById(userId).select('companyName');
        }
        await createNotification({
          user: videoOwnerId,
          title: 'New Comment on Your Video',
          message: `${commenter?.name || commenter?.companyName || 'Someone'} commented on your video "${video.title || 'Untitled'}": "${comment.trim().substring(0, 50)}${comment.trim().length > 50 ? '...' : ''}"`,
          type: 'system',
          relatedId: videoId,
          relatedType: 'video',
          metadata: {
            videoId: videoId,
            videoTitle: video.title,
            commenterId: userId,
            commenterName: commenter?.name || commenter?.companyName,
            commentText: comment.trim()
          }
        });
      }
    } catch (notifErr) {
      console.error('Failed to create comment notification:', notifErr.message);
      // Don't fail the comment operation if notification fails
    }
    
    // Save changes and sync to counterpart storage (embedded <-> collection)
    if (isVideoCollection) {
      await video.save();

      // Also try to update an embedded copy if one exists for the same asset
      try {
        const syncUser = await User.findOne({ 
          'videos.url': video.videoUrl, 
          'videos.title': video.title 
        });
        if (syncUser) {
          const emb = syncUser.videos.find(v => v.url === video.videoUrl && v.title === video.title);
          if (emb) {
            emb.comments = video.comments;
            await syncUser.save();
          }
        }
      } catch (syncErr) {
        console.warn('Comment sync to embedded video failed (non-fatal):', syncErr.message);
      }
    } else {
      // For embedded videos, we need to update the parent user document
      const user = await User.findOne({ 'videos._id': videoId });
      if (user) {
        const embeddedVideo = user.videos.id(videoId);
        if (embeddedVideo) {
          embeddedVideo.comments = video.comments;
          await user.save();
        }
      }

      // Also try to update the collection copy if it exists
      try {
        const collVideo = await Video.findOne({ videoUrl: video.url, title: video.title });
        if (collVideo) {
          collVideo.comments = video.comments;
          await collVideo.save();
        }
      } catch (syncErr) {
        console.warn('Comment sync to collection video failed (non-fatal):', syncErr.message);
      }
    }
    
    res.json({ 
      success: true, 
      comments: video.comments,
      comment: hydratedNewComment,
      message: 'Comment added successfully'
    });
    
  } catch (error) {
    console.error('Error adding video comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Update video metrics and recalculate quality
// @route   PUT /api/v1/videos/:id/metrics
// @access  Private (Producer, Owner, Recruiter)
exports.updateVideoMetrics = async (req, res, next) => {
  try {
    const { watchTime, brightness, audioQuality } = req.body;
    
    const video = await Video.findById(req.params.id).populate('castingCall');
    
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Check if user is authorized to write (producer or non-viewer team member)
    const authorized = await isAuthorizedForCasting(video.castingCall, req.user._id, { allowWrite: true });
    if (!authorized) {
      return res.status(401).json({ success: false, message: 'Not authorized to update metrics for this video' });
    }

    const { evaluateAuditionQuality } = require('../utils/auditionQuality');

    // Get previous shortlist history for the actor
    const previousShortlists = await Video.countDocuments({
      actor: video.actor,
      status: 'Accepted'
    });

    // Update video metadata with new metrics
    const videoMetadata = {
      height: video.videoHeight || 720,
      duration: video.duration || 0,
      brightness: brightness || video.qualityAssessment?.details?.scores?.video?.lighting || 0.75,
      audioQuality: audioQuality || video.qualityAssessment?.details?.scores?.video?.audio || 0.8
    };

    const auditionMetadata = {
      description: video.description || '',
      retakes: video.retakes || 1
    };

    // Recalculate quality with updated metrics
    const qualityAssessment = evaluateAuditionQuality({
      videoMetadata,
      auditionMetadata,
      roleDescription: video.castingCall.roleDescription || '',
      producerWatchTime: watchTime || 0,
      previousShortlists
    });

    // Update video with new quality assessment
    video.qualityAssessment = {
      level: qualityAssessment.quality,
      score: qualityAssessment.score,
      details: qualityAssessment.details
    };

    await video.save();

    res.status(200).json({
      success: true,
      data: {
        ...video.toObject(),
        qualityAssessment: {
          level: qualityAssessment.quality,
          score: qualityAssessment.score
        }
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
