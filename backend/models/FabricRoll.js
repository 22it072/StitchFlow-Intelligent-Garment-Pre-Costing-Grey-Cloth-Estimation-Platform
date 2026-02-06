// backend/models/FabricRoll.js
const mongoose = require('mongoose');

const fabricRollSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  rollNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
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
  loom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loom',
    required: [true, 'Loom is required'],
  },
  warpBeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WarpBeam',
    default: null,
  },
  length: {
    type: Number,
    required: [true, 'Length is required'],
    min: [0.1, 'Length must be greater than 0'],
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative'],
    default: null,
  },
  gsm: {
    type: Number,
    min: [0, 'GSM cannot be negative'],
    default: null,
  },
  width: {
    type: Number,
    min: [0, 'Width cannot be negative'],
    default: null,
  },
  dateProduced: {
    type: Date,
    required: [true, 'Production date is required'],
    default: Date.now,
  },
  shift: {
    type: String,
    enum: ['day', 'night', 'morning', 'evening', 'general'],
    default: 'general',
  },
  status: {
    type: String,
    enum: ['stored', 'dispatched', 'rejected', 'processing', 'returned'],
    default: 'stored',
  },
  storageLocation: {
    type: String,
    trim: true,
    default: 'Main Godown',
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'Reject'],
    default: 'A',
  },
  defects: [{
    type: String,
    trim: true,
  }],
  dispatchDetails: {
    dispatchDate: { type: Date, default: null },
    buyer: { type: String, default: null },
    invoiceNumber: { type: String, default: null },
    vehicleNumber: { type: String, default: null },
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

// Unique roll number per company
fabricRollSchema.index({ company: 1, rollNumber: 1 }, { unique: true });
fabricRollSchema.index({ company: 1, status: 1 });
fabricRollSchema.index({ company: 1, loom: 1 });
fabricRollSchema.index({ company: 1, dateProduced: -1 });
fabricRollSchema.index({ company: 1, quality: 1 });

// Rolls are immutable after creation - only status can change
fabricRollSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified()) {
    const modifiedPaths = this.modifiedPaths();
    const allowedModifications = ['status', 'dispatchDetails', 'storageLocation', 'remarks', 'updatedAt'];
    
    for (const path of modifiedPaths) {
      if (!allowedModifications.some(allowed => path.startsWith(allowed))) {
        const err = new Error(`Cannot modify ${path}. Fabric rolls are immutable after creation.`);
        err.statusCode = 400;
        return next(err);
      }
    }
  }
  next();
});

module.exports = mongoose.model('FabricRoll', fabricRollSchema);