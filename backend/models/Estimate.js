// backend/models/Estimate.js
const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  versionNumber: Number,
  data: mongoose.Schema.Types.Mixed,
  editedAt: {
    type: Date,
    default: Date.now,
  },
  editedBy: String,
}, { _id: false });

const yarnDetailsSchema = new mongoose.Schema({
  yarnId: { type: mongoose.Schema.Types.ObjectId, ref: 'Yarn' },
  yarnName: String,
  displayName: String,
  denier: Number,
  yarnCategory: { type: String, enum: ['spun', 'filament'], default: 'spun' },
  tpm: Number,
  filamentCount: Number,
  yarnPrice: Number,
  yarnGst: Number,
}, { _id: false, strict: false });

const estimateSchema = new mongoose.Schema(
  {
    // UPDATED: Add company field for multi-tenancy
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    qualityName: {
      type: String,
      required: [true, 'Please add a quality/cloth name'],
      trim: true,
    },
    
    // Warp Section
    warp: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    
    // Weft Section
    weft: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    
    // Optional Weft-2 Section
    weft2Enabled: {
      type: Boolean,
      default: false,
    },
    weft2: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    // Other Cost
    otherCostPerMeter: {
      type: Number,
      default: 0,
    },
    
    // Totals
    totalWeight: Number,
    totalCost: Number,
    
    // Metadata
    notes: String,
    tags: [String],
    
    // Version History
    versions: [versionSchema],
    currentVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

// UPDATED: Compound indexes for company-scoped queries
estimateSchema.index({ company: 1, user: 1 });
estimateSchema.index({ company: 1, qualityName: 'text', notes: 'text' });
estimateSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('Estimate', estimateSchema);