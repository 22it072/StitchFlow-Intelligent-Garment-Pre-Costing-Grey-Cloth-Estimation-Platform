// backend/routes/loomRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  verifyCompanyMembership,
  requirePermission
} = require('../middleware/rbacMiddleware');
const {
  getLooms,
  getLoom,
  createLoom,
  updateLoom,
  deleteLoom,
  updateLoomStatus,
  assignWarpBeam,
  getLoomStats
} = require('../controllers/loomController');

// All routes require authentication and company membership
router.use(protect);
router.use(verifyCompanyMembership);

// Stats route (before :id to avoid conflict)
router.get('/stats', requirePermission('looms:view'), getLoomStats);

// CRUD routes
router.route('/')
  .get(requirePermission('looms:view'), getLooms)
  .post(requirePermission('looms:create'), createLoom);

router.route('/:id')
  .get(requirePermission('looms:view'), getLoom)
  .put(requirePermission('looms:edit'), updateLoom)
  .delete(requirePermission('looms:delete'), deleteLoom);

// Status management
router.patch('/:id/status', requirePermission('looms:manage_status'), updateLoomStatus);

// Beam assignment
router.post('/:id/assign-beam', requirePermission('warpBeams:assign'), assignWarpBeam);

module.exports = router;