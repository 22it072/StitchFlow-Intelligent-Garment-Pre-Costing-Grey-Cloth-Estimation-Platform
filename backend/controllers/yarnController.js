const Yarn = require('../models/Yarn');

// @desc    Get all yarns for user
// @route   GET /api/yarns
// @access  Private
const getYarns = async (req, res) => {
  try {
    const { type, active, search, sort } = req.query;
    
    let query = { user: req.user._id };
    
    if (type && type !== 'all') {
      query.yarnType = { $in: [type, 'all'] };
    }
    
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'name') sortOption = { name: 1 };
    if (sort === 'price') sortOption = { price: 1 };
    if (sort === 'usage') sortOption = { usageCount: -1 };

    const yarns = await Yarn.find(query).sort(sortOption);
    
    res.json(yarns);
  } catch (error) {
    console.error('Get yarns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single yarn
// @route   GET /api/yarns/:id
// @access  Private
const getYarn = async (req, res) => {
  try {
    const yarn = await Yarn.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!yarn) {
      return res.status(404).json({ message: 'Yarn not found' });
    }

    res.json(yarn);
  } catch (error) {
    console.error('Get yarn error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create yarn
// @route   POST /api/yarns
// @access  Private
const createYarn = async (req, res) => {
  try {
    const { name, denier, price, gstPercentage, yarnType, color, description } = req.body;

    const yarn = await Yarn.create({
      user: req.user._id,
      name,
      denier,
      price,
      gstPercentage,
      yarnType,
      color,
      description,
    });

    res.status(201).json(yarn);
  } catch (error) {
    console.error('Create yarn error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update yarn
// @route   PUT /api/yarns/:id
// @access  Private
const updateYarn = async (req, res) => {
  try {
    const yarn = await Yarn.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!yarn) {
      return res.status(404).json({ message: 'Yarn not found' });
    }

    const { name, denier, price, gstPercentage, yarnType, color, description, isActive } = req.body;

    yarn.name = name || yarn.name;
    yarn.denier = denier !== undefined ? denier : yarn.denier;
    yarn.price = price !== undefined ? price : yarn.price;
    yarn.gstPercentage = gstPercentage !== undefined ? gstPercentage : yarn.gstPercentage;
    yarn.yarnType = yarnType || yarn.yarnType;
    yarn.color = color !== undefined ? color : yarn.color;
    yarn.description = description !== undefined ? description : yarn.description;
    yarn.isActive = isActive !== undefined ? isActive : yarn.isActive;

    const updatedYarn = await yarn.save();
    res.json(updatedYarn);
  } catch (error) {
    console.error('Update yarn error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete yarn
// @route   DELETE /api/yarns/:id
// @access  Private
const deleteYarn = async (req, res) => {
  try {
    const yarn = await Yarn.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!yarn) {
      return res.status(404).json({ message: 'Yarn not found' });
    }

    await yarn.deleteOne();
    res.json({ message: 'Yarn removed' });
  } catch (error) {
    console.error('Delete yarn error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Increment yarn usage count
// @route   POST /api/yarns/:id/usage
// @access  Private
const incrementUsage = async (req, res) => {
  try {
    const yarn = await Yarn.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $inc: { usageCount: 1 } },
      { new: true }
    );

    if (!yarn) {
      return res.status(404).json({ message: 'Yarn not found' });
    }

    res.json(yarn);
  } catch (error) {
    console.error('Increment usage error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getYarns,
  getYarn,
  createYarn,
  updateYarn,
  deleteYarn,
  incrementUsage,
};