// backend/models/WarpBeam.js
const mongoose = require('mongoose');

const warpBeamSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  beamNumber: {
    type: String,
    required: [true, 'Beam number is required'],
    trim: true,
    uppercase: true,
  },
  yarn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Yarn',
    default: null,
  },
  yarnDetails: {
    type: String,
    trim: true,
  },
  totalLength: {
    type: Number,
    required: [true, 'Total length is required'],
    min: [1, 'Total length must be greater than 0'],
  },
  lengthConsumed: {
    type: Number,
    min: [0, 'Consumed length cannot be negative'],
    default: 0,
  },
  remainingLength: {
    type: Number,
    min: [0, 'Remaining length cannot be negative'],
  },
  loom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loom',
    default: null,
  },
  quality: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estimate',
    default: null,
  },
  qualityName: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['ready', 'in_use', 'finished', 'removed', 'damaged'],
    default: 'ready',
  },
  loadDate: {
    type: Date,
    default: null,
  },
  finishDate: {
    type: Date,
    default: null,
  },
  totalEnds: {
    type: Number,
    min: 0,
    default: null,
  },
  reedSpace: {
    type: Number,
    min: 0,
    default: null,
  },
  alertThreshold: {
    type: Number,
    min: 0,
    default: 100, // Alert when remaining < 100 meters
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Unique beam number per company
warpBeamSchema.index({ company: 1, beamNumber: 1 }, { unique: true });
warpBeamSchema.index({ company: 1, status: 1 });
warpBeamSchema.index({ company: 1, loom: 1 });

// Pre-save to calculate remaining length
warpBeamSchema.pre('save', function(next) {
  this.remainingLength = Math.max(0, this.totalLength - this.lengthConsumed);
  
  // Auto-update status if finished
  if (this.remainingLength <= 0 && this.status === 'in_use') {
    this.status = 'finished';
    this.finishDate = new Date();
  }
  
  next();
});

// Virtual to check if near finish
warpBeamSchema.virtual('isNearFinish').get(function() {
  return this.status === 'in_use' && this.remainingLength <= this.alertThreshold;
});

// Virtual for consumption percentage
warpBeamSchema.virtual('consumptionPercentage').get(function() {
  if (this.totalLength === 0) return 0;
  return Math.round((this.lengthConsumed / this.totalLength) * 100);
});

warpBeamSchema.set('toJSON', { virtuals: true });
warpBeamSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('WarpBeam', warpBeamSchema);