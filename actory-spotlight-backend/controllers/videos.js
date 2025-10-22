const Video = require('../models/Video');
const CastingCall = require('../models/CastingCall');
const User = require('../models/User');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');
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
    const currentUserId = req.user ? req.user.id : null;
    
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

// @desc    Get a viewable portfolio URL for a submission (handles authenticated/raw PDFs)
// @route   GET /api/v1/videos/:id/portfolio
// @access  Private (Producer owner of the casting call or Admin)
exports.getPortfolio = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id).populate('castingCall', 'producer');
    if (!video) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    if (!video.portfolioUrl) {
      return res.status(404).json({ success: false, message: 'Portfolio not uploaded for this submission' });
    }
    // Ensure current user is the producer who owns the casting call
    const isOwner = String(video.castingCall?.producer || '') === String(req.user.id || '');
    const isAdmin = req.user && req.user.role === 'Admin';
    
    console.log('[getPortfolio] Authorization check:', {
      videoId: req.params.id,
      userId: req.user.id,
      userRole: req.user.role,
      castingCallProducer: video.castingCall?.producer,
      isOwner,
      isAdmin,
      authorized: isOwner || isAdmin
    });
    
    // If we can definitively determine ownership and it's false, block.
    // If producer is missing (e.g., castingCall not populated), allow and rely on route-level role auth.
    if ((video.castingCall && video.castingCall.producer) && !isOwner && !isAdmin) {
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
// @access  Private (Producer owner of the casting call)
exports.getPortfolioFile = async (req, res, next) => {
  try {
    console.log('[getPortfolioFile] params.id=', req.params.id);
    let video = await Video.findById(req.params.id).populate('castingCall', 'producer');
    if (!video) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    if (!video.portfolioUrl) {
      return res.status(404).json({ success: false, message: 'Portfolio not uploaded for this submission' });
    }
    // Authorization: ensure castingCall producer present even if initial populate failed
    const requesterId = req.user && req.user.id ? String(req.user.id) : undefined;
    let producerId = video?.castingCall && video.castingCall.producer ? String(video.castingCall.producer) : undefined;
    if (!producerId && video?.castingCall) {
      const cc = await CastingCall.findById(video.castingCall).select('producer').lean();
      producerId = cc ? String(cc.producer) : undefined;
    }
    // Only block when both IDs are present and mismatched.
    if (requesterId && producerId && producerId !== requesterId && (req.user.role !== 'Admin')) {
      console.warn('[getPortfolioFile] Not authorized', { requesterId, producerId, videoId: String(video._id) });
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

// @desc    Get comments for a video
// @route   GET /api/v1/videos/:videoId/comments
// @access  Public
exports.getVideoComments = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    console.log('Get comments request for video:', videoId);
    
    // Fetch comments for this video, populated with user data
    const comments = await Comment.find({ video: videoId })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 }); // Most recent first
    
    res.json({
      success: true,
      data: comments,
      count: comments.length
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
    
    // Populate the user data for the response
    await newComment.populate('user', 'name profileImage');
    
    // Increment comment count on the video
    video.comments = (video.comments || 0) + 1;
    
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
      comment: newComment,
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
