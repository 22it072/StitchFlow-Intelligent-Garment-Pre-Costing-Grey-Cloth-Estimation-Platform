// backend/models/YarnTransaction.js
const mongoose = require('mongoose');

const yarnTransactionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true,
  },
  yarn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Yarn',
    required: true,
  },
  yarnStock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'YarnStock',
    required: true,
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['opening', 'received', 'issued', 'returned', 'adjustment', 'wastage'],
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.001, 'Quantity must be greater than 0'],
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  // For issued transactions - linked to production
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
  productionDate: {
    type: Date,
    default: null,
  },
  // For received transactions
  supplier: {
    type: String,
    trim: true,
    default: null,
  },
  invoiceNumber: {
    type: String,
    trim: true,
    default: null,
  },
  rate: {
    type: Number,
    min: 0,
    default: null,
  },
  // Common fields
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

yarnTransactionSchema.index({ company: 1, yarn: 1, date: -1 });
yarnTransactionSchema.index({ company: 1, transactionType: 1 });
yarnTransactionSchema.index({ company: 1, loom: 1 });
yarnTransactionSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('YarnTransaction', yarnTransactionSchema);