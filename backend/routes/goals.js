const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Goal = require('../models/Goal');
const Session = require('../models/Session');
const Game = require('../models/Game');

// Get all goals for user
router.get('/', protect, async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = { user: req.user._id };

    if (status) {
      filter.status = status;
    }
    if (type) {
      filter.type = type;
    }

    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get goal summary/stats
router.get('/summary', protect, async (req, res) => {
  try {
    const goals = await Goal.find({
      user: req.user._id,
      status: 'active'
    });

    // Calculate current progress for each goal
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count sessions this week
    const weekSessions = await Session.countDocuments({
      user: req.user._id,
      lastUsed: { $gte: startOfWeek }
    });

    // Count sessions this month
    const monthSessions = await Session.countDocuments({
      user: req.user._id,
      lastUsed: { $gte: startOfMonth }
    });

    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => {
      let current = goal.progress.current;

      if (goal.type === 'sessions_per_week') {
        current = weekSessions;
      } else if (goal.type === 'sessions_per_month') {
        current = monthSessions;
      }

      return {
        ...goal.toObject(),
        currentProgress: current,
        progressPercentage: Math.min(100, Math.round((current / goal.target.value) * 100))
      };
    });

    // Calculate streak
    const games = await Game.find({ user: req.user._id })
      .select('lastUsed')
      .sort({ lastUsed: -1 });

    const uniqueDates = [...new Set(
      games
        .filter(g => g.lastUsed)
        .map(g => new Date(g.lastUsed).toDateString())
    )].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (const dateStr of uniqueDates) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      const diff = Math.floor((checkDate - date) / (1000 * 60 * 60 * 24));
      if (diff <= 1) {
        streak++;
        checkDate = date;
      } else {
        break;
      }
    }

    res.json({
      goals: goalsWithProgress,
      weekSessions,
      monthSessions,
      currentStreak: streak,
      totalGoals: goals.length,
      achievedThisPeriod: goalsWithProgress.filter(g => g.currentProgress >= g.target.value).length
    });
  } catch (error) {
    console.error('Get goal summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single goal
router.get('/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create goal
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      target,
      startDate,
      endDate,
      milestones,
      reminderEnabled,
      reminderTime
    } = req.body;

    const goal = await Goal.create({
      user: req.user._id,
      title,
      description,
      type,
      target,
      startDate: startDate || new Date(),
      endDate,
      milestones: milestones || [],
      reminderEnabled,
      reminderTime
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Update goal
router.put('/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const allowedFields = [
      'title', 'description', 'target', 'endDate', 'status',
      'milestones', 'reminderEnabled', 'reminderTime'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        goal[field] = req.body[field];
      }
    });

    await goal.save();
    res.json(goal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update goal progress manually
router.post('/:id/progress', protect, async (req, res) => {
  try {
    const { value, periodStart, periodEnd } = req.body;

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.progress.current = value;
    goal.progress.history.push({
      value,
      date: new Date(),
      periodStart,
      periodEnd
    });

    // Check milestones
    goal.milestones.forEach(milestone => {
      if (!milestone.achieved && value >= milestone.targetValue) {
        milestone.achieved = true;
        milestone.achievedDate = new Date();
      }
    });

    // Check if goal is complete
    if (goal.target.period === 'total' && value >= goal.target.value) {
      goal.status = 'completed';
    }

    await goal.save();
    res.json(goal);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Record activity (for streak goals)
router.post('/:id/activity', protect, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = goal.lastActivityDate ? new Date(goal.lastActivityDate) : null;
    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
    }

    // Check if this is a consecutive day
    if (lastActivity) {
      const diff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        // Consecutive day - increment streak
        goal.currentStreak += 1;
      } else if (diff > 1) {
        // Streak broken - reset
        goal.currentStreak = 1;
      }
      // diff === 0 means same day, don't change streak
    } else {
      goal.currentStreak = 1;
    }

    // Update longest streak if needed
    if (goal.currentStreak > goal.longestStreak) {
      goal.longestStreak = goal.currentStreak;
    }

    goal.lastActivityDate = new Date();
    goal.progress.current = goal.currentStreak;

    await goal.save();
    res.json(goal);
  } catch (error) {
    console.error('Record activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete goal
router.delete('/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
