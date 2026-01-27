const mongoose = require('mongoose');

const yarnSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: [true, 'Please add a yarn name'],
      trim: true,
    },
    denier: {
      type: Number,
      required: [true, 'Please add denier value'],
      min: 0,
    },
    price: {
      type: Number,
      required: [true, 'Please add yarn price'],
      min: 0,
    },
    gstPercentage: {
      type: Number,
      required: [true, 'Please add GST percentage'],
      default: 5,
      min: 0,
      max: 100,
    },
    yarnType: {
      type: String,
      required: [true, 'Please select yarn type'],
      enum: ['warp', 'weft', 'weft-2', 'all'],
    },
    color: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for price with GST
yarnSchema.virtual('priceWithGst').get(function () {
  return this.price + (this.price * this.gstPercentage) / 100;
});

// Ensure virtuals are included in JSON
yarnSchema.set('toJSON', { virtuals: true });
yarnSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Yarn', yarnSchema);