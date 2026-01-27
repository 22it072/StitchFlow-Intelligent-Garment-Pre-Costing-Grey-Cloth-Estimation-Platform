const Estimate = require('../models/Estimate');
const Draft = require('../models/Draft');
const Yarn = require('../models/Yarn');
const { calculateEstimate } = require('../utils/calculations');

// @desc    Get all estimates for user
// @route   GET /api/estimates
// @access  Private
const getEstimates = async (req, res) => {
  try {
    const { search, sort, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    let query = { user: req.user._id };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'name') sortOption = { qualityName: 1 };
    if (sort === 'cost') sortOption = { totalCost: -1 };
    if (sort === 'weight') sortOption = { totalWeight: -1 };

    const skip = (page - 1) * limit;

    const estimates = await Estimate.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-versions');

    const total = await Estimate.countDocuments(query);
    
    res.json({
      estimates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get estimates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single estimate with full details
// @route   GET /api/estimates/:id
// @access  Private
const getEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('warp.yarnId weft.yarnId weft2.yarnId');

    if (!estimate) {
      return res.status(404).json({ message: 'Estimate not found' });
    }

    res.json(estimate);
  } catch (error) {
    console.error('Get estimate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create estimate
// @route   POST /api/estimates
// @access  Private
const createEstimate = async (req, res) => {
  try {
    const {
      qualityName,
      warp,
      weft,
      weft2Enabled,
      weft2,
      otherCostPerMeter,
      notes,
      tags,
    } = req.body;

    // Perform calculations
    const calcResults = calculateEstimate({
      warp,
      weft,
      weft2Enabled,
      weft2,
      otherCostPerMeter,
    });

    // Build estimate data
    const estimateData = {
      user: req.user._id,
      qualityName,
      warp: {
        tar: warp.tar,
        denier: warp.denier,
        wastage: warp.wastage,
        yarnId: warp.yarnId,
        yarnName: warp.yarnName,
        yarnPrice: warp.yarnPrice,
        yarnGst: warp.yarnGst,
        rawWeight: calcResults.warp.rawWeight,
        formattedWeight: calcResults.warp.formattedWeight,
        rawCost: calcResults.warp.rawCost,
        formattedCost: calcResults.warp.formattedCost,
      },
      weft: {
        peek: weft.peek,
        panna: weft.panna,
        denier: weft.denier,
        wastage: weft.wastage,
        yarnId: weft.yarnId,
        yarnName: weft.yarnName,
        yarnPrice: weft.yarnPrice,
        yarnGst: weft.yarnGst,
        rawWeight: calcResults.weft.rawWeight,
        formattedWeight: calcResults.weft.formattedWeight,
        rawCost: calcResults.weft.rawCost,
        formattedCost: calcResults.weft.formattedCost,
      },
      weft2Enabled,
      otherCostPerMeter: otherCostPerMeter || 0,
      totalWeight: calcResults.totals.totalWeight,
      totalCost: calcResults.totals.totalCost,
      notes,
      tags,
      currentVersion: 1,
    };

    // Add Weft-2 if enabled
    if (weft2Enabled && weft2 && calcResults.weft2) {
      estimateData.weft2 = {
        peek: weft2.peek,
        panna: weft2.panna,
        denier: weft2.denier,
        wastage: weft2.wastage,
        yarnId: weft2.yarnId,
        yarnName: weft2.yarnName,
        yarnPrice: weft2.yarnPrice,
        yarnGst: weft2.yarnGst,
        rawWeight: calcResults.weft2.rawWeight,
        formattedWeight: calcResults.weft2.formattedWeight,
        rawCost: calcResults.weft2.rawCost,
        formattedCost: calcResults.weft2.formattedCost,
      };
    }

    const estimate = await Estimate.create(estimateData);

    // Increment yarn usage counts
    if (warp.yarnId) {
      await Yarn.findByIdAndUpdate(warp.yarnId, { $inc: { usageCount: 1 } });
    }
    if (weft.yarnId) {
      await Yarn.findByIdAndUpdate(weft.yarnId, { $inc: { usageCount: 1 } });
    }
    if (weft2Enabled && weft2?.yarnId) {
      await Yarn.findByIdAndUpdate(weft2.yarnId, { $inc: { usageCount: 1 } });
    }

    // Clear any draft for this user
    await Draft.deleteOne({ user: req.user._id, formType: 'estimate' });

    res.status(201).json(estimate);
  } catch (error) {
    console.error('Create estimate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update estimate (with version history)
// @route   PUT /api/estimates/:id
// @access  Private
const updateEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!estimate) {
      return res.status(404).json({ message: 'Estimate not found' });
    }

    const {
      qualityName,
      warp,
      weft,
      weft2Enabled,
      weft2,
      otherCostPerMeter,
      notes,
      tags,
    } = req.body;

    // Save current version to history
    const currentVersion = {
      versionNumber: estimate.currentVersion,
      data: {
        qualityName: estimate.qualityName,
        warp: estimate.warp,
        weft: estimate.weft,
        weft2Enabled: estimate.weft2Enabled,
        weft2: estimate.weft2,
        otherCostPerMeter: estimate.otherCostPerMeter,
        totalWeight: estimate.totalWeight,
        totalCost: estimate.totalCost,
        notes: estimate.notes,
        tags: estimate.tags,
      },
      editedAt: new Date(),
    };

    // Perform new calculations
    const calcResults = calculateEstimate({
      warp,
      weft,
      weft2Enabled,
      weft2,
      otherCostPerMeter,
    });

    // Update fields
    estimate.qualityName = qualityName;
    estimate.warp = {
      tar: warp.tar,
      denier: warp.denier,
      wastage: warp.wastage,
      yarnId: warp.yarnId,
      yarnName: warp.yarnName,
      yarnPrice: warp.yarnPrice,
      yarnGst: warp.yarnGst,
      rawWeight: calcResults.warp.rawWeight,
      formattedWeight: calcResults.warp.formattedWeight,
      rawCost: calcResults.warp.rawCost,
      formattedCost: calcResults.warp.formattedCost,
    };
    estimate.weft = {
      peek: weft.peek,
      panna: weft.panna,
      denier: weft.denier,
      wastage: weft.wastage,
      yarnId: weft.yarnId,
      yarnName: weft.yarnName,
      yarnPrice: weft.yarnPrice,
      yarnGst: weft.yarnGst,
      rawWeight: calcResults.weft.rawWeight,
      formattedWeight: calcResults.weft.formattedWeight,
      rawCost: calcResults.weft.rawCost,
      formattedCost: calcResults.weft.formattedCost,
    };
    estimate.weft2Enabled = weft2Enabled;
    
    if (weft2Enabled && weft2 && calcResults.weft2) {
      estimate.weft2 = {
        peek: weft2.peek,
        panna: weft2.panna,
        denier: weft2.denier,
        wastage: weft2.wastage,
        yarnId: weft2.yarnId,
        yarnName: weft2.yarnName,
        yarnPrice: weft2.yarnPrice,
        yarnGst: weft2.yarnGst,
        rawWeight: calcResults.weft2.rawWeight,
        formattedWeight: calcResults.weft2.formattedWeight,
        rawCost: calcResults.weft2.rawCost,
        formattedCost: calcResults.weft2.formattedCost,
      };
    } else {
      estimate.weft2 = undefined;
    }

    estimate.otherCostPerMeter = otherCostPerMeter || 0;
    estimate.totalWeight = calcResults.totals.totalWeight;
    estimate.totalCost = calcResults.totals.totalCost;
    estimate.notes = notes;
    estimate.tags = tags;
    estimate.versions.push(currentVersion);
    estimate.currentVersion += 1;

    await estimate.save();
    res.json(estimate);
  } catch (error) {
    console.error('Update estimate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete estimate
// @route   DELETE /api/estimates/:id
// @access  Private
const deleteEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!estimate) {
      return res.status(404).json({ message: 'Estimate not found' });
    }

    await estimate.deleteOne();
    res.json({ message: 'Estimate removed' });
  } catch (error) {
    console.error('Delete estimate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Duplicate estimate
// @route   POST /api/estimates/:id/duplicate
// @access  Private
const duplicateEstimate = async (req, res) => {
  try {
    const estimate = await Estimate.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!estimate) {
      return res.status(404).json({ message: 'Estimate not found' });
    }

    const { newQualityName } = req.body;

    const duplicateData = {
      user: req.user._id,
      qualityName: newQualityName || `${estimate.qualityName} (Copy)`,
      warp: { ...estimate.warp.toObject() },
      weft: { ...estimate.weft.toObject() },
      weft2Enabled: estimate.weft2Enabled,
      weft2: estimate.weft2 ? { ...estimate.weft2.toObject() } : undefined,
      otherCostPerMeter: estimate.otherCostPerMeter,
      totalWeight: estimate.totalWeight,
      totalCost: estimate.totalCost,
      notes: estimate.notes,
      tags: estimate.tags,
      currentVersion: 1,
      versions: [],
    };

    // Remove _id from nested objects
    delete duplicateData.warp._id;
    delete duplicateData.weft._id;
    if (duplicateData.weft2) delete duplicateData.weft2._id;

    const newEstimate = await Estimate.create(duplicateData);
    res.status(201).json(newEstimate);
  } catch (error) {
    console.error('Duplicate estimate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Revert to previous version
// @route   POST /api/estimates/:id/revert/:version
// @access  Private
const revertVersion = async (req, res) => {
  try {
    const estimate = await Estimate.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!estimate) {
      return res.status(404).json({ message: 'Estimate not found' });
    }

    const versionNumber = parseInt(req.params.version);
    const targetVersion = estimate.versions.find(
      (v) => v.versionNumber === versionNumber
    );

    if (!targetVersion) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Save current state
    const currentVersion = {
      versionNumber: estimate.currentVersion,
      data: {
        qualityName: estimate.qualityName,
        warp: estimate.warp,
        weft: estimate.weft,
        weft2Enabled: estimate.weft2Enabled,
        weft2: estimate.weft2,
        otherCostPerMeter: estimate.otherCostPerMeter,
        totalWeight: estimate.totalWeight,
        totalCost: estimate.totalCost,
        notes: estimate.notes,
        tags: estimate.tags,
      },
      editedAt: new Date(),
    };
    estimate.versions.push(currentVersion);

    // Restore target version
    Object.assign(estimate, targetVersion.data);
    estimate.currentVersion += 1;

    await estimate.save();
    res.json(estimate);
  } catch (error) {
    console.error('Revert version error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Compare multiple estimates
// @route   POST /api/estimates/compare
// @access  Private
const compareEstimates = async (req, res) => {
  try {
    const { estimateIds } = req.body;

    if (!estimateIds || estimateIds.length < 2) {
      return res.status(400).json({ message: 'At least 2 estimates required for comparison' });
    }

    const estimates = await Estimate.find({
      _id: { $in: estimateIds },
      user: req.user._id,
    }).select('-versions');

    if (estimates.length !== estimateIds.length) {
      return res.status(404).json({ message: 'Some estimates not found' });
    }

    res.json(estimates);
  } catch (error) {
    console.error('Compare estimates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Save draft
// @route   POST /api/estimates/draft
// @access  Private
const saveDraft = async (req, res) => {
  try {
    const { formData } = req.body;

    await Draft.findOneAndUpdate(
      { user: req.user._id, formType: 'estimate' },
      { formData, lastSaved: new Date() },
      { upsert: true, new: true }
    );

    res.json({ message: 'Draft saved' });
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get draft
// @route   GET /api/estimates/draft
// @access  Private
const getDraft = async (req, res) => {
  try {
    const draft = await Draft.findOne({
      user: req.user._id,
      formType: 'estimate',
    });

    res.json(draft);
  } catch (error) {
    console.error('Get draft error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete draft
// @route   DELETE /api/estimates/draft
// @access  Private
const deleteDraft = async (req, res) => {
  try {
    await Draft.deleteOne({ user: req.user._id, formType: 'estimate' });
    res.json({ message: 'Draft deleted' });
  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Perform real-time calculation
// @route   POST /api/estimates/calculate
// @access  Private
const calculate = async (req, res) => {
  try {
    const { warp, weft, weft2Enabled, weft2, otherCostPerMeter } = req.body;

    const results = calculateEstimate({
      warp,
      weft,
      weft2Enabled,
      weft2,
      otherCostPerMeter,
    });

    res.json(results);
  } catch (error) {
    console.error('Calculate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getEstimates,
  getEstimate,
  createEstimate,
  updateEstimate,
  deleteEstimate,
  duplicateEstimate,
  revertVersion,
  compareEstimates,
  saveDraft,
  getDraft,
  deleteDraft,
  calculate,
};