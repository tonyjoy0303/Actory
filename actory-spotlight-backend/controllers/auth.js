const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validate username
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err); // Add this line to see the full error in the terminal
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
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    photo: user.photo || ''
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
    const user = await User.findById(req.user.id);
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
      photo: user.photo || ''
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
      photo: user.photo || ''
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
      { photo: filePath },
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
      photo: user.photo || ''
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