// backend/models/WastageLog.js
const mongoose = require('mongoose');

const wastageLogSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  yarn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Yarn',
    required: true,
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
  issuedQuantity: {
    type: Number,
    required: true,
    min: [0, 'Issued quantity cannot be negative'],
  },
  actualConsumption: {
    type: Number,
    required: true,
    min: [0, 'Actual consumption cannot be negative'],
  },
  wastageQuantity: {
    type: Number,
    required: true,
  },
  wastagePercentage: {
    type: Number,
    required: true,
  },
  wastageType: {
    type: String,
    enum: ['warp', 'weft', 'sizing', 'breakage', 'other'],
    default: 'other',
  },
  reason: {
    type: String,
    trim: true,
    default: null,
  },
  remarks: {
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

wastageLogSchema.index({ company: 1, date: -1 });
wastageLogSchema.index({ company: 1, yarn: 1 });
wastageLogSchema.index({ company: 1, loom: 1 });
wastageLogSchema.index({ company: 1, wastageType: 1 });

module.exports = mongoose.model('WastageLog', wastageLogSchema);