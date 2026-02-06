// backend/routes/fabricRollRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  verifyCompanyMembership,
  requirePermission
} = require('../middleware/rbacMiddleware');
const {
  getFabricRolls,
  getFabricRoll,
  createFabricRoll,
  updateRollStatus,
  dispatchRoll,
  getFabricRollStats
} = require('../controllers/fabricRollController');

// All routes require authentication and company membership
router.use(protect);
router.use(verifyCompanyMembership);

// Stats route
router.get('/stats', requirePermission('fabricRolls:view'), getFabricRollStats);

// CRUD routes
router.route('/')
  .get(requirePermission('fabricRolls:view'), getFabricRolls)
  .post(requirePermission('fabricRolls:create'), createFabricRoll);

router.route('/:id')
  .get(requirePermission('fabricRolls:view'), getFabricRoll);

// Roll operations
router.patch('/:id/status', requirePermission('fabricRolls:dispatch'), updateRollStatus);
router.post('/:id/dispatch', requirePermission('fabricRolls:dispatch'), dispatchRoll);

module.exports = router;