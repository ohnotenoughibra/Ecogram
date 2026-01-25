const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const Game = require('../models/Game');
const { protect } = require('../middleware/auth');

// @route   GET /api/sessions
// @desc    Get all sessions for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { favorite, upcoming, page = 1, limit = 20 } = req.query;

    const query = { user: req.user._id };

    if (favorite === 'true') {
      query.favorite = true;
    }

    if (upcoming === 'true') {
      query.scheduledDate = { $gte: new Date() };
    }

    const sessions = await Session.find(query)
      .populate('games.game', 'name topic skills')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Session.countDocuments(query);

    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error fetching sessions' });
  }
});

// @route   GET /api/sessions/:id
// @desc    Get single session with full game details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    }).populate('games.game');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ message: 'Server error fetching session' });
  }
});

// @route   POST /api/sessions
// @desc    Create a new session
// @access  Private
router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Session name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, gameIds, scheduledDate } = req.body;

    // Verify all games belong to user
    if (gameIds && gameIds.length > 0) {
      const gamesCount = await Game.countDocuments({
        _id: { $in: gameIds },
        user: req.user._id
      });

      if (gamesCount !== gameIds.length) {
        return res.status(400).json({ message: 'Some games not found or not owned by user' });
      }
    }

    const games = (gameIds || []).map((gameId, index) => ({
      game: gameId,
      order: index,
      completed: false
    }));

    const session = await Session.create({
      user: req.user._id,
      name,
      games,
      scheduledDate: scheduledDate || null
    });

    const populatedSession = await Session.findById(session._id)
      .populate('games.game', 'name topic skills');

    res.status(201).json(populatedSession);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error creating session' });
  }
});

// @route   PUT /api/sessions/:id
// @desc    Update a session
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.role': 'editor' }
      ]
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const { name, favorite, scheduledDate, duration } = req.body;

    if (name !== undefined) session.name = name;
    if (favorite !== undefined) session.favorite = favorite;
    if (scheduledDate !== undefined) session.scheduledDate = scheduledDate;
    if (duration !== undefined) session.duration = duration;

    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate('games.game', 'name topic skills');

    res.json(populatedSession);
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ message: 'Server error updating session' });
  }
});

// @route   PUT /api/sessions/:id/games
// @desc    Update games in a session
// @access  Private
router.put('/:id/games', protect, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.role': 'editor' }
      ]
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const { gameIds, action, gameId } = req.body;

    if (action === 'add' && gameId) {
      // Add a single game
      const game = await Game.findOne({ _id: gameId, user: req.user._id });
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      session.games.push({
        game: gameId,
        order: session.games.length,
        completed: false
      });
    } else if (action === 'remove' && gameId) {
      // Remove a single game
      session.games = session.games.filter(g => g.game.toString() !== gameId);
      // Reorder remaining games
      session.games.forEach((g, index) => {
        g.order = index;
      });
    } else if (action === 'reorder' && gameIds) {
      // Reorder games
      const newGames = gameIds.map((id, index) => {
        const existing = session.games.find(g => g.game.toString() === id);
        return {
          game: id,
          order: index,
          completed: existing ? existing.completed : false,
          notes: existing ? existing.notes : ''
        };
      });
      session.games = newGames;
    } else if (gameIds) {
      // Replace all games
      session.games = gameIds.map((id, index) => ({
        game: id,
        order: index,
        completed: false
      }));
    }

    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate('games.game', 'name topic skills');

    res.json(populatedSession);
  } catch (error) {
    console.error('Update session games error:', error);
    res.status(500).json({ message: 'Server error updating session games' });
  }
});

// @route   PUT /api/sessions/:id/games/:gameId/complete
// @desc    Mark a game in session as completed
// @access  Private
router.put('/:id/games/:gameId/complete', protect, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const gameEntry = session.games.find(g => g.game.toString() === req.params.gameId);
    if (!gameEntry) {
      return res.status(404).json({ message: 'Game not found in session' });
    }

    gameEntry.completed = !gameEntry.completed;

    // Also mark the game as used
    await Game.findByIdAndUpdate(req.params.gameId, {
      lastUsed: new Date(),
      $inc: { usageCount: 1 }
    });

    await session.save();

    res.json(session);
  } catch (error) {
    console.error('Complete game error:', error);
    res.status(500).json({ message: 'Server error completing game' });
  }
});

// @route   PUT /api/sessions/:id/use
// @desc    Mark session as used
// @access  Private
router.put('/:id/use', protect, async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { lastUsed: new Date() },
      { new: true }
    ).populate('games.game', 'name topic skills');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Mark session used error:', error);
    res.status(500).json({ message: 'Server error marking session as used' });
  }
});

// @route   DELETE /api/sessions/:id
// @desc    Delete a session
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Server error deleting session' });
  }
});

// @route   POST /api/sessions/:id/duplicate
// @desc    Duplicate a session
// @access  Private
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    const originalSession = await Session.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!originalSession) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const newSession = await Session.create({
      user: req.user._id,
      name: `${originalSession.name} (Copy)`,
      games: originalSession.games.map(g => ({
        game: g.game,
        order: g.order,
        completed: false
      })),
      favorite: false
    });

    const populatedSession = await Session.findById(newSession._id)
      .populate('games.game', 'name topic skills');

    res.status(201).json(populatedSession);
  } catch (error) {
    console.error('Duplicate session error:', error);
    res.status(500).json({ message: 'Server error duplicating session' });
  }
});

module.exports = router;
