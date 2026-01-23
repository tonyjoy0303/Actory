const TeamInvitation = require('../models/TeamInvitation');
const ProductionTeam = require('../models/ProductionTeam');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationService');

const isOwner = (team, userId) => String(team.owner) === String(userId);

exports.sendInvitation = async (req, res) => {
  try {
    const { teamId, inviteeEmail, inviteeId, role = 'Recruiter', projectId } = req.body || {};
    if (!teamId || (!inviteeEmail && !inviteeId)) {
      return res.status(400).json({ success: false, message: 'teamId and invitee identifier are required' });
    }

    const team = await ProductionTeam.findById(teamId);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (!isOwner(team, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only team owner can invite' });
    }

    const invitee = inviteeId
      ? await User.findById(inviteeId)
      : await User.findOne({ email: inviteeEmail });
    if (!invitee) return res.status(404).json({ success: false, message: 'Invitee not found' });

    const alreadyMember = String(team.owner) === String(invitee._id) ||
      team.members.some((m) => String(m.user) === String(invitee._id));
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already in the team' });
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invitation = await TeamInvitation.create({
      team: team._id,
      invitedBy: req.user._id,
      invitee: invitee._id,
      role,
      project: projectId,
      expiresAt
    });

    await createNotification({
      user: invitee._id,
      title: 'Team invitation',
      message: `You have been invited to join ${team.name} as ${role}`,
      type: 'invite',
      relatedId: invitation._id,
      relatedType: 'team-invitation',
      metadata: { teamId: team._id, role }
    });

    res.status(201).json({ success: true, data: invitation });
  } catch (err) {
    console.error('sendInvitation error', err);
    res.status(500).json({ success: false, message: 'Failed to send invitation' });
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { token, invitationId } = req.body || {};
    if (!token && !invitationId) return res.status(400).json({ success: false, message: 'Token or Invitation ID is required' });

    let invitation;
    if (token) {
      invitation = await TeamInvitation.findOne({ token, status: 'pending' }).populate('team');
    } else if (invitationId) {
      invitation = await TeamInvitation.findOne({ _id: invitationId, status: 'pending' }).populate('team');
    }
    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found' });
    if (String(invitation.invitee) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not your invitation' });
    }
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ success: false, message: 'Invitation expired' });
    }

    const team = invitation.team;
    const alreadyMember = String(team.owner) === String(req.user._id) ||
      team.members.some((m) => String(m.user) === String(req.user._id));
    if (!alreadyMember) {
      team.members.push({ user: req.user._id, role: invitation.role });
      await team.save();
    }

    invitation.status = 'accepted';
    await invitation.save();

    await createNotification({
      user: invitation.invitedBy,
      title: 'Invitation accepted',
      message: `${req.user.name || 'User'} accepted your invite to ${team.name}`,
      type: 'invite',
      relatedId: invitation._id,
      relatedType: 'team-invitation'
    });

    res.json({ success: true, data: { teamId: team._id, invitationId: invitation._id } });
  } catch (err) {
    console.error('acceptInvitation error', err);
    res.status(500).json({ success: false, message: 'Failed to accept invitation' });
  }
};

exports.rejectInvitation = async (req, res) => {
  try {
    const { token, invitationId } = req.body || {};
    if (!token && !invitationId) return res.status(400).json({ success: false, message: 'Token or Invitation ID is required' });

    let invitation;
    if (token) {
      invitation = await TeamInvitation.findOne({ token, status: 'pending' });
    } else if (invitationId) {
      invitation = await TeamInvitation.findOne({ _id: invitationId, status: 'pending' });
    }
    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found' });
    if (String(invitation.invitee) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not your invitation' });
    }
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ success: false, message: 'Invitation expired' });
    }

    invitation.status = 'rejected';
    await invitation.save();

    await createNotification({
      user: invitation.invitedBy,
      title: 'Invitation rejected',
      message: `${req.user.name || 'User'} rejected your invite`,
      type: 'invite',
      relatedId: invitation._id,
      relatedType: 'team-invitation'
    });

    res.json({ success: true, data: { invitationId: invitation._id } });
  } catch (err) {
    console.error('rejectInvitation error', err);
    res.status(500).json({ success: false, message: 'Failed to reject invitation' });
  }
};

exports.getMyInvitations = async (req, res) => {
  try {
    const invitations = await TeamInvitation.find({ invitee: req.user._id, status: 'pending' })
      .populate('team', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: invitations });
  } catch (err) {
    console.error('getMyInvitations error', err);
    res.status(500).json({ success: false, message: 'Failed to fetch invitations' });
  }
};
