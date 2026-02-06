// backend/routes/yarnStockRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  verifyCompanyMembership,
  requirePermission
} = require('../middleware/rbacMiddleware');
const {
  getYarnStocks,
  getYarnStock,
  createYarnStock,
  receiveYarnStock,
  issueYarnStock,
  returnYarnStock,
  recordWastage,
  getYarnStockStats,
  getTransactions
} = require('../controllers/yarnStockController');

// All routes require authentication and company membership
router.use(protect);
router.use(verifyCompanyMembership);

// Stats route
router.get('/stats', requirePermission('yarnStock:view'), getYarnStockStats);

// CRUD routes
router.route('/')
  .get(requirePermission('yarnStock:view'), getYarnStocks)
  .post(requirePermission('yarnStock:create'), createYarnStock);

router.route('/:id')
  .get(requirePermission('yarnStock:view'), getYarnStock);

// Stock operations
router.post('/:id/receive', requirePermission('yarnStock:receive'), receiveYarnStock);
router.post('/:id/issue', requirePermission('yarnStock:issue'), issueYarnStock);
router.post('/:id/return', requirePermission('yarnStock:return'), returnYarnStock);
router.post('/:id/wastage', requirePermission('yarnStock:issue'), recordWastage);

// Transactions
router.get('/:id/transactions', requirePermission('yarnStock:view'), getTransactions);

module.exports = router;