// backend/routes/productionLogRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  verifyCompanyMembership,
  requirePermission
} = require('../middleware/rbacMiddleware');
const {
  getProductionLogs,
  getProductionLog,
  createProductionLog,
  updateProductionLog,
  deleteProductionLog,
  getProductionLogStats
} = require('../controllers/productionLogController');

// All routes require authentication and company membership
router.use(protect);
router.use(verifyCompanyMembership);

// Stats route
router.get('/stats', requirePermission('productionLogs:view'), getProductionLogStats);

// CRUD routes
router.route('/')
  .get(requirePermission('productionLogs:view'), getProductionLogs)
  .post(requirePermission('productionLogs:create'), createProductionLog);

router.route('/:id')
  .get(requirePermission('productionLogs:view'), getProductionLog)
  .put(requirePermission('productionLogs:edit'), updateProductionLog)
  .delete(requirePermission('productionLogs:delete'), deleteProductionLog);

module.exports = router;