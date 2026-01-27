const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  getYarns,
  getYarn,
  createYarn,
  updateYarn,
  deleteYarn,
  incrementUsage,
} = require('../controllers/yarnController');
const { protect } = require('../middleware/authMiddleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.use(protect);

router.get('/', getYarns);
router.get('/:id', getYarn);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Yarn name is required'),
    body('denier').isNumeric().withMessage('Denier must be a number'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('gstPercentage').isNumeric().withMessage('GST must be a number'),
    body('yarnType').isIn(['warp', 'weft', 'weft-2', 'all']).withMessage('Invalid yarn type'),
  ],
  validate,
  createYarn
);

router.put('/:id', updateYarn);
router.delete('/:id', deleteYarn);
router.post('/:id/usage', incrementUsage);

module.exports = router;