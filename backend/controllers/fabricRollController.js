// backend/controllers/fabricRollController.js
const FabricRoll = require('../models/FabricRoll');
const Loom = require('../models/Loom');
const ProductionLog = require('../models/ProductionLog');
const { generateRollNumber, calculateGSM } = require('../utils/weavingCalculations');

/**
 * @desc    Get all fabric rolls
 * @route   GET /api/fabric-rolls
 * @access  Private
 */
const getFabricRolls = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      loom,
      quality,
      grade,
      startDate,
      endDate,
      sortBy = 'dateProduced',
      order = 'desc'
    } = req.query;
    
    let query = { company: req.companyId };
    
    if (status) query.status = status;
    if (loom) query.loom = loom;
    if (quality) query.quality = quality;
    if (grade) query.grade = grade;
    
    if (startDate || endDate) {
      query.dateProduced = {};
      if (startDate) query.dateProduced.$gte = new Date(startDate);
      if (endDate) query.dateProduced.$lte = new Date(endDate);
    }
    
    const sortOrder = order === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [rolls, total] = await Promise.all([
      FabricRoll.find(query)
        .populate('loom', 'loomCode loomType')
        .populate('quality', 'qualityName')
        .populate('warpBeam', 'beamNumber')
        .populate('createdBy', 'name')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      FabricRoll.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: rolls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get fabric rolls error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fabric rolls',
      error: error.message
    });
  }
};

/**
 * @desc    Get single fabric roll
 * @route   GET /api/fabric-rolls/:id
 * @access  Private
 */
const getFabricRoll = async (req, res) => {
  try {
    const roll = await FabricRoll.findOne({
      _id: req.params.id,
      company: req.companyId
    })
      .populate('loom')
      .populate('quality')
      .populate('warpBeam')
      .populate('createdBy', 'name email')
      .lean();
    
    if (!roll) {
      return res.status(404).json({
        success: false,
        message: 'Fabric roll not found'
      });
    }
    
    res.json({
      success: true,
      data: roll
    });
  } catch (error) {
    console.error('Get fabric roll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fabric roll',
      error: error.message
    });
  }
};

/**
 * @desc    Create fabric roll
 * @route   POST /api/fabric-rolls
 * @access  Private (Editor+)
 */
const createFabricRoll = async (req, res) => {
  try {
    const {
      rollNumber,
      qualityId,
      qualityName,
      loomId,
      warpBeamId,
      length,
      weight,
      width,
      dateProduced,
      shift,
      grade,
      defects,
      storageLocation,
      remarks
    } = req.body;
    
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
    
    // Generate roll number if not provided
    let finalRollNumber = rollNumber;
    if (!finalRollNumber) {
      const count = await FabricRoll.countDocuments({ company: req.companyId });
      // Get company code for roll number
      const Company = require('../models/Company');
      const company = await Company.findById(req.companyId);
      finalRollNumber = generateRollNumber(company?.companyCode || 'ROLL', count + 1);
    }
    
    // Check for duplicate roll number
    const existingRoll = await FabricRoll.findOne({
      company: req.companyId,
      rollNumber: finalRollNumber.toUpperCase()
    });
    
    if (existingRoll) {
      return res.status(400).json({
        success: false,
        message: `Roll number ${finalRollNumber} already exists`
      });
    }
    
    // Calculate GSM if weight and dimensions provided
    let calculatedGSM = null;
    if (weight && length && width) {
      calculatedGSM = calculateGSM(weight, length, width);
    }
    
    const roll = await FabricRoll.create({
      company: req.companyId,
      rollNumber: finalRollNumber.toUpperCase(),
      quality: qualityId || null,
      qualityName: qualityName || loom.currentQualityName || 'Unknown',
      loom: loomId,
      warpBeam: warpBeamId || loom.currentWarpBeam || null,
      length,
      weight,
      width,
      gsm: calculatedGSM,
      dateProduced: dateProduced ? new Date(dateProduced) : new Date(),
      shift: shift || 'general',
      grade: grade || 'A',
      defects: defects || [],
      storageLocation: storageLocation || 'Main Godown',
      remarks,
      createdBy: req.user._id
    });
    
    const populatedRoll = await FabricRoll.findById(roll._id)
      .populate('loom', 'loomCode')
      .populate('warpBeam', 'beamNumber')
      .lean();
    
    res.status(201).json({
      success: true,
      data: populatedRoll
    });
  } catch (error) {
    console.error('Create fabric roll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating fabric roll',
      error: error.message
    });
  }
};

/**
 * @desc    Update fabric roll status
 * @route   PATCH /api/fabric-rolls/:id/status
 * @access  Private (Editor+)
 */
const updateRollStatus = async (req, res) => {
  try {
    const { status, storageLocation, remarks } = req.body;
    
    const roll = await FabricRoll.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!roll) {
      return res.status(404).json({
        success: false,
        message: 'Fabric roll not found'
      });
    }
    
    if (status) roll.status = status;
    if (storageLocation !== undefined) roll.storageLocation = storageLocation;
    if (remarks !== undefined) roll.remarks = remarks;
    
    await roll.save();
    
    res.json({
      success: true,
      data: roll
    });
  } catch (error) {
    console.error('Update roll status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating roll status',
      error: error.message
    });
  }
};

/**
 * @desc    Dispatch fabric roll
 * @route   POST /api/fabric-rolls/:id/dispatch
 * @access  Private (Editor+)
 */
const dispatchRoll = async (req, res) => {
  try {
    const { buyer, invoiceNumber, vehicleNumber, dispatchDate, remarks } = req.body;
    
    const roll = await FabricRoll.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!roll) {
      return res.status(404).json({
        success: false,
        message: 'Fabric roll not found'
      });
    }
    
    if (roll.status === 'dispatched') {
      return res.status(400).json({
        success: false,
        message: 'Roll is already dispatched'
      });
    }
    
    roll.status = 'dispatched';
    roll.dispatchDetails = {
      dispatchDate: dispatchDate ? new Date(dispatchDate) : new Date(),
      buyer,
      invoiceNumber,
      vehicleNumber
    };
    if (remarks) roll.remarks = remarks;
    
    await roll.save();
    
    res.json({
      success: true,
      data: roll
    });
  } catch (error) {
    console.error('Dispatch roll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error dispatching roll',
      error: error.message
    });
  }
};

/**
 * @desc    Get fabric roll statistics
 * @route   GET /api/fabric-rolls/stats
 * @access  Private
 */
const getFabricRollStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const mongoose = require('mongoose');
    
    let match = { company: new mongoose.Types.ObjectId(req.companyId) };
    
    if (startDate || endDate) {
      match.dateProduced = {};
      if (startDate) match.dateProduced.$gte = new Date(startDate);
      if (endDate) match.dateProduced.$lte = new Date(endDate);
    }
    
    // Overall stats
    const stats = await FabricRoll.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRolls: { $sum: 1 },
          totalLength: { $sum: '$length' },
          totalWeight: { $sum: '$weight' },
          avgLength: { $avg: '$length' },
          avgWeight: { $avg: '$weight' },
          storedRolls: { $sum: { $cond: [{ $eq: ['$status', 'stored'] }, 1, 0] } },
          dispatchedRolls: { $sum: { $cond: [{ $eq: ['$status', 'dispatched'] }, 1, 0] } },
          rejectedRolls: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);
    
    // By grade
    const byGrade = await FabricRoll.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
          totalLength: { $sum: '$length' },
          totalWeight: { $sum: '$weight' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // By loom
    const byLoom = await FabricRoll.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$loom',
          count: { $sum: 1 },
          totalLength: { $sum: '$length' }
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
          count: 1,
          totalLength: 1
        }
      },
      { $sort: { totalLength: -1 } }
    ]);
    
    // Daily production trend
    const dailyTrend = await FabricRoll.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateProduced' } },
          rolls: { $sum: 1 },
          totalLength: { $sum: '$length' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalRolls: 0,
          totalLength: 0,
          totalWeight: 0,
          avgLength: 0,
          avgWeight: 0,
          storedRolls: 0,
          dispatchedRolls: 0,
          rejectedRolls: 0
        },
        byGrade,
        byLoom,
        dailyTrend
      }
    });
  } catch (error) {
    console.error('Get fabric roll stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fabric roll statistics',
      error: error.message
    });
  }
};

module.exports = {
  getFabricRolls,
  getFabricRoll,
  createFabricRoll,
  updateRollStatus,
  dispatchRoll,
  getFabricRollStats
};