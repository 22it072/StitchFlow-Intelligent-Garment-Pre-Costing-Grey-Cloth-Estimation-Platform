const Settings = require('../models/Settings');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.user._id });

    if (!settings) {
      settings = await Settings.create({ user: req.user._id });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    const {
      defaultGstPercentage,
      weightDecimalPrecision,
      costDecimalPrecision,
      enableWeft2ByDefault,
      currencySymbol,
      currencyCode,
      dateFormat,
      autoSaveInterval,
      theme,
    } = req.body;

    let settings = await Settings.findOne({ user: req.user._id });

    if (!settings) {
      settings = new Settings({ user: req.user._id });
    }

    if (defaultGstPercentage !== undefined) settings.defaultGstPercentage = defaultGstPercentage;
    if (weightDecimalPrecision !== undefined) settings.weightDecimalPrecision = weightDecimalPrecision;
    if (costDecimalPrecision !== undefined) settings.costDecimalPrecision = costDecimalPrecision;
    if (enableWeft2ByDefault !== undefined) settings.enableWeft2ByDefault = enableWeft2ByDefault;
    if (currencySymbol !== undefined) settings.currencySymbol = currencySymbol;
    if (currencyCode !== undefined) settings.currencyCode = currencyCode;
    if (dateFormat !== undefined) settings.dateFormat = dateFormat;
    if (autoSaveInterval !== undefined) settings.autoSaveInterval = autoSaveInterval;
    if (theme !== undefined) settings.theme = theme;

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset settings to defaults
// @route   POST /api/settings/reset
// @access  Private
const resetSettings = async (req, res) => {
  try {
    await Settings.findOneAndDelete({ user: req.user._id });
    const settings = await Settings.create({ user: req.user._id });
    res.json(settings);
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  resetSettings,
};