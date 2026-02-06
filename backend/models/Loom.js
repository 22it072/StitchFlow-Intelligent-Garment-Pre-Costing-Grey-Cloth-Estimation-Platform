// backend/models/Loom.js
const mongoose = require('mongoose');

const loomSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  loomCode: {
    type: String,
    required: [true, 'Loom code is required'],
    trim: true,
    uppercase: true,
  },
  loomType: {
    type: String,
    required: [true, 'Loom type is required'],
    enum: ['powerloom', 'rapier', 'airjet', 'waterjet', 'projectile', 'shuttle'],
  },
  ratedRPM: {
    type: Number,
    required: [true, 'Rated RPM is required'],
    min: [1, 'RPM must be greater than 0'],
  },
  standardEfficiency: {
    type: Number,
    required: [true, 'Standard efficiency is required'],
    min: [0, 'Efficiency cannot be negative'],
    max: [100, 'Efficiency cannot exceed 100%'],
    default: 85,
  },
  assignedOperator: {
    type: String,
    trim: true,
    default: null,
  },
  status: {
    type: String,
    enum: ['running', 'idle', 'maintenance', 'breakdown'],
    default: 'idle',
  },
  currentWarpBeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WarpBeam',
    default: null,
  },
  currentQuality: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estimate',
    default: null,
  },
  currentQualityName: {
    type: String,
    trim: true,
    default: null,
  },
  lastMaintenanceDate: {
    type: Date,
    default: null,
  },
  nextMaintenanceDate: {
    type: Date,
    default: null,
  },
  totalMetersProduc: {
    type: Number,
    default: 0,
    min: 0,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Compound unique index for loom code per company
loomSchema.index({ company: 1, loomCode: 1 }, { unique: true });
loomSchema.index({ company: 1, status: 1 });
loomSchema.index({ company: 1, loomType: 1 });
loomSchema.index({ company: 1, isActive: 1 });

// Virtual for display name
loomSchema.virtual('displayName').get(function() {
  return `${this.loomCode} (${this.loomType.charAt(0).toUpperCase() + this.loomType.slice(1)})`;
});

loomSchema.set('toJSON', { virtuals: true });
loomSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Loom', loomSchema);