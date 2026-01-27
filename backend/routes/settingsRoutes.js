const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  resetSettings,
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/reset', resetSettings);

module.exports = router;