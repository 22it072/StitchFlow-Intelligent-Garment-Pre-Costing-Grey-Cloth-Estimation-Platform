// backend/models/ProductionLog.js
const mongoose = require('mongoose');

const productionLogSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  loom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loom',
    required: [true, 'Loom is required'],
  },
  quality: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estimate',
    default: null,
  },
  qualityName: {
    type: String,
    required: [true, 'Quality name is required'],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Production date is required'],
  },
  shift: {
    type: String,
    required: [true, 'Shift is required'],
    enum: ['day', 'night', 'morning', 'evening', 'general'],
  },
  metersProduced: {
    type: Number,
    required: [true, 'Meters produced is required'],
    min: [0, 'Meters cannot be negative'],
  },
  picks: {
    type: Number,
    min: [0, 'Picks cannot be negative'],
    default: null,
  },
  actualRPM: {
    type: Number,
    min: [0, 'RPM cannot be negative'],
    default: null,
  },
  actualEfficiency: {
    type: Number,
    min: [0, 'Efficiency cannot be negative'],
    max: [100, 'Efficiency cannot exceed 100%'],
    default: null,
  },
  operator: {
    type: String,
    trim: true,
    default: null,
  },
  breakdownOccurred: {
    type: Boolean,
    default: false,
  },
  breakdownMinutes: {
    type: Number,
    min: 0,
    default: 0,
  },
  breakdownReason: {
    type: String,
    trim: true,
    default: null,
  },
  warpBeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WarpBeam',
    default: null,
  },
  warpConsumed: {
    type: Number,
    min: 0,
    default: null,
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// CRITICAL: One entry per loom per shift per day - Never overwrite
productionLogSchema.index(
  { company: 1, loom: 1, date: 1, shift: 1 },
  { unique: true }
);
productionLogSchema.index({ company: 1, date: -1 });
productionLogSchema.index({ company: 1, loom: 1, date: -1 });
productionLogSchema.index({ company: 1, quality: 1 });
productionLogSchema.index({ company: 1, operator: 1 });

module.exports = mongoose.model('ProductionLog', productionLogSchema);