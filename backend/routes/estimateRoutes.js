const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  getEstimates,
  getEstimate,
  createEstimate,
  updateEstimate,
  deleteEstimate,
  duplicateEstimate,
  revertVersion,
  compareEstimates,
  saveDraft,
  getDraft,
  deleteDraft,
  calculate,
} = require('../controllers/estimateController');
const { protect } = require('../middleware/authMiddleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.use(protect);

// Draft routes
router.get('/draft', getDraft);
router.post('/draft', saveDraft);
router.delete('/draft', deleteDraft);

// Calculate route
router.post('/calculate', calculate);

// Compare route
router.post('/compare', compareEstimates);

// Main CRUD routes
router.get('/', getEstimates);
router.get('/:id', getEstimate);

router.post(
  '/',
  [
    body('qualityName').trim().notEmpty().withMessage('Quality name is required'),
    body('warp.tar').isNumeric().withMessage('Warp tar is required'),
    body('warp.denier').isNumeric().withMessage('Warp denier is required'),
    body('warp.wastage').isNumeric().withMessage('Warp wastage is required'),
    body('weft.peek').isNumeric().withMessage('Weft peek is required'),
    body('weft.panna').isNumeric().withMessage('Weft panna is required'),
    body('weft.denier').isNumeric().withMessage('Weft denier is required'),
    body('weft.wastage').isNumeric().withMessage('Weft wastage is required'),
  ],
  validate,
  createEstimate
);

router.put('/:id', updateEstimate);
router.delete('/:id', deleteEstimate);
router.post('/:id/duplicate', duplicateEstimate);
router.post('/:id/revert/:version', revertVersion);

module.exports = router;