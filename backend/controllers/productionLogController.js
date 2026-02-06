// backend/controllers/productionLogController.js
const ProductionLog = require('../models/ProductionLog');
const Loom = require('../models/Loom');
const WarpBeam = require('../models/WarpBeam');
const { validateProductionLogEntry, calculateActualEfficiency } = require('../utils/loomCalculations');

/**
 * @desc    Get all production logs
 * @route   GET /api/production-logs
 * @access  Private
 */
const getProductionLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      loom,
      quality,
      shift,
      startDate,
      endDate,
      operator,
      sortBy = 'date',
      order = 'desc'
    } = req.query;
    
    let query = { company: req.companyId };
    
    if (loom) query.loom = loom;
    if (quality) query.quality = quality;
    if (shift) query.shift = shift;
    if (operator) query.operator = { $regex: operator, $options: 'i' };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [logs, total] = await Promise.all([
      ProductionLog.find(query)
        .populate('loom', 'loomCode loomType')
        .populate('quality', 'qualityName')
        .populate('warpBeam', 'beamNumber')
        .populate('createdBy', 'name')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ProductionLog.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get production logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching production logs',
      error: error.message
    });
  }
};

/**
 * @desc    Get single production log
 * @route   GET /api/production-logs/:id
 * @access  Private
 */
const getProductionLog = async (req, res) => {
  try {
    const log = await ProductionLog.findOne({
      _id: req.params.id,
      company: req.companyId
    })
      .populate('loom')
      .populate('quality')
      .populate('warpBeam')
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .lean();
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Production log not found'
      });
    }
    
    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Get production log error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching production log',
      error: error.message
    });
  }
};

/**
 * @desc    Create production log entry
 * @route   POST /api/production-logs
 * @access  Private (Editor+)
 */
const createProductionLog = async (req, res) => {
  try {
    const {
      loom: loomId,
      quality,
      qualityName,
      date,
      shift,
      metersProduced,
      picks,
      actualRPM,
      actualEfficiency,
      operator,
      breakdownOccurred,
      breakdownMinutes,
      breakdownReason,
      remarks
    } = req.body;
    
    // Validate input
    const validation = validateProductionLogEntry(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }
    
    // Verify loom exists
    const loom = await Loom.findOne({
      _id: loomId,
      company: req.companyId
    });
    
    if (!loom) {
      return res.status(404).json({
        success: false,
        message: 'Loom not found'
      });
    }
    
    // Normalize date to start of day for comparison
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);
    
    // Check for duplicate entry (one entry per loom per shift per day)
    const existingLog = await ProductionLog.findOne({
      company: req.companyId,
      loom: loomId,
      date: logDate,
      shift
    });
    
    if (existingLog) {
      return res.status(400).json({
        success: false,
        message: `Production log already exists for ${loom.loomCode} on ${logDate.toDateString()} - ${shift} shift`
      });
    }
    
    // Calculate efficiency if not provided
    let calculatedEfficiency = actualEfficiency;
    if (!calculatedEfficiency && actualRPM && picks) {
      // Assuming 8-hour shift if not specified
      calculatedEfficiency = calculateActualEfficiency(metersProduced, actualRPM, 8, picks);
    }
    
    // Get current warp beam if loom has one
    let warpBeamId = null;
    if (loom.currentWarpBeam) {
      warpBeamId = loom.currentWarpBeam;
      
      // Update warp beam consumption
      const beam = await WarpBeam.findById(warpBeamId);
      if (beam) {
        beam.lengthConsumed += metersProduced;
        await beam.save();
      }
    }
    
    // Create production log
    const productionLog = await ProductionLog.create({
      company: req.companyId,
      loom: loomId,
      quality,
      qualityName: qualityName || loom.currentQualityName || 'Unknown',
      date: logDate,
      shift,
      metersProduced,
      picks,
      actualRPM,
      actualEfficiency: calculatedEfficiency,
      operator: operator || loom.assignedOperator,
      breakdownOccurred: breakdownOccurred || false,
      breakdownMinutes: breakdownMinutes || 0,
      breakdownReason,
      warpBeam: warpBeamId,
      warpConsumed: metersProduced, // Simplified - same as meters
      remarks,
      createdBy: req.user._id
    });
    
    // Update loom total production
    loom.totalMetersProduc = (loom.totalMetersProduc || 0) + metersProduced;
    await loom.save();
    
    // Populate and return
    const populatedLog = await ProductionLog.findById(productionLog._id)
      .populate('loom', 'loomCode loomType')
      .populate('warpBeam', 'beamNumber remainingLength')
      .lean();
    
    res.status(201).json({
      success: true,
      data: populatedLog
    });
  } catch (error) {
    console.error('Create production log error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Production log already exists for this loom, date, and shift'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating production log',
      error: error.message
    });
  }
};

/**
 * @desc    Update production log (Admin only - historical data protection)
 * @route   PUT /api/production-logs/:id
 * @access  Private (Admin+)
 */
const updateProductionLog = async (req, res) => {
  try {
    const log = await ProductionLog.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Production log not found'
      });
    }
    
    // Only allow certain fields to be updated
    const allowedUpdates = [
      'remarks', 'isVerified', 'verifiedBy', 'verifiedAt'
    ];
    
    // Admin can update more fields but with audit trail
    const adminUpdates = [
      'metersProduced', 'actualRPM', 'actualEfficiency', 
      'breakdownOccurred', 'breakdownMinutes', 'breakdownReason'
    ];
    
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    // Track verification
    if (req.body.isVerified && !log.isVerified) {
      updates.verifiedBy = req.user._id;
      updates.verifiedAt = new Date();
    }
    
    // Admin-only updates with meter adjustment
    const oldMeters = log.metersProduced;
    for (const field of adminUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    // If meters changed, update loom total
    if (updates.metersProduced !== undefined && updates.metersProduced !== oldMeters) {
      const loom = await Loom.findById(log.loom);
      if (loom) {
        loom.totalMetersProduc = (loom.totalMetersProduc || 0) - oldMeters + updates.metersProduced;
        await loom.save();
      }
      
      // Update warp beam if exists
      if (log.warpBeam) {
        const beam = await WarpBeam.findById(log.warpBeam);
        if (beam) {
          beam.lengthConsumed = beam.lengthConsumed - oldMeters + updates.metersProduced;
          await beam.save();
        }
      }
    }
    
    Object.assign(log, updates);
    await log.save();
    
    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Update production log error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating production log',
      error: error.message
    });
  }
};

/**
 * @desc    Delete production log (Admin only)
 * @route   DELETE /api/production-logs/:id
 * @access  Private (Admin+)
 */
const deleteProductionLog = async (req, res) => {
  try {
    const log = await ProductionLog.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Production log not found'
      });
    }
    
    // Reverse loom total
    const loom = await Loom.findById(log.loom);
    if (loom) {
      loom.totalMetersProduc = Math.max(0, (loom.totalMetersProduc || 0) - log.metersProduced);
      await loom.save();
    }
    
    // Reverse warp beam consumption
    if (log.warpBeam) {
      const beam = await WarpBeam.findById(log.warpBeam);
      if (beam) {
        beam.lengthConsumed = Math.max(0, beam.lengthConsumed - log.metersProduced);
        await beam.save();
      }
    }
    
    await log.deleteOne();
    
    res.json({
      success: true,
      message: 'Production log deleted successfully'
    });
  } catch (error) {
    console.error('Delete production log error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting production log',
      error: error.message
    });
  }
};

/**
 * @desc    Get production statistics
 * @route   GET /api/production-logs/stats
 * @access  Private
 */
const getProductionLogStats = async (req, res) => {
  try {
    const { startDate, endDate, loom } = req.query;
    const mongoose = require('mongoose');
    
    let match = { company: new mongoose.Types.ObjectId(req.companyId) };
    
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }
    
    if (loom) {
      match.loom = new mongoose.Types.ObjectId(loom);
    }
    
    // Overall stats
    const stats = await ProductionLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalMeters: { $sum: '$metersProduced' },
          avgMetersPerEntry: { $avg: '$metersProduced' },
          avgEfficiency: { $avg: '$actualEfficiency' },
          totalBreakdownMinutes: { $sum: '$breakdownMinutes' },
          breakdownEntries: {
            $sum: { $cond: ['$breakdownOccurred', 1, 0] }
          }
        }
      }
    ]);
    
    // By loom stats
    const byLoom = await ProductionLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$loom',
          totalMeters: { $sum: '$metersProduced' },
          avgEfficiency: { $avg: '$actualEfficiency' },
          entries: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'looms',
          localField: '_id',
          foreignField: '_id',
          as: 'loomInfo'
        }
      },
      { $unwind: '$loomInfo' },
      {
        $project: {
          loomCode: '$loomInfo.loomCode',
          loomType: '$loomInfo.loomType',
          totalMeters: 1,
          avgEfficiency: 1,
          entries: 1
        }
      },
      { $sort: { totalMeters: -1 } }
    ]);
    
    // Daily trend
    const dailyTrend = await ProductionLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalMeters: { $sum: '$metersProduced' },
          avgEfficiency: { $avg: '$actualEfficiency' },
          entries: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalEntries: 0,
          totalMeters: 0,
          avgMetersPerEntry: 0,
          avgEfficiency: 0,
          totalBreakdownMinutes: 0,
          breakdownEntries: 0
        },
        byLoom,
        dailyTrend
      }
    });
  } catch (error) {
    console.error('Get production log stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching production statistics',
      error: error.message
    });
  }
};

module.exports = {
  getProductionLogs,
  getProductionLog,
  createProductionLog,
  updateProductionLog,
  deleteProductionLog,
  getProductionLogStats
};