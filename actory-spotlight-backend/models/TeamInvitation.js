const mongoose = require('mongoose');
const crypto = require('crypto');

const TeamInvitationSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionTeam',
      required: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    invitee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FilmProject'
    },
    role: {
      type: String,
      enum: ['Recruiter', 'Viewer'],
      default: 'Recruiter'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending'
    },
    token: {
      type: String,
      default: () => crypto.randomBytes(16).toString('hex'),
      index: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

TeamInvitationSchema.index({ invitee: 1, status: 1 });
TeamInvitationSchema.index({ team: 1, status: 1 });

module.exports = mongoose.model('TeamInvitation', TeamInvitationSchema);
