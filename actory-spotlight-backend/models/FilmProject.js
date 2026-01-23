const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
      minlength: [2, 'Role name must be at least 2 characters'],
    },
    roleType: {
      type: String,
      enum: ['Lead', 'Supporting', 'Guest', 'Extra'],
      default: 'Supporting'
    },
    ageMin: {
      type: Number,
      min: [1, 'Minimum age must be at least 1'],
      max: [120, 'Maximum age cannot exceed 120'],
    },
    ageMax: {
      type: Number,
      min: [1, 'Minimum age must be at least 1'],
      max: [120, 'Maximum age cannot exceed 120'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Any'],
      default: 'Any'
    },
    physicalTraits: { type: String, maxlength: 300 },
    skillsRequired: [String],
    experienceLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Professional'],
      default: 'Beginner'
    },
    roleDescription: { type: String, maxlength: 500 },
    numberOfOpenings: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 opening required']
    },
    castingCallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CastingCall'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const FilmProjectSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductionTeam',
      required: true
    },
    name: {
      type: String,
      required: true,
      maxlength: 150
    },
    genre: { type: String, maxlength: 60 },
    language: { type: String, maxlength: 60 },
    location: { type: String, maxlength: 120 },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String, maxlength: 800 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    roles: [RoleSchema],
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft'
    }
  },
  {
    timestamps: true
  }
);

FilmProjectSchema.index({ team: 1 });
FilmProjectSchema.index({ collaborators: 1 });

module.exports = mongoose.model('FilmProject', FilmProjectSchema);
