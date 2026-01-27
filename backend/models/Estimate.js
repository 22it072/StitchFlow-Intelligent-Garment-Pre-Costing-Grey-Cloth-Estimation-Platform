const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  versionNumber: Number,
  data: Object,
  editedAt: {
    type: Date,
    default: Date.now,
  },
  editedBy: String,
});

const estimateSchema = new mongoose.Schema(
  {
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
      tar: { type: Number, required: true },
      denier: { type: Number, required: true },
      wastage: { type: Number, required: true },
      yarnId: { type: mongoose.Schema.Types.ObjectId, ref: 'Yarn' },
      yarnName: String,
      yarnPrice: Number,
      yarnGst: Number,
      rawWeight: Number,
      formattedWeight: Number,
      rawCost: Number,
      formattedCost: Number,
    },
    
    // Weft Section
    weft: {
      peek: { type: Number, required: true },
      panna: { type: Number, required: true },
      denier: { type: Number, required: true },
      wastage: { type: Number, required: true },
      yarnId: { type: mongoose.Schema.Types.ObjectId, ref: 'Yarn' },
      yarnName: String,
      yarnPrice: Number,
      yarnGst: Number,
      rawWeight: Number,
      formattedWeight: Number,
      rawCost: Number,
      formattedCost: Number,
    },
    
    // Optional Weft-2 Section
    weft2Enabled: {
      type: Boolean,
      default: false,
    },
    weft2: {
      peek: Number,
      panna: Number,
      denier: Number,
      wastage: Number,
      yarnId: { type: mongoose.Schema.Types.ObjectId, ref: 'Yarn' },
      yarnName: String,
      yarnPrice: Number,
      yarnGst: Number,
      rawWeight: Number,
      formattedWeight: Number,
      rawCost: Number,
      formattedCost: Number,
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
  }
);

// Index for search
estimateSchema.index({ qualityName: 'text', notes: 'text', tags: 'text' });

module.exports = mongoose.model('Estimate', estimateSchema);