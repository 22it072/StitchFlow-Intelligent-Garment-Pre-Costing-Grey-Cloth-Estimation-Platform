// backend/controllers/loomController.js
const Loom = require('../models/Loom');
const ProductionLog = require('../models/ProductionLog');
const WarpBeam = require('../models/WarpBeam');
const { calculateLoomUtilization } = require('../utils/loomCalculations');

/**
 * @desc    Get all looms for company
 * @route   GET /api/looms
 * @access  Private
 */
const getLooms = async (req, res) => {
  try {
    const { status, type, active, search, sortBy = 'loomCode', order = 'asc' } = req.query;
    
    let query = { company: req.companyId };
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.loomType = type;
    }
    
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    if (search) {
      query.$or = [
        { loomCode: { $regex: search, $options: 'i' } },
        { assignedOperator: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOrder = order === 'desc' ? -1 : 1;
    
    const looms = await Loom.find(query)
      .populate('currentWarpBeam', 'beamNumber remainingLength status')
      .populate('currentQuality', 'qualityName')
      .sort({ [sortBy]: sortOrder })
      .lean();
    
    res.json({
      success: true,
      data: looms,
      count: looms.length
    });
  } catch (error) {
    console.error('Get looms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching looms',
      error: error.message
    });
  }
};

/**
 * @desc    Get single loom with details
 * @route   GET /api/looms/:id
 * @access  Private
 */
const getLoom = async (req, res) => {
  try {
    const loom = await Loom.findOne({
      _id: req.params.id,
      company: req.companyId
    })
      .populate('currentWarpBeam')
      .populate('currentQuality')
      .populate('createdBy', 'name email')
      .lean();
    
    if (!loom) {
      return res.status(404).json({
        success: false,
        message: 'Loom not found'
      });
    }
    
    // Get recent production logs for this loom
    const recentProduction = await ProductionLog.find({
      company: req.companyId,
      loom: loom._id
    })
      .sort({ date: -1 })
      .limit(10)
      .lean();
    
    res.json({
      success: true,
      data: {
        ...loom,
        recentProduction
      }
    });
  } catch (error) {
    console.error('Get loom error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching loom',
      error: error.message
    });
  }
};

/**
 * @desc    Create new loom
 * @route   POST /api/looms
 * @access  Private (Editor+)
 */
const createLoom = async (req, res) => {
  try {
    const {
      loomCode,
      loomType,
      ratedRPM,
      standardEfficiency,
      assignedOperator,
      notes
    } = req.body;
    
    // Check for duplicate loom code
    const existingLoom = await Loom.findOne({
      company: req.companyId,
      loomCode: loomCode.toUpperCase()
    });
    
    if (existingLoom) {
      return res.status(400).json({
        success: false,
        message: `Loom code ${loomCode} already exists`
      });
    }
    
    const loom = await Loom.create({
      company: req.companyId,
      loomCode: loomCode.toUpperCase(),
      loomType,
      ratedRPM,
      standardEfficiency: standardEfficiency || 85,
      assignedOperator,
      notes,
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      data: loom
    });
  } catch (error) {
    console.error('Create loom error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Loom code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating loom',
      error: error.message
    });
  }
};

/**
 * @desc    Update loom
 * @route   PUT /api/looms/:id
 * @access  Private (Editor+)
 */
const updateLoom = async (req, res) => {
  try {
    const loom = await Loom.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!loom) {
      return res.status(404).json({
        success: false,
        message: 'Loom not found'
      });
    }
    
    const {
      loomCode,
      loomType,
      ratedRPM,
      standardEfficiency,
      assignedOperator,
      status,
      notes,
      isActive
    } = req.body;
    
    // Check for duplicate if changing loom code
    if (loomCode && loomCode.toUpperCase() !== loom.loomCode) {
      const existingLoom = await Loom.findOne({
        company: req.companyId,
        loomCode: loomCode.toUpperCase(),
        _id: { $ne: loom._id }
      });
      
      if (existingLoom) {
        return res.status(400).json({
          success: false,
          message: `Loom code ${loomCode} already exists`
        });
      }
    }
    
    // Update fields
    if (loomCode) loom.loomCode = loomCode.toUpperCase();
    if (loomType) loom.loomType = loomType;
    if (ratedRPM !== undefined) loom.ratedRPM = ratedRPM;
    if (standardEfficiency !== undefined) loom.standardEfficiency = standardEfficiency;
    if (assignedOperator !== undefined) loom.assignedOperator = assignedOperator;
    if (status) loom.status = status;
    if (notes !== undefined) loom.notes = notes;
    if (isActive !== undefined) loom.isActive = isActive;
    
    // Track maintenance date
    if (status === 'maintenance' && loom.status !== 'maintenance') {
      loom.lastMaintenanceDate = new Date();
    }
    
    await loom.save();
    
    res.json({
      success: true,
      data: loom
    });
  } catch (error) {
    console.error('Update loom error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating loom',
      error: error.message
    });
  }
};

/**
 * @desc    Delete loom
 * @route   DELETE /api/looms/:id
 * @access  Private (Admin+)
 */
const deleteLoom = async (req, res) => {
  try {
    const loom = await Loom.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!loom) {
      return res.status(404).json({
        success: false,
        message: 'Loom not found'
      });
    }
    
    // Check if loom has production logs
    const hasLogs = await ProductionLog.exists({
      loom: loom._id,
      company: req.companyId
    });
    
    if (hasLogs) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete loom with production history. Deactivate it instead.'
      });
    }
    
    await loom.deleteOne();
    
    res.json({
      success: true,
      message: 'Loom deleted successfully'
    });
  } catch (error) {
    console.error('Delete loom error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting loom',
      error: error.message
    });
  }
};

/**
 * @desc    Update loom status
 * @route   PATCH /api/looms/:id/status
 * @access  Private (Editor+)
 */
const updateLoomStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    const loom = await Loom.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!loom) {
      return res.status(404).json({
        success: false,
        message: 'Loom not found'
      });
    }
    
    const previousStatus = loom.status;
    loom.status = status;
    
    // Track maintenance
    if (status === 'maintenance' && previousStatus !== 'maintenance') {
      loom.lastMaintenanceDate = new Date();
    }
    
    if (reason) {
      loom.notes = `Status changed: ${previousStatus} → ${status}. Reason: ${reason}`;
    }
    
    await loom.save();
    
    res.json({
      success: true,
      data: loom
    });
  } catch (error) {
    console.error('Update loom status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating loom status',
      error: error.message
    });
  }
};

/**
 * @desc    Assign warp beam to loom
 * @route   POST /api/looms/:id/assign-beam
 * @access  Private (Editor+)
 */
const assignWarpBeam = async (req, res) => {
  try {
    const { beamId, qualityId, qualityName } = req.body;
    
    const loom = await Loom.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!loom) {
      return res.status(404).json({
        success: false,
        message: 'Loom not found'
      });
    }
    
    // Check if loom already has an active beam
    if (loom.currentWarpBeam) {
      return res.status(400).json({
        success: false,
        message: 'Loom already has an active warp beam. Remove it first.'
      });
    }
    
    // Find and validate beam
    const beam = await WarpBeam.findOne({
      _id: beamId,
      company: req.companyId
    });
    
    if (!beam) {
      return res.status(404).json({
        success: false,
        message: 'Warp beam not found'
      });
    }
    
    if (beam.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: `Beam is not ready. Current status: ${beam.status}`
      });
    }
    
    // Assign beam to loom
    beam.loom = loom._id;
    beam.status = 'in_use';
    beam.loadDate = new Date();
    if (qualityId) beam.quality = qualityId;
    if (qualityName) beam.qualityName = qualityName;
    await beam.save();
    
    // Update loom
    loom.currentWarpBeam = beam._id;
    loom.currentQuality = qualityId;
    loom.currentQualityName = qualityName;
    await loom.save();
    
    res.json({
      success: true,
      data: {
        loom,
        beam
      }
    });
  } catch (error) {
    console.error('Assign warp beam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning warp beam',
      error: error.message
    });
  }
};

/**
 * @desc    Get loom statistics
 * @route   GET /api/looms/stats
 * @access  Private
 */
const getLoomStats = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Overall stats
    const stats = await Loom.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(req.companyId), isActive: true } },
      {
        $group: {
          _id: null,
          totalLooms: { $sum: 1 },
          runningLooms: {
            $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] }
          },
          idleLooms: {
            $sum: { $cond: [{ $eq: ['$status', 'idle'] }, 1, 0] }
          },
          maintenanceLooms: {
            $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] }
          },
          breakdownLooms: {
            $sum: { $cond: [{ $eq: ['$status', 'breakdown'] }, 1, 0] }
          },
          avgEfficiency: { $avg: '$standardEfficiency' },
          avgRPM: { $avg: '$ratedRPM' }
        }
      }
    ]);
    
    // By type stats
    const byType = await Loom.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(req.companyId), isActive: true } },
      {
        $group: {
          _id: '$loomType',
          count: { $sum: 1 },
          running: { $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] } }
        }
      }
    ]);
    
    const summary = stats[0] || {
      totalLooms: 0,
      runningLooms: 0,
      idleLooms: 0,
      maintenanceLooms: 0,
      breakdownLooms: 0,
      avgEfficiency: 0,
      avgRPM: 0
    };
    
    summary.utilization = calculateLoomUtilization(summary.runningLooms, summary.totalLooms);
    
    res.json({
      success: true,
      data: {
        summary,
        byType
      }
    });
  } catch (error) {
    console.error('Get loom stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching loom statistics',
      error: error.message
    });
  }
};

module.exports = {
  getLooms,
  getLoom,
  createLoom,
  updateLoom,
  deleteLoom,
  updateLoomStatus,
  assignWarpBeam,
  getLoomStats
};