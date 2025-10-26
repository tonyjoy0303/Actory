const mongoose = require('mongoose');

const CastingCallSchema = new mongoose.Schema({
  roleTitle: {
    type: String,
    required: [true, 'Please add a role title'],
    trim: true,
    minlength: [2, 'Role title must be at least 2 characters long'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  ageRange: {
    min: {
      type: Number,
      required: [true, 'Please provide minimum age'],
      min: [1, 'Minimum age must be at least 1'],
      max: [120, 'Minimum age cannot exceed 120'],
    },
    max: {
      type: Number,
      required: [true, 'Please provide maximum age'],
      min: [1, 'Maximum age must be at least 1'],
      max: [120, 'Maximum age cannot exceed 120'],
      validate: {
        validator: function(v) {
          return v >= this.ageRange.min;
        },
        message: 'Maximum age must be greater than or equal to minimum age',
      },
    },
  },
  genderRequirement: {
    type: String,
    required: [true, 'Please specify gender requirement'],
    enum: {
      values: ['male', 'female', 'any', 'other'],
      message: 'Gender requirement must be one of: male, female, any, other',
    },
  },
  experienceLevel: {
    type: String,
    required: [true, 'Please specify required experience level'],
    enum: {
      values: ['beginner', 'intermediate', 'professional'],
      message: 'Experience level must be one of: beginner, intermediate, professional',
    },
  },
  // Height requirement (in cm)
  heightRange: {
    min: {
      type: Number,
      required: false,
      min: [50, 'Minimum height must be at least 50 cm'],
      max: [300, 'Minimum height cannot exceed 300 cm'],
    },
    max: {
      type: Number,
      required: false,
      min: [50, 'Maximum height must be at least 50 cm'],
      max: [300, 'Maximum height cannot exceed 300 cm'],
      validate: {
        validator: function (v) {
          // only validate if both present
          if (typeof v !== 'number') return true;
          if (typeof this.heightRange?.min !== 'number') return true;
          return v >= this.heightRange.min;
        },
        message: 'Maximum height must be greater than or equal to minimum height',
      },
    },
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
    trim: true,
  },
  numberOfOpenings: {
    type: Number,
    required: [true, 'Please specify number of openings'],
    min: [1, 'Number of openings must be at least 1'],
  },
  skills: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'Please add at least one required skill',
    },
  },
  auditionDate: {
    type: Date,
    required: [true, 'Please add an audition date'],
    validate: {
      validator: function (v) {
        return v && v >= new Date();
      },
      message: 'Audition date cannot be in the past',
    },
  },
  submissionDeadline: {
    type: Date,
    required: [true, 'Please add a submission deadline'],
    validate: {
      validator: function(v) {
        return v && v >= new Date() && v <= this.auditionDate;
      },
      message: 'Submission deadline must be in the future and before the audition date',
    },
  },
  shootStartDate: {
    type: Date,
    required: [true, 'Please add a shooting start date'],
    validate: {
      validator: function (v) {
        return v && v >= this.auditionDate;
      },
      message: 'Shooting start date must be on or after the audition date',
    },
  },
  shootEndDate: {
    type: Date,
    required: [true, 'Please add a shooting end date'],
    validate: {
      validator: function (v) {
        return v && v >= this.shootStartDate;
      },
      message: 'Shooting end date must be on or after the shooting start date',
    },
  },
  producer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Order validation helper
function validateDates(submissionDeadline, auditionDate, shootStartDate, shootEndDate) {
  const now = new Date();
  
  if (submissionDeadline < now) {
    return 'Submission deadline cannot be in the past';
  }
  if (submissionDeadline > auditionDate) {
    return 'Submission deadline must be before the audition date';
  }
  if (shootStartDate < auditionDate) {
    return 'Shooting start date must be on or after the audition date';
  }
  if (shootEndDate < shootStartDate) {
    return 'Shooting end date must be on or after the shooting start date';
  }
  return null;
}

// Ensure date ordering on create/save
CastingCallSchema.pre('save', function (next) {
  const errMsg = validateDates(
    this.submissionDeadline,
    this.auditionDate,
    this.shootStartDate,
    this.shootEndDate
  );
  if (errMsg) return next(new Error(errMsg));
  next();
});

// Ensure date ordering on update
CastingCallSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate() || {};
    const set = update.$set || {};

    // Load current doc
    const current = await this.model.findOne(this.getQuery()).lean();
    if (!current) return next();

    // Get existing or updated values
    const submissionDeadline = set.submissionDeadline ?? update.submissionDeadline ?? current.submissionDeadline;
    const auditionDate = set.auditionDate ?? update.auditionDate ?? current.auditionDate;
    const shootStartDate = set.shootStartDate ?? update.shootStartDate ?? current.shootStartDate;
    const shootEndDate = set.shootEndDate ?? update.shootEndDate ?? current.shootEndDate;

    const errMsg = validateDates(
      new Date(submissionDeadline),
      new Date(auditionDate),
      new Date(shootStartDate),
      new Date(shootEndDate)
    );
    
    if (errMsg) return next(new Error(errMsg));
    next();
  } catch (e) {
    next(e);
  }
});

// TTL index to automatically remove casting calls after shoot end date passes
CastingCallSchema.index({ shootEndDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('CastingCall', CastingCallSchema);