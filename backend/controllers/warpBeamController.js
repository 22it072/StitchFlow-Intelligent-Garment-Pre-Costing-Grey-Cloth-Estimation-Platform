// backend/controllers/warpBeamController.js
const WarpBeam = require('../models/WarpBeam');
const Loom = require('../models/Loom');
const { generateBeamNumber } = require('../utils/weavingCalculations');

/**
 * @desc    Get all warp beams
 * @route   GET /api/warp-beams
 * @access  Private
 */
const getWarpBeams = async (req, res) => {
  try {
    const { status, loom, nearFinish, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    let query = { company: req.companyId };
    
    if (status) query.status = status;
    if (loom) query.loom = loom;
    
    const sortOrder = order === 'desc' ? -1 : 1;
    
    let beams = await WarpBeam.find(query)
      .populate('yarn', 'name displayName')
      .populate('loom', 'loomCode loomType')
      .populate('quality', 'qualityName')
      .sort({ [sortBy]: sortOrder })
      .lean();
    
    // Filter near finish if requested
    if (nearFinish === 'true') {
      beams = beams.filter(b => b.isNearFinish);
    }
    
    res.json({
      success: true,
      data: beams,
      count: beams.length
    });
  } catch (error) {
    console.error('Get warp beams error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warp beams',
      error: error.message
    });
  }
};

/**
 * @desc    Get single warp beam
 * @route   GET /api/warp-beams/:id
 * @access  Private
 */
const getWarpBeam = async (req, res) => {
  try {
    const beam = await WarpBeam.findOne({
      _id: req.params.id,
      company: req.companyId
    })
      .populate('yarn')
      .populate('loom')
      .populate('quality')
      .populate('createdBy', 'name email')
      .lean();
    
    if (!beam) {
      return res.status(404).json({
        success: false,
        message: 'Warp beam not found'
      });
    }
    
    res.json({
      success: true,
      data: beam
    });
  } catch (error) {
    console.error('Get warp beam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warp beam',
      error: error.message
    });
  }
};

/**
 * @desc    Create warp beam
 * @route   POST /api/warp-beams
 * @access  Private (Editor+)
 */
const createWarpBeam = async (req, res) => {
  try {
    const {
      beamNumber,
      yarnId,
      yarnDetails,
      totalLength,
      totalEnds,
      reedSpace,
      qualityId,
      qualityName,
      alertThreshold,
      notes
    } = req.body;
    
    // Generate beam number if not provided
    let finalBeamNumber = beamNumber;
    if (!finalBeamNumber) {
      const count = await WarpBeam.countDocuments({ company: req.companyId });
      finalBeamNumber = generateBeamNumber(count + 1);
    }
    
    // Check for duplicate beam number
    const existingBeam = await WarpBeam.findOne({
      company: req.companyId,
      beamNumber: finalBeamNumber.toUpperCase()
    });
    
    if (existingBeam) {
      return res.status(400).json({
        success: false,
        message: `Beam number ${finalBeamNumber} already exists`
      });
    }
    
    const beam = await WarpBeam.create({
      company: req.companyId,
      beamNumber: finalBeamNumber.toUpperCase(),
      yarn: yarnId || null,
      yarnDetails,
      totalLength,
      totalEnds,
      reedSpace,
      quality: qualityId || null,
      qualityName,
      alertThreshold: alertThreshold || 100,
      notes,
      createdBy: req.user._id
    });
    
    const populatedBeam = await WarpBeam.findById(beam._id)
      .populate('yarn', 'name displayName')
      .lean();
    
    res.status(201).json({
      success: true,
      data: populatedBeam
    });
  } catch (error) {
    console.error('Create warp beam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating warp beam',
      error: error.message
    });
  }
};

/**
 * @desc    Update warp beam
 * @route   PUT /api/warp-beams/:id
 * @access  Private (Editor+)
 */
const updateWarpBeam = async (req, res) => {
  try {
    const beam = await WarpBeam.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!beam) {
      return res.status(404).json({
        success: false,
        message: 'Warp beam not found'
      });
    }
    
    // Cannot modify beam if in use (except for certain fields)
    if (beam.status === 'in_use') {
      const allowedFields = ['alertThreshold', 'notes', 'qualityName'];
      const requestFields = Object.keys(req.body);
      const invalidFields = requestFields.filter(f => !allowedFields.includes(f));
      
      if (invalidFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot modify ${invalidFields.join(', ')} while beam is in use`
        });
      }
    }
    
    const {
      yarnId,
      yarnDetails,
      totalLength,
      totalEnds,
      reedSpace,
      qualityId,
      qualityName,
      status,
      alertThreshold,
      notes
    } = req.body;
    
    if (yarnId !== undefined) beam.yarn = yarnId;
    if (yarnDetails !== undefined) beam.yarnDetails = yarnDetails;
    if (totalLength !== undefined) beam.totalLength = totalLength;
    if (totalEnds !== undefined) beam.totalEnds = totalEnds;
    if (reedSpace !== undefined) beam.reedSpace = reedSpace;
    if (qualityId !== undefined) beam.quality = qualityId;
    if (qualityName !== undefined) beam.qualityName = qualityName;
    if (status !== undefined) beam.status = status;
    if (alertThreshold !== undefined) beam.alertThreshold = alertThreshold;
    if (notes !== undefined) beam.notes = notes;
    
    await beam.save();
    
    res.json({
      success: true,
      data: beam
    });
  } catch (error) {
    console.error('Update warp beam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating warp beam',
      error: error.message
    });
  }
};

/**
 * @desc    Delete warp beam
 * @route   DELETE /api/warp-beams/:id
 * @access  Private (Admin+)
 */
const deleteWarpBeam = async (req, res) => {
  try {
    const beam = await WarpBeam.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!beam) {
      return res.status(404).json({
        success: false,
        message: 'Warp beam not found'
      });
    }
    
    if (beam.status === 'in_use') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete beam while in use. Remove from loom first.'
      });
    }
    
    await beam.deleteOne();
    
    res.json({
      success: true,
      message: 'Warp beam deleted successfully'
    });
  } catch (error) {
    console.error('Delete warp beam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting warp beam',
      error: error.message
    });
  }
};

/**
 * @desc    Assign beam to loom
 * @route   POST /api/warp-beams/:id/assign
 * @access  Private (Editor+)
 */
const assignToLoom = async (req, res) => {
  try {
    const { loomId, qualityId, qualityName } = req.body;
    
    const beam = await WarpBeam.findOne({
      _id: req.params.id,
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
    
    if (loom.currentWarpBeam) {
      return res.status(400).json({
        success: false,
        message: 'Loom already has an active warp beam'
      });
    }
    
    // Update beam
    beam.loom = loomId;
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
      data: { beam, loom }
    });
  } catch (error) {
    console.error('Assign beam to loom error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning beam to loom',
      error: error.message
    });
  }
};

/**
 * @desc    Remove beam from loom
 * @route   POST /api/warp-beams/:id/remove
 * @access  Private (Editor+)
 */
const removeFromLoom = async (req, res) => {
  try {
    const { markAsFinished = false } = req.body;
    
    const beam = await WarpBeam.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!beam) {
      return res.status(404).json({
        success: false,
        message: 'Warp beam not found'
      });
    }
    
    if (beam.status !== 'in_use') {
      return res.status(400).json({
        success: false,
        message: 'Beam is not currently in use'
      });
    }
    
    // Update loom
    if (beam.loom) {
      const loom = await Loom.findById(beam.loom);
      if (loom) {
        loom.currentWarpBeam = null;
        loom.currentQuality = null;
        loom.currentQualityName = null;
        await loom.save();
      }
    }
    
    // Update beam
    beam.loom = null;
    beam.status = markAsFinished ? 'finished' : 'removed';
    if (markAsFinished) beam.finishDate = new Date();
    await beam.save();
    
    res.json({
      success: true,
      data: beam
    });
  } catch (error) {
    console.error('Remove beam from loom error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing beam from loom',
      error: error.message
    });
  }
};

/**
 * @desc    Consume warp length
 * @route   POST /api/warp-beams/:id/consume
 * @access  Private (Editor+)
 */
const consumeLength = async (req, res) => {
  try {
    const { meters } = req.body;
    
    if (!meters || meters <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Meters must be greater than 0'
      });
    }
    
    const beam = await WarpBeam.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!beam) {
      return res.status(404).json({
        success: false,
        message: 'Warp beam not found'
      });
    }
    
    beam.lengthConsumed += meters;
    await beam.save();
    
    res.json({
      success: true,
      data: beam,
      alert: beam.isNearFinish ? 'Warp beam is near finish!' : null
    });
  } catch (error) {
    console.error('Consume warp length error:', error);
    res.status(500).json({
      success: false,
      message: 'Error consuming warp length',
      error: error.message
    });
  }
};

/**
 * @desc    Get warp beam statistics
 * @route   GET /api/warp-beams/stats
 * @access  Private
 */
const getWarpBeamStats = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    const stats = await WarpBeam.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(req.companyId) } },
      {
        $group: {
          _id: null,
          totalBeams: { $sum: 1 },
          readyBeams: { $sum: { $cond: [{ $eq: ['$status', 'ready'] }, 1, 0] } },
          inUseBeams: { $sum: { $cond: [{ $eq: ['$status', 'in_use'] }, 1, 0] } },
          finishedBeams: { $sum: { $cond: [{ $eq: ['$status', 'finished'] }, 1, 0] } },
          totalLength: { $sum: '$totalLength' },
          totalConsumed: { $sum: '$lengthConsumed' },
          totalRemaining: { $sum: '$remainingLength' }
        }
      }
    ]);
    
    // Get beams near finish
    const nearFinishBeams = await WarpBeam.find({
      company: req.companyId,
      status: 'in_use',
      $expr: { $lte: ['$remainingLength', '$alertThreshold'] }
    })
      .populate('loom', 'loomCode')
      .lean();
    
    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalBeams: 0,
          readyBeams: 0,
          inUseBeams: 0,
          finishedBeams: 0,
          totalLength: 0,
          totalConsumed: 0,
          totalRemaining: 0
        },
        nearFinishBeams,
        nearFinishCount: nearFinishBeams.length
      }
    });
  } catch (error) {
    console.error('Get warp beam stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching warp beam statistics',
      error: error.message
    });
  }
};

module.exports = {
  getWarpBeams,
  getWarpBeam,
  createWarpBeam,
  updateWarpBeam,
  deleteWarpBeam,
  assignToLoom,
  removeFromLoom,
  consumeLength,
  getWarpBeamStats
};