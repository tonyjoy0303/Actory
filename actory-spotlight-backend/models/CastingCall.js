const mongoose = require('mongoose');

const CastingCallSchema = new mongoose.Schema({
  roleName: {
    type: String,
    required: [true, 'Please add a role name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  ageRange: {
    type: String,
    required: [true, 'Please add an age range'],
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
  },
  skills: {
    type: [String],
    required: true,
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
  shootingStartDate: {
    type: Date,
    required: [true, 'Please add a shooting start date'],
    validate: {
      validator: function (v) {
        return v && v >= new Date();
      },
      message: 'Shooting start date cannot be in the past',
    },
  },
  shootingEndDate: {
    type: Date,
    required: [true, 'Please add a shooting end date'],
    validate: {
      validator: function (v) {
        return v && v >= new Date();
      },
      message: 'Shooting end date cannot be in the past',
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
function validateOrder(auditionDate, shootingStartDate, shootingEndDate) {
  if (!auditionDate || !shootingStartDate || !shootingEndDate) return null;
  if (shootingStartDate < auditionDate) {
    return 'Shooting start date must be on or after the audition date';
  }
  if (shootingEndDate < shootingStartDate) {
    return 'Shooting end date must be on or after the shooting start date';
  }
  return null;
}

// Ensure ordering on create/save
CastingCallSchema.pre('save', function (next) {
  const errMsg = validateOrder(this.auditionDate, this.shootingStartDate, this.shootingEndDate);
  if (errMsg) return next(new Error(errMsg));
  next();
});

// Ensure ordering on findOneAndUpdate (e.g., findByIdAndUpdate)
CastingCallSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate() || {};
    const set = update.$set || {};

    // Load current doc
    const current = await this.model.findOne(this.getQuery()).lean();
    if (!current) return next();

    const auditionDate = set.auditionDate ?? update.auditionDate ?? current.auditionDate;
    const shootingStartDate = set.shootingStartDate ?? update.shootingStartDate ?? current.shootingStartDate;
    const shootingEndDate = set.shootingEndDate ?? update.shootingEndDate ?? current.shootingEndDate;

    const errMsg = validateOrder(auditionDate, shootingStartDate, shootingEndDate);
    if (errMsg) return next(new Error(errMsg));

    // Also prevent setting any of the dates into the past on update
    const now = new Date();
    if ((auditionDate && auditionDate < now) || (shootingStartDate && shootingStartDate < now) || (shootingEndDate && shootingEndDate < now)) {
      return next(new Error('Dates cannot be in the past'));
    }

    next();
  } catch (e) {
    next(e);
  }
});

// TTL index to automatically remove casting calls after audition date passes
// Note: TTL removal is handled by MongoDB in the background (approx. 60s granularity)
// and does not trigger Mongoose middleware. If you need cascading deletions,
// implement a separate cleanup job for related data (e.g., Videos).
CastingCallSchema.index({ auditionDate: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('CastingCall', CastingCallSchema);