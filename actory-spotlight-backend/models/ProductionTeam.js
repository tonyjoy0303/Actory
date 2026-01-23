const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['Owner', 'Recruiter', 'Viewer'],
      default: 'Recruiter'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const ProductionTeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 120
    },
    productionHouse: {
      type: String,
      maxlength: 120
    },
    description: {
      type: String,
      maxlength: 500
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: {
      type: [MemberSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

ProductionTeamSchema.index({ owner: 1 });
ProductionTeamSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('ProductionTeam', ProductionTeamSchema);
