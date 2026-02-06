// backend/models/YarnStock.js
const mongoose = require('mongoose');

const yarnStockSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  yarn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Yarn',
    required: [true, 'Yarn reference is required'],
  },
  openingStock: {
    type: Number,
    required: true,
    min: [0, 'Opening stock cannot be negative'],
    default: 0,
  },
  receivedStock: {
    type: Number,
    min: [0, 'Received stock cannot be negative'],
    default: 0,
  },
  issuedStock: {
    type: Number,
    min: [0, 'Issued stock cannot be negative'],
    default: 0,
  },
  returnedStock: {
    type: Number,
    min: [0, 'Returned stock cannot be negative'],
    default: 0,
  },
  closingStock: {
    type: Number,
    default: 0,
  },
  unit: {
    type: String,
    enum: ['kg', 'cones', 'bags'],
    default: 'kg',
  },
  location: {
    type: String,
    trim: true,
    default: 'Main Store',
  },
  minStockLevel: {
    type: Number,
    min: 0,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// One stock record per yarn per company
yarnStockSchema.index({ company: 1, yarn: 1 }, { unique: true });
yarnStockSchema.index({ company: 1, closingStock: 1 });

// Pre-save to calculate closing stock
yarnStockSchema.pre('save', function(next) {
  this.closingStock = this.openingStock + this.receivedStock - this.issuedStock + this.returnedStock;
  
  // Prevent negative stock
  if (this.closingStock < 0) {
    const err = new Error('Closing stock cannot be negative. Not enough yarn in stock.');
    err.statusCode = 400;
    return next(err);
  }
  
  this.lastUpdated = new Date();
  next();
});

// Virtual to check if stock is low
yarnStockSchema.virtual('isLowStock').get(function() {
  return this.closingStock <= this.minStockLevel;
});

yarnStockSchema.set('toJSON', { virtuals: true });
yarnStockSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('YarnStock', yarnStockSchema);