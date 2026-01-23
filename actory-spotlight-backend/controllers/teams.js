const ProductionTeam = require('../models/ProductionTeam');
const TeamInvitation = require('../models/TeamInvitation');
const User = require('../models/User');
const ProductionHouse = require('../models/ProductionHouse');
const { createNotification } = require('../utils/notificationService');

const isMember = (team, userId) => {
  if (!team || !userId) return false;
  const targetId = String(userId);

  // Check owner
  const owner = team.owner;
  const ownerId = owner && owner._id ? String(owner._id) : String(owner);
  if (ownerId === targetId) return true;

  // Check members
  if (!team.members || !Array.isArray(team.members)) return false;

  return team.members.some((m) => {
    const user = m.user;
    // Handle both populated user object and raw ID
    const memberId = user && user._id ? String(user._id) : String(user);
    // If populated user is null (e.g. deleted user) but ID was matched in query, 
    // we might need to handle that, but for logged in user, user must exist.
    return memberId === targetId;
  });
};

exports.updateTeam = async (req, res) => {
  try {
    const { name, productionHouse, description } = req.body || {};
    const team = await ProductionTeam.findById(req.params.id);

    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    if (String(team.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only owner can update team' });
    }

    if (name) team.name = name.trim();
    if (productionHouse !== undefined) team.productionHouse = productionHouse.trim();
    if (description !== undefined) team.description = description.trim();

    await team.save();

    res.json({ success: true, data: team });
  } catch (err) {
    console.error('updateTeam error', err);
    res.status(500).json({ success: false, message: 'Failed to update team' });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const { name, productionHouse, description } = req.body || {};
    if (!name) {
      return res.status(400).json({ success: false, message: 'Team name is required' });
    }

    const team = await ProductionTeam.create({
      name: name.trim(),
      productionHouse: productionHouse?.trim(),
      description: description?.trim(),
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Owner' }]
    });

    res.status(201).json({ success: true, data: team });
  } catch (err) {
    console.error('createTeam error', err);
    res.status(500).json({ success: false, message: 'Failed to create team' });
  }
};

exports.getMyTeams = async (req, res) => {
  try {
    const teams = await ProductionTeam.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: teams });
  } catch (err) {
    console.error('getMyTeams error', err);
    res.status(500).json({ success: false, message: 'Failed to fetch teams' });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    // Fetch WITHOUT populate first so we retain raw ObjectIds even when they reference non-User docs
    const team = await ProductionTeam.findById(req.params.id);

    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    // Authorize: owner or any member (handles mixed refs because we compare raw ids)
    if (!isMember(team, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this team',
        debug: {
          reqUserId: String(req.user._id),
          teamOwnerId: String(team.owner),
          isOwnerMatch: String(req.user._id) === String(team.owner),
          memberIdsV: (team.members || []).map(m => String(m.user)),
          teamId: String(team._id)
        }
      });
    }

    // Prepare a response with manually populated lightweight user info
    const teamObj = team.toObject();

    // Populate owner: try User first, then ProductionHouse fallback
    let ownerDoc = null;
    try {
      ownerDoc = await User.findById(team.owner, 'name email role profileImage');
    } catch (_) {}
    if (!ownerDoc) {
      try {
        const ph = await ProductionHouse.findById(team.owner, 'companyName email role profileImage');
        if (ph) {
          ownerDoc = {
            _id: ph._id,
            name: ph.companyName || ph.name || 'Production House',
            email: ph.email,
            role: ph.role || 'ProductionTeam',
            profileImage: ph.profileImage || ph.photo || ''
          };
        }
      } catch (_) {}
    }
    teamObj.owner = ownerDoc || team.owner; // if still null, keep raw ObjectId

    // Populate members individually (User first, then ProductionHouse fallback)
    teamObj.members = await Promise.all((team.members || []).map(async (m) => {
      let userDoc = null;
      try {
        userDoc = await User.findById(m.user, 'name email role profileImage');
      } catch (_) {}
      if (!userDoc) {
        try {
          const ph = await ProductionHouse.findById(m.user, 'companyName email role profileImage');
          if (ph) {
            userDoc = {
              _id: ph._id,
              name: ph.companyName || ph.name || 'Production House',
              email: ph.email,
              role: ph.role || 'ProductionTeam',
              profileImage: ph.profileImage || ph.photo || ''
            };
          }
        } catch (_) {}
      }
      return { ...m.toObject ? m.toObject() : m, user: userDoc || m.user };
    }));

    res.json({ success: true, data: teamObj });
  } catch (err) {
    console.error('getTeamById error', err);
    res.status(500).json({ success: false, message: 'Failed to fetch team' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const team = await ProductionTeam.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (String(team.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only team owner can remove members' });
    }
    if (String(memberId) === String(team.owner)) {
      return res.status(400).json({ success: false, message: 'Owner cannot be removed' });
    }

    const before = team.members.length;
    team.members = team.members.filter((m) => String(m.user) !== String(memberId));
    await team.save();

    if (before === team.members.length) {
      return res.status(404).json({ success: false, message: 'Member not found in team' });
    }

    await createNotification({
      user: memberId,
      title: 'Removed from team',
      message: `You have been removed from team ${team.name}`,
      type: 'team',
      relatedId: team._id,
      relatedType: 'team'
    });

    res.json({ success: true, data: team });
  } catch (err) {
    console.error('removeMember error', err);
    res.status(500).json({ success: false, message: 'Failed to remove member' });
  }
};

exports.leaveTeam = async (req, res) => {
  try {
    const team = await ProductionTeam.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (String(team.owner) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Owner cannot leave their own team' });
    }

    const before = team.members.length;
    team.members = team.members.filter((m) => String(m.user) !== String(req.user._id));
    await team.save();

    if (before === team.members.length) {
      return res.status(404).json({ success: false, message: 'You are not a member of this team' });
    }

    await createNotification({
      user: team.owner,
      title: 'Member left team',
      message: `${req.user.name || 'A member'} left ${team.name}`,
      type: 'team',
      relatedId: team._id,
      relatedType: 'team'
    });

    res.json({ success: true, data: team });
  } catch (err) {
    console.error('leaveTeam error', err);
    res.status(500).json({ success: false, message: 'Failed to leave team' });
  }
};
