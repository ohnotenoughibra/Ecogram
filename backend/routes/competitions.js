const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Competition = require('../models/Competition');
const Session = require('../models/Session');
const Game = require('../models/Game');

// Get all competitions for user
router.get('/', protect, async (req, res) => {
  try {
    const { status, active } = req.query;
    const filter = { user: req.user._id };

    if (status) {
      filter.status = status;
    }
    if (active === 'true') {
      filter.isActive = true;
    }

    const competitions = await Competition.find(filter)
      .populate('trainingSessions')
      .sort({ date: 1 });

    res.json(competitions);
  } catch (error) {
    console.error('Get competitions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active competition (for prep mode)
router.get('/active', protect, async (req, res) => {
  try {
    const competition = await Competition.findOne({
      user: req.user._id,
      isActive: true,
      status: 'upcoming'
    }).populate('trainingSessions');

    res.json(competition);
  } catch (error) {
    console.error('Get active competition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single competition
router.get('/:id', protect, async (req, res) => {
  try {
    const competition = await Competition.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('trainingSessions');

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    res.json(competition);
  } catch (error) {
    console.error('Get competition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create competition
router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      date,
      location,
      weightClass,
      targetWeight,
      division,
      category,
      focusAreas,
      gameplan
    } = req.body;

    // If making this competition active, deactivate others
    if (req.body.isActive !== false) {
      await Competition.updateMany(
        { user: req.user._id },
        { isActive: false }
      );
    }

    const competition = await Competition.create({
      user: req.user._id,
      name,
      date,
      location,
      weightClass,
      targetWeight,
      division,
      category,
      focusAreas,
      gameplan,
      isActive: true
    });

    res.status(201).json(competition);
  } catch (error) {
    console.error('Create competition error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Update competition
router.put('/:id', protect, async (req, res) => {
  try {
    const competition = await Competition.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    const allowedFields = [
      'name', 'date', 'location', 'weightClass', 'targetWeight',
      'division', 'category', 'focusAreas', 'gameplan', 'opponents',
      'status', 'result', 'isActive'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        competition[field] = req.body[field];
      }
    });

    // If setting this as active, deactivate others
    if (req.body.isActive === true) {
      await Competition.updateMany(
        { user: req.user._id, _id: { $ne: competition._id } },
        { isActive: false }
      );
    }

    await competition.save();
    res.json(competition);
  } catch (error) {
    console.error('Update competition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Log weight
router.post('/:id/weight', protect, async (req, res) => {
  try {
    const { weight, notes } = req.body;

    const competition = await Competition.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    competition.weightLog.push({
      weight,
      notes,
      date: new Date()
    });

    await competition.save();
    res.json(competition);
  } catch (error) {
    console.error('Log weight error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add training session to competition
router.post('/:id/session', protect, async (req, res) => {
  try {
    const { sessionId } = req.body;

    const competition = await Competition.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    if (!competition.trainingSessions.includes(sessionId)) {
      competition.trainingSessions.push(sessionId);
      await competition.save();
    }

    res.json(competition);
  } catch (error) {
    console.error('Add session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recommended games for competition prep
router.get('/:id/recommended-games', protect, async (req, res) => {
  try {
    const competition = await Competition.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // Get games matching focus areas with highest effectiveness
    const query = { user: req.user._id };
    if (competition.focusAreas?.length > 0) {
      query.topic = { $in: competition.focusAreas };
    }

    const games = await Game.find(query)
      .sort({ averageEffectiveness: -1, usageCount: -1 })
      .limit(20);

    res.json(games);
  } catch (error) {
    console.error('Get recommended games error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete competition
router.delete('/:id', protect, async (req, res) => {
  try {
    const competition = await Competition.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    res.json({ message: 'Competition deleted' });
  } catch (error) {
    console.error('Delete competition error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
