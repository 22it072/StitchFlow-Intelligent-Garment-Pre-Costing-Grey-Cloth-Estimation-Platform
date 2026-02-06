// backend/routes/warpBeamRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  verifyCompanyMembership,
  requirePermission
} = require('../middleware/rbacMiddleware');
const {
  getWarpBeams,
  getWarpBeam,
  createWarpBeam,
  updateWarpBeam,
  deleteWarpBeam,
  assignToLoom,
  removeFromLoom,
  consumeLength,
  getWarpBeamStats
} = require('../controllers/warpBeamController');

// All routes require authentication and company membership
router.use(protect);
router.use(verifyCompanyMembership);

// Stats route
router.get('/stats', requirePermission('warpBeams:view'), getWarpBeamStats);

// CRUD routes
router.route('/')
  .get(requirePermission('warpBeams:view'), getWarpBeams)
  .post(requirePermission('warpBeams:create'), createWarpBeam);

router.route('/:id')
  .get(requirePermission('warpBeams:view'), getWarpBeam)
  .put(requirePermission('warpBeams:edit'), updateWarpBeam)
  .delete(requirePermission('warpBeams:delete'), deleteWarpBeam);

// Beam operations
router.post('/:id/assign', requirePermission('warpBeams:assign'), assignToLoom);
router.post('/:id/remove', requirePermission('warpBeams:assign'), removeFromLoom);
router.post('/:id/consume', requirePermission('warpBeams:consume'), consumeLength);

module.exports = router;