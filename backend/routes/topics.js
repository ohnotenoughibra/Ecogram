const express = require('express');
const router = express.Router();
const TrainingTopic = require('../models/TrainingTopic');
const { protect } = require('../middleware/auth');

// @route   GET /api/topics
// @desc    Get all training topics for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate, active } = req.query;

    let query = { user: req.user._id };

    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    // If date range provided, filter by dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      query.$or = [
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } },
        { startDate: { $lte: start }, endDate: { $gte: end } }
      ];
    }

    const topics = await TrainingTopic.find(query).sort({ startDate: -1 });
    res.json(topics);
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/topics/current
// @desc    Get current active training topic
// @access  Private
router.get('/current', protect, async (req, res) => {
  try {
    const topic = await TrainingTopic.getCurrentTopic(req.user._id);
    res.json(topic || null);
  } catch (error) {
    console.error('Get current topic error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/topics/:id
// @desc    Get a single training topic
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const topic = await TrainingTopic.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json(topic);
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/topics
// @desc    Create a new training topic
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, startDate, endDate, color, category, goals, notes } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const topic = new TrainingTopic({
      user: req.user._id,
      name,
      description,
      startDate: start,
      endDate: end,
      color: color || '#6366f1',
      category: category || 'custom',
      goals: goals || [],
      notes
    });

    await topic.save();
    res.status(201).json(topic);
  } catch (error) {
    console.error('Create topic error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/topics/:id
// @desc    Update a training topic
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, startDate, endDate, color, category, goals, notes, isActive } = req.body;

    const topic = await TrainingTopic.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
      topic.startDate = start;
      topic.endDate = end;
    } else if (startDate) {
      topic.startDate = new Date(startDate);
    } else if (endDate) {
      topic.endDate = new Date(endDate);
    }

    if (name !== undefined) topic.name = name;
    if (description !== undefined) topic.description = description;
    if (color !== undefined) topic.color = color;
    if (category !== undefined) topic.category = category;
    if (goals !== undefined) topic.goals = goals;
    if (notes !== undefined) topic.notes = notes;
    if (isActive !== undefined) topic.isActive = isActive;

    await topic.save();
    res.json(topic);
  } catch (error) {
    console.error('Update topic error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/topics/:id
// @desc    Delete a training topic
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const topic = await TrainingTopic.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json({ message: 'Topic deleted' });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/topics/:id/extend
// @desc    Extend a training topic by a number of weeks
// @access  Private
router.post('/:id/extend', protect, async (req, res) => {
  try {
    const { weeks = 3 } = req.body;

    const topic = await TrainingTopic.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Extend end date by specified weeks
    const newEndDate = new Date(topic.endDate);
    newEndDate.setDate(newEndDate.getDate() + (weeks * 7));
    topic.endDate = newEndDate;

    await topic.save();
    res.json(topic);
  } catch (error) {
    console.error('Extend topic error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
