const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'Actor',
      phone,
      // Common
      location,
      // Actor
      age,
      gender,
      experienceLevel,
      bio,
      profileImage,
      // Producer
      companyName,
      website
    } = req.body;

    // Basic validations
    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({ success: false, message: 'Full Name must be 2–50 characters' });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const payload = {
      name,
      email,
      password,
      role,
      phone,
      location,
      profileImage,
      website,
      companyName,
      age,
      gender,
      experienceLevel,
      bio
    };

    // Role-specific required checks
    if (role === 'Actor') {
      if (age === undefined || age === null || Number(age) < 1 || Number(age) > 120) {
        return res.status(400).json({ success: false, message: 'Age must be between 1 and 120' });
      }
      const allowedGender = ['male', 'female', 'other', 'prefer-not-to-say'];
      if (!allowedGender.includes(String(gender))) {
        return res.status(400).json({ success: false, message: 'Gender must be one of male, female, other, prefer-not-to-say' });
      }
      const allowedExp = ['beginner', 'intermediate', 'experienced', 'professional'];
      if (!allowedExp.includes(String(experienceLevel))) {
        return res.status(400).json({ success: false, message: 'Experience level must be one of beginner, intermediate, experienced, professional' });
      }
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone is required' });
      }
      if (!location) {
        return res.status(400).json({ success: false, message: 'Location is required' });
      }
      if (bio && String(bio).length > 500) {
        return res.status(400).json({ success: false, message: 'Bio must be at most 500 characters' });
      }
    }

    if (role === 'Producer') {
      if (!companyName) {
        return res.status(400).json({ success: false, message: 'Production House / Company Name is required' });
      }
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone is required' });
      }
      if (!location) {
        return res.status(400).json({ success: false, message: 'Location is required' });
      }
    }

    const user = await User.create(payload);

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
     res.status(400).json({ success: false, message: err.message });
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  const options = {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Send user data without the password
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    photo: user.photo || '',
    location: user.location,
    age: user.age,
    gender: user.gender,
    experienceLevel: user.experienceLevel,
    bio: user.bio,
    profileImage: user.profileImage,
    companyName: user.companyName,
    website: user.website
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: userResponse
    });
};

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Get current logged-in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('following', '_id');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
      photo: user.photo || '',
      location: user.location,
      age: user.age,
      gender: user.gender,
      experienceLevel: user.experienceLevel,
      bio: user.bio,
      profileImage: user.profileImage,
      companyName: user.companyName,
      website: user.website,
      following: user.following
    };

    res.status(200).json({ success: true, user: userResponse });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update current logged-in user profile
// @route   PUT /api/v1/auth/me
// @access  Private
exports.updateMe = async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.name === 'string') updates.name = req.body.name;
    if (typeof req.body.phone === 'string') updates.phone = req.body.phone;
    if (typeof req.body.location === 'string') updates.location = req.body.location;
    if (typeof req.body.age === 'number') updates.age = req.body.age;
    if (typeof req.body.gender === 'string') updates.gender = req.body.gender;
    if (typeof req.body.experienceLevel === 'string') updates.experienceLevel = req.body.experienceLevel;
    if (typeof req.body.bio === 'string') updates.bio = req.body.bio;
    if (typeof req.body.profileImage === 'string') updates.profileImage = req.body.profileImage;
    if (typeof req.body.companyName === 'string') updates.companyName = req.body.companyName;
    if (typeof req.body.website === 'string') updates.website = req.body.website;

    // Validate at least one field
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
      photo: user.photo || '',
      location: user.location,
      age: user.age,
      gender: user.gender,
      experienceLevel: user.experienceLevel,
      bio: user.bio,
      profileImage: user.profileImage,
      companyName: user.companyName,
      website: user.website
    };

    return res.status(200).json({ success: true, user: userResponse });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Upload/Update profile photo
// @route   PUT /api/v1/auth/me/photo
// @access  Private
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: filePath },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
      profileImage: user.profileImage || '',
      location: user.location,
      age: user.age,
      gender: user.gender,
      experienceLevel: user.experienceLevel,
      bio: user.bio,
      companyName: user.companyName,
      website: user.website
    };

    return res.status(200).json({ success: true, user: userResponse });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Login/Register with Google ID token
// @route   POST /api/v1/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { credential, role } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Missing Google credential' });
    }

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || payload.given_name || 'User';

    // Validate desired role if provided
    const allowedRoles = ['Actor', 'Producer', 'Admin'];
    const desiredRole = allowedRoles.includes(role) ? role : 'Actor';

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        // Generate a random password since not used for Google auth
        password: Math.random().toString(36).slice(-12),
        role: desiredRole,
      });
    }

    // Issue our JWT and return standard payload
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ success: false, message: 'Google authentication failed' });
  }
};

// @desc    Check if email exists
// @route   GET /api/v1/auth/check-email
// @access  Public
exports.checkEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if email exists in the database
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    res.status(200).json({
      success: true,
      available: !user, // true if email is available, false if already exists
      message: user ? 'Email is already registered' : 'Email is available'
    });
    
  } catch (err) {
    console.error('Error checking email:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while checking email',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide an email address' 
      });
    }

    // Get user from database
    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if the email exists or not
      return res.status(200).json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent' 
      });
    }

    // Generate and save reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL - point to the frontend reset password page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      // Send email with reset token
      await sendPasswordResetEmail(user, resetToken, resetUrl);
      
      res.status(200).json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (err) {
      console.error('Error sending email:', err);
      
      // Reset the token if email fails to send
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ 
        success: false, 
        message: 'Email could not be sent' 
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Check if reset token is valid
// @route   GET /api/v1/auth/check-reset-token/:resettoken
// @access  Public
exports.checkResetToken = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    // Find user by reset token and check if it's not expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Valid reset token'
    });
  } catch (err) {
    console.error('Check reset token error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    // Find user by reset token and check if it's not expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    const { newPassword, confirmPassword } = req.body;

    // Validate passwords
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match' 
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    // Send token response to log the user in
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};