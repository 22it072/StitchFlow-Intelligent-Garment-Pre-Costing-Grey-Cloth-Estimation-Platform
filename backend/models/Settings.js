const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      unique: true,
    },
    defaultGstPercentage: {
      type: Number,
      default: 5,
    },
    weightDecimalPrecision: {
      type: Number,
      default: 4,
      min: 1,
      max: 6,
    },
    costDecimalPrecision: {
      type: Number,
      default: 2,
      min: 1,
      max: 4,
    },
    enableWeft2ByDefault: {
      type: Boolean,
      default: false,
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
    currencyCode: {
      type: String,
      default: 'INR',
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY',
    },
    autoSaveInterval: {
      type: Number,
      default: 30, // seconds
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);