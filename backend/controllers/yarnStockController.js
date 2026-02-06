// backend/controllers/yarnStockController.js
const YarnStock = require('../models/YarnStock');
const YarnTransaction = require('../models/YarnTransaction');
const Yarn = require('../models/Yarn');
const WastageLog = require('../models/WastageLog');
const { calculateYarnWastage, validateYarnStockTransaction } = require('../utils/weavingCalculations');

/**
 * @desc    Get all yarn stocks
 * @route   GET /api/yarn-stocks
 * @access  Private
 */
const getYarnStocks = async (req, res) => {
  try {
    const { lowStock, search, sortBy = 'yarn', order = 'asc' } = req.query;
    
    let query = { company: req.companyId };
    
    const sortOrder = order === 'desc' ? -1 : 1;
    
    let stocks = await YarnStock.find(query)
      .populate('yarn', 'name denier displayName yarnType yarnCategory')
      .populate('lastUpdatedBy', 'name')
      .sort({ [sortBy]: sortOrder })
      .lean();
    
    // Filter low stock if requested
    if (lowStock === 'true') {
      stocks = stocks.filter(s => s.closingStock <= s.minStockLevel);
    }
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      stocks = stocks.filter(s => 
        s.yarn?.name?.toLowerCase().includes(searchLower) ||
        s.yarn?.displayName?.toLowerCase().includes(searchLower)
      );
    }
    
    res.json({
      success: true,
      data: stocks,
      count: stocks.length
    });
  } catch (error) {
    console.error('Get yarn stocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching yarn stocks',
      error: error.message
    });
  }
};

/**
 * @desc    Get single yarn stock with transactions
 * @route   GET /api/yarn-stocks/:id
 * @access  Private
 */
const getYarnStock = async (req, res) => {
  try {
    const stock = await YarnStock.findOne({
      _id: req.params.id,
      company: req.companyId
    })
      .populate('yarn')
      .populate('lastUpdatedBy', 'name email')
      .lean();
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Yarn stock not found'
      });
    }
    
    // Get recent transactions
    const transactions = await YarnTransaction.find({
      yarnStock: stock._id,
      company: req.companyId
    })
      .populate('loom', 'loomCode')
      .populate('createdBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(50)
      .lean();
    
    res.json({
      success: true,
      data: {
        ...stock,
        transactions
      }
    });
  } catch (error) {
    console.error('Get yarn stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching yarn stock',
      error: error.message
    });
  }
};

/**
 * @desc    Initialize yarn stock (Opening stock)
 * @route   POST /api/yarn-stocks
 * @access  Private (Editor+)
 */
const createYarnStock = async (req, res) => {
  try {
    const { yarnId, openingStock, unit, location, minStockLevel } = req.body;
    
    // Verify yarn exists
    const yarn = await Yarn.findOne({
      _id: yarnId,
      company: req.companyId
    });
    
    if (!yarn) {
      return res.status(404).json({
        success: false,
        message: 'Yarn not found'
      });
    }
    
    // Check if stock already exists for this yarn
    const existingStock = await YarnStock.findOne({
      company: req.companyId,
      yarn: yarnId
    });
    
    if (existingStock) {
      return res.status(400).json({
        success: false,
        message: 'Stock record already exists for this yarn. Use receive/issue instead.'
      });
    }
    
    // Create stock record
    const stock = await YarnStock.create({
      company: req.companyId,
      yarn: yarnId,
      openingStock: openingStock || 0,
      unit: unit || 'kg',
      location: location || 'Main Store',
      minStockLevel: minStockLevel || 0,
      lastUpdatedBy: req.user._id
    });
    
    // Create opening transaction
    if (openingStock > 0) {
      await YarnTransaction.create({
        company: req.companyId,
        yarn: yarnId,
        yarnStock: stock._id,
        transactionType: 'opening',
        quantity: openingStock,
        balanceBefore: 0,
        balanceAfter: openingStock,
        date: new Date(),
        remarks: 'Opening stock',
        createdBy: req.user._id
      });
    }
    
    const populatedStock = await YarnStock.findById(stock._id)
      .populate('yarn', 'name displayName')
      .lean();
    
    res.status(201).json({
      success: true,
      data: populatedStock
    });
  } catch (error) {
    console.error('Create yarn stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating yarn stock',
      error: error.message
    });
  }
};

/**
 * @desc    Receive yarn stock
 * @route   POST /api/yarn-stocks/:id/receive
 * @access  Private (Editor+)
 */
const receiveYarnStock = async (req, res) => {
  try {
    const { quantity, supplier, invoiceNumber, rate, date, remarks } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }
    
    const stock = await YarnStock.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Yarn stock not found'
      });
    }
    
    const balanceBefore = stock.closingStock;
    
    // Update stock
    stock.receivedStock += quantity;
    stock.lastUpdatedBy = req.user._id;
    await stock.save();
    
    // Create transaction
    await YarnTransaction.create({
      company: req.companyId,
      yarn: stock.yarn,
      yarnStock: stock._id,
      transactionType: 'received',
      quantity,
      balanceBefore,
      balanceAfter: stock.closingStock,
      date: date ? new Date(date) : new Date(),
      supplier,
      invoiceNumber,
      rate,
      remarks,
      createdBy: req.user._id
    });
    
    res.json({
      success: true,
      data: stock,
      message: `Received ${quantity} kg successfully`
    });
  } catch (error) {
    console.error('Receive yarn stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error receiving yarn stock',
      error: error.message
    });
  }
};

/**
 * @desc    Issue yarn stock
 * @route   POST /api/yarn-stocks/:id/issue
 * @access  Private (Editor+)
 */
const issueYarnStock = async (req, res) => {
  try {
    const { quantity, loomId, qualityId, productionDate, remarks } = req.body;
    
    const stock = await YarnStock.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Yarn stock not found'
      });
    }
    
    // Validate transaction
    const validation = validateYarnStockTransaction('issued', quantity, stock.closingStock);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      });
    }
    
    const balanceBefore = stock.closingStock;
    
    // Update stock
    stock.issuedStock += quantity;
    stock.lastUpdatedBy = req.user._id;
    await stock.save();
    
    // Create transaction
    await YarnTransaction.create({
      company: req.companyId,
      yarn: stock.yarn,
      yarnStock: stock._id,
      transactionType: 'issued',
      quantity,
      balanceBefore,
      balanceAfter: stock.closingStock,
      date: productionDate ? new Date(productionDate) : new Date(),
      loom: loomId || null,
      quality: qualityId || null,
      productionDate: productionDate ? new Date(productionDate) : null,
      remarks,
      createdBy: req.user._id
    });
    
    res.json({
      success: true,
      data: stock,
      message: `Issued ${quantity} kg successfully`
    });
  } catch (error) {
    console.error('Issue yarn stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error issuing yarn stock',
      error: error.message
    });
  }
};

/**
 * @desc    Return yarn stock
 * @route   POST /api/yarn-stocks/:id/return
 * @access  Private (Editor+)
 */
const returnYarnStock = async (req, res) => {
  try {
    const { quantity, loomId, remarks } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }
    
    const stock = await YarnStock.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Yarn stock not found'
      });
    }
    
    const balanceBefore = stock.closingStock;
    
    // Update stock
    stock.returnedStock += quantity;
    stock.lastUpdatedBy = req.user._id;
    await stock.save();
    
    // Create transaction
    await YarnTransaction.create({
      company: req.companyId,
      yarn: stock.yarn,
      yarnStock: stock._id,
      transactionType: 'returned',
      quantity,
      balanceBefore,
      balanceAfter: stock.closingStock,
      date: new Date(),
      loom: loomId || null,
      remarks,
      createdBy: req.user._id
    });
    
    res.json({
      success: true,
      data: stock,
      message: `Returned ${quantity} kg successfully`
    });
  } catch (error) {
    console.error('Return yarn stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error returning yarn stock',
      error: error.message
    });
  }
};

/**
 * @desc    Record wastage
 * @route   POST /api/yarn-stocks/:id/wastage
 * @access  Private (Editor+)
 */
const recordWastage = async (req, res) => {
  try {
    const {
      issuedQuantity,
      actualConsumption,
      loomId,
      qualityId,
      qualityName,
      wastageType,
      reason,
      remarks
    } = req.body;
    
    const stock = await YarnStock.findOne({
      _id: req.params.id,
      company: req.companyId
    });
    
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Yarn stock not found'
      });
    }
    
    // Calculate wastage
    const { wastageQuantity, wastagePercentage } = calculateYarnWastage(
      issuedQuantity,
      actualConsumption
    );
    
    // Create wastage log
    const wastageLog = await WastageLog.create({
      company: req.companyId,
      date: new Date(),
      yarn: stock.yarn,
      loom: loomId || null,
      quality: qualityId || null,
      qualityName,
      issuedQuantity,
      actualConsumption,
      wastageQuantity,
      wastagePercentage,
      wastageType: wastageType || 'other',
      reason,
      remarks,
      createdBy: req.user._id
    });
    
    // Create wastage transaction
    if (wastageQuantity > 0) {
      await YarnTransaction.create({
        company: req.companyId,
        yarn: stock.yarn,
        yarnStock: stock._id,
        transactionType: 'wastage',
        quantity: wastageQuantity,
        balanceBefore: stock.closingStock,
        balanceAfter: stock.closingStock, // Wastage doesn't affect stock (already issued)
        date: new Date(),
        loom: loomId || null,
        remarks: `Wastage: ${wastagePercentage.toFixed(2)}% - ${reason || 'No reason specified'}`,
        createdBy: req.user._id
      });
    }
    
    res.json({
      success: true,
      data: {
        wastageLog,
        wastageQuantity,
        wastagePercentage
      }
    });
  } catch (error) {
    console.error('Record wastage error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording wastage',
      error: error.message
    });
  }
};

/**
 * @desc    Get yarn stock statistics
 * @route   GET /api/yarn-stocks/stats
 * @access  Private
 */
const getYarnStockStats = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Overall stock stats
    const stats = await YarnStock.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(req.companyId) } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalOpeningStock: { $sum: '$openingStock' },
          totalReceived: { $sum: '$receivedStock' },
          totalIssued: { $sum: '$issuedStock' },
          totalReturned: { $sum: '$returnedStock' },
          totalClosingStock: { $sum: '$closingStock' }
        }
      }
    ]);
    
    // Low stock items
    const lowStockItems = await YarnStock.find({
      company: req.companyId,
      $expr: { $lte: ['$closingStock', '$minStockLevel'] }
    })
      .populate('yarn', 'name displayName')
      .lean();
    
    // Wastage stats
    const wastageStats = await WastageLog.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(req.companyId) } },
      {
        $group: {
          _id: null,
          totalWastageKg: { $sum: '$wastageQuantity' },
          avgWastagePercent: { $avg: '$wastagePercentage' },
          totalEntries: { $sum: 1 }
        }
      }
    ]);
    
    // Wastage by type
    const wastageByType = await WastageLog.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(req.companyId) } },
      {
        $group: {
          _id: '$wastageType',
          totalKg: { $sum: '$wastageQuantity' },
          avgPercent: { $avg: '$wastagePercentage' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalItems: 0,
          totalOpeningStock: 0,
          totalReceived: 0,
          totalIssued: 0,
          totalReturned: 0,
          totalClosingStock: 0
        },
        lowStockItems,
        lowStockCount: lowStockItems.length,
        wastage: wastageStats[0] || {
          totalWastageKg: 0,
          avgWastagePercent: 0,
          totalEntries: 0
        },
        wastageByType
      }
    });
  } catch (error) {
    console.error('Get yarn stock stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching yarn stock statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get transactions for a yarn
 * @route   GET /api/yarn-stocks/:id/transactions
 * @access  Private
 */
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, startDate, endDate } = req.query;
    
    let query = {
      yarnStock: req.params.id,
      company: req.companyId
    };
    
    if (type) query.transactionType = type;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [transactions, total] = await Promise.all([
      YarnTransaction.find(query)
        .populate('loom', 'loomCode')
        .populate('createdBy', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      YarnTransaction.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

module.exports = {
  getYarnStocks,
  getYarnStock,
  createYarnStock,
  receiveYarnStock,
  issueYarnStock,
  returnYarnStock,
  recordWastage,
  getYarnStockStats,
  getTransactions
};