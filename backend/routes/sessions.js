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

    const { name, gameIds, scheduledDate, duration, focusPosition } = req.body;

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
      scheduledDate: scheduledDate || null,
      duration: duration || 0,
      focusPosition: focusPosition || ''
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

// @route   PUT /api/sessions/:id/games/:gameId/notes
// @desc    Update notes for a game in session
// @access  Private
router.put('/:id/games/:gameId/notes', protect, async (req, res) => {
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

    gameEntry.notes = req.body.notes || '';

    await session.save();

    res.json(session);
  } catch (error) {
    console.error('Update game notes error:', error);
    res.status(500).json({ message: 'Server error updating game notes' });
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

// @route   POST /api/sessions/smart-build
// @desc    Auto-generate a balanced session based on constraints
// @access  Private
router.post('/smart-build', protect, async (req, res) => {
  try {
    const { topic, position, duration, name, gameCount, difficulty, durationMinutes } = req.body;

    // Calculate game structure based on constraints
    let structure;

    if (gameCount) {
      // User specified exact game count
      const count = Math.min(Math.max(1, parseInt(gameCount)), 15);
      if (count <= 3) {
        structure = { warmup: 0, main: count, cooldown: 0 };
      } else if (count <= 5) {
        structure = { warmup: 1, main: count - 1, cooldown: 0 };
      } else {
        structure = { warmup: 1, main: count - 2, cooldown: 1 };
      }
    } else if (durationMinutes) {
      // User specified duration in minutes - estimate ~8 min per game
      const mins = Math.min(Math.max(15, parseInt(durationMinutes)), 180);
      const estimatedGames = Math.round(mins / 8);
      if (estimatedGames <= 3) {
        structure = { warmup: 0, main: estimatedGames, cooldown: 0 };
      } else if (estimatedGames <= 5) {
        structure = { warmup: 1, main: estimatedGames - 1, cooldown: 0 };
      } else {
        structure = { warmup: 1, main: estimatedGames - 2, cooldown: 1 };
      }
    } else {
      // Fall back to duration preset
      const sessionStructure = {
        short: { warmup: 1, main: 2, cooldown: 0 },      // ~30 min
        medium: { warmup: 1, main: 3, cooldown: 1 },     // ~45-60 min
        long: { warmup: 2, main: 4, cooldown: 1 }        // ~90 min
      };
      structure = sessionStructure[duration || 'medium'];
    }

    // Get user's games
    let userGames = await Game.find({ user: req.user._id });

    if (userGames.length === 0) {
      return res.status(400).json({
        message: 'No games in library. Add some games first to auto-generate sessions.'
      });
    }

    // Filter by difficulty/skill level if specified
    if (difficulty) {
      const diffFiltered = userGames.filter(g => g.difficulty === difficulty);
      if (diffFiltered.length >= 3) {
        userGames = diffFiltered;
      }
    }

    // Filter by position if specified
    if (position) {
      const posFiltered = userGames.filter(g => g.position === position);
      if (posFiltered.length >= 3) {
        userGames = posFiltered;
      }
    }

    // Categorize games
    const warmupGames = userGames.filter(g => g.gameType === 'warmup');
    const cooldownGames = userGames.filter(g => g.gameType === 'cooldown');
    let mainGames = userGames.filter(g => g.gameType === 'main' || !g.gameType);

    // Filter main games by topic if specified
    if (topic) {
      const topicFiltered = mainGames.filter(g => g.topic === topic);
      if (topicFiltered.length >= structure.main) {
        mainGames = topicFiltered;
      }
    }

    // Helper to pick random games, prioritizing favorites and less-used games
    const pickGames = (games, count) => {
      if (games.length === 0) return [];
      if (games.length <= count) return games;

      // Score games: higher score = better pick
      const scored = games.map(g => ({
        game: g,
        score: (g.favorite ? 10 : 0) +
               (5 - Math.min(g.usageCount || 0, 5)) + // Less used = higher score
               (g.rating || 0) +
               Math.random() * 3 // Add some randomness
      }));

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, count).map(s => s.game);
    };

    const selectedGames = [];

    // Pick warmup games (or use main games if no warmups)
    const warmups = pickGames(warmupGames.length > 0 ? warmupGames : mainGames, structure.warmup);
    selectedGames.push(...warmups);

    // Pick main games (excluding already selected)
    const selectedIds = new Set(selectedGames.map(g => g._id.toString()));
    const availableMain = mainGames.filter(g => !selectedIds.has(g._id.toString()));
    const mains = pickGames(availableMain, structure.main);
    selectedGames.push(...mains);

    // Pick cooldown games (or skip if none available)
    if (structure.cooldown > 0) {
      const availableCooldown = cooldownGames.length > 0
        ? cooldownGames
        : mainGames.filter(g => !selectedIds.has(g._id.toString()) && !mains.includes(g));
      const cooldowns = pickGames(availableCooldown, structure.cooldown);
      selectedGames.push(...cooldowns);
    }

    if (selectedGames.length === 0) {
      return res.status(400).json({
        message: 'Not enough games to build a session. Add more games to your library.'
      });
    }

    // Generate session name
    const topicNames = {
      offensive: 'Attack',
      defensive: 'Defense',
      control: 'Control',
      transition: 'Movement'
    };
    const positionNames = {
      guard: 'Guard',
      'half-guard': 'Half Guard',
      mount: 'Mount',
      'side-control': 'Side Control',
      back: 'Back',
      turtle: 'Turtle',
      standing: 'Standing'
    };
    const difficultyNames = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    };

    let sessionNameParts = [];
    if (topic && topicNames[topic]) sessionNameParts.push(topicNames[topic]);
    if (position && positionNames[position]) sessionNameParts.push(positionNames[position]);
    if (difficulty && difficultyNames[difficulty]) sessionNameParts.push(difficultyNames[difficulty]);

    const sessionName = name || `${sessionNameParts.length > 0 ? sessionNameParts.join(' ') : 'Training'} Session - ${new Date().toLocaleDateString()}`;

    // Create the session
    const games = selectedGames.map((g, index) => ({
      game: g._id,
      order: index,
      completed: false
    }));

    const session = await Session.create({
      user: req.user._id,
      name: sessionName,
      games,
      scheduledDate: new Date()
    });

    const populatedSession = await Session.findById(session._id)
      .populate('games.game', 'name topic skills gameType');

    res.status(201).json({
      session: populatedSession,
      summary: {
        warmup: warmups.length,
        main: mains.length,
        cooldown: structure.cooldown > 0 ? selectedGames.length - warmups.length - mains.length : 0,
        total: selectedGames.length,
        topic: topic || 'mixed',
        position: position || null,
        difficulty: difficulty || null,
        estimatedMinutes: selectedGames.length * 8
      }
    });
  } catch (error) {
    console.error('Smart build session error:', error);
    res.status(500).json({ message: 'Server error generating session' });
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

// @route   GET /api/sessions/templates
// @desc    Get all templates for user
// @access  Private
router.get('/templates/all', protect, async (req, res) => {
  try {
    const templates = await Session.find({
      user: req.user._id,
      isTemplate: true
    })
      .populate('games.game', 'name topic skills gameType')
      .sort({ usageCount: -1, createdAt: -1 });

    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error fetching templates' });
  }
});

// @route   POST /api/sessions/:id/save-as-template
// @desc    Save an existing session as a template
// @access  Private
router.post('/:id/save-as-template', protect, async (req, res) => {
  try {
    const { templateName, templateDescription } = req.body;

    const originalSession = await Session.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!originalSession) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Create a new session as a template
    const template = await Session.create({
      user: req.user._id,
      name: originalSession.name,
      templateName: templateName || originalSession.name,
      templateDescription: templateDescription || '',
      games: originalSession.games.map(g => ({
        game: g.game,
        order: g.order,
        completed: false
      })),
      isTemplate: true,
      favorite: false
    });

    const populatedTemplate = await Session.findById(template._id)
      .populate('games.game', 'name topic skills gameType');

    res.status(201).json(populatedTemplate);
  } catch (error) {
    console.error('Save as template error:', error);
    res.status(500).json({ message: 'Server error saving template' });
  }
});

// @route   POST /api/sessions/from-template/:templateId
// @desc    Create a new session from a template
// @access  Private
router.post('/from-template/:templateId', protect, async (req, res) => {
  try {
    const { name, scheduledDate } = req.body;

    const template = await Session.findOne({
      _id: req.params.templateId,
      user: req.user._id,
      isTemplate: true
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Create a new session from the template
    const session = await Session.create({
      user: req.user._id,
      name: name || template.templateName || template.name,
      games: template.games.map(g => ({
        game: g.game,
        order: g.order,
        completed: false
      })),
      scheduledDate: scheduledDate || null,
      sourceTemplate: template._id,
      isTemplate: false,
      favorite: false
    });

    // Increment template usage count
    template.usageCount = (template.usageCount || 0) + 1;
    await template.save();

    const populatedSession = await Session.findById(session._id)
      .populate('games.game', 'name topic skills gameType');

    res.status(201).json(populatedSession);
  } catch (error) {
    console.error('Create from template error:', error);
    res.status(500).json({ message: 'Server error creating session from template' });
  }
});

// @route   DELETE /api/sessions/templates/:id
// @desc    Delete a template
// @access  Private
router.delete('/templates/:id', protect, async (req, res) => {
  try {
    const template = await Session.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      isTemplate: true
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Server error deleting template' });
  }
});

module.exports = router;
