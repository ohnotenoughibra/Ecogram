const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const Game = require('../models/Game');
const { protect } = require('../middleware/auth');

// @route   GET /api/games
// @desc    Get all games for user with filtering and pagination
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      topic,
      favorite,
      search,
      position,
      technique,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { user: req.user._id };

    // Topic filter
    if (topic && ['offensive', 'defensive', 'control', 'transition'].includes(topic)) {
      query.topic = topic;
    }

    // Position filter
    if (position) {
      query.position = position;
    }

    // Technique filter
    if (technique) {
      query.techniques = technique;
    }

    // Favorite filter
    if (favorite === 'true') {
      query.favorite = true;
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { skills: { $elemMatch: { $regex: search, $options: 'i' } } },
        { coaching: { $regex: search, $options: 'i' } },
        { techniques: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }

    // Sorting
    const sortOptions = {};
    const validSortFields = ['name', 'createdAt', 'lastUsed', 'rating', 'usageCount'];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const games = await Game.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Game.countDocuments(query);

    res.json({
      games,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ message: 'Server error fetching games' });
  }
});

// @route   GET /api/games/recent
// @desc    Get recently used games
// @access  Private
router.get('/recent', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const games = await Game.find({
      user: req.user._id,
      lastUsed: { $ne: null }
    })
      .sort({ lastUsed: -1 })
      .limit(parseInt(limit));

    res.json(games);
  } catch (error) {
    console.error('Get recent games error:', error);
    res.status(500).json({ message: 'Server error fetching recent games' });
  }
});

// @route   GET /api/games/stats
// @desc    Get game statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Topic distribution
    const topicDistribution = await Game.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$topic', count: { $sum: 1 } } }
    ]);

    // Total counts
    const totalGames = await Game.countDocuments({ user: userId });
    const favoriteCount = await Game.countDocuments({ user: userId, favorite: true });
    const usedCount = await Game.countDocuments({ user: userId, lastUsed: { $ne: null } });

    // Most used games
    const mostUsed = await Game.find({ user: userId })
      .sort({ usageCount: -1 })
      .limit(5)
      .select('name topic usageCount');

    // Recently created
    const recentlyCreated = await Game.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name topic createdAt');

    // Skills frequency
    const skillsFrequency = await Game.aggregate([
      { $match: { user: userId } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalGames,
      favoriteCount,
      usedCount,
      topicDistribution: topicDistribution.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      mostUsed,
      recentlyCreated,
      skillsFrequency
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// @route   POST /api/games/import
// @desc    Import games from JSON
// @access  Private
// NOTE: This route MUST be before /:id to avoid being caught by the param route
router.post('/import', protect, async (req, res) => {
  try {
    const { games } = req.body;

    console.log('Import request received, games count:', games?.length);

    if (!games || !Array.isArray(games)) {
      return res.status(400).json({ message: 'Games array required' });
    }

    // Topic mapping for different formats (comprehensive)
    const topicMap = {
      // Direct mappings
      'offensive': 'offensive',
      'defensive': 'defensive',
      'control': 'control',
      'transition': 'transition',
      // Submissions & Attacks -> Offensive
      'submissions': 'offensive',
      'submission': 'offensive',
      'armbar finishing': 'offensive',
      'leg attacks': 'offensive',
      'leg locks': 'offensive',
      // Guard & Escapes -> Defensive
      'guard': 'defensive',
      'guard retention': 'defensive',
      'escapes': 'defensive',
      'escape': 'defensive',
      'half guard': 'defensive',
      'octopus guard': 'defensive',
      // Passing & Pinning -> Control
      'guard passing': 'control',
      'passing': 'control',
      'pinning': 'control',
      'mount': 'control',
      'back control': 'control',
      'top control': 'control',
      'front headlock': 'control',
      // Wrestling & Movement -> Transition
      'standup/wrestling': 'transition',
      'standup': 'transition',
      'wrestling': 'transition',
      'takedowns': 'transition',
      'takedown': 'transition',
      'sweeps': 'transition',
      'sweep': 'transition',
      'sweeping': 'transition',
      'sumi gaeshi': 'transition',
      'transitions': 'transition',
      'transitions (sambo)': 'transition',
      'hand fighting': 'transition',
      'turtle': 'defensive',
      'general': 'transition',
      'pinning (folkstyle)': 'control'
    };

    const importedGames = [];

    for (const gameData of games) {
      // Parse skills - handle both array and string formats
      let skills = [];
      if (Array.isArray(gameData.skills)) {
        skills = gameData.skills;
      } else if (typeof gameData.skills === 'string') {
        // Parse "#tag1 #tag2" or "tag1, tag2" format
        skills = gameData.skills
          .split(/[#,\s]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
      }

      // Map topic to our categories
      const topicLower = (gameData.topic || '').toLowerCase();
      const mappedTopic = topicMap[topicLower] || 'transition';

      // Build coaching notes - include author if present
      let coaching = gameData.coaching || '';
      if (gameData.author && !coaching.includes(gameData.author)) {
        coaching = coaching ? `${coaching}\n\nBy: ${gameData.author}` : `By: ${gameData.author}`;
      }

      const game = await Game.create({
        user: req.user._id,
        name: gameData.name || 'Imported Game',
        topic: mappedTopic,
        topPlayer: gameData.topPlayer || '',
        bottomPlayer: gameData.bottomPlayer || '',
        coaching: coaching.trim(),
        skills: skills,
        favorite: gameData.favorite || false,
        rating: gameData.rating || 0
      });
      importedGames.push(game);
    }

    console.log('Successfully imported:', importedGames.length, 'games');

    res.status(201).json({
      message: `Successfully imported ${importedGames.length} games`,
      games: importedGames
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ message: 'Server error importing games' });
  }
});

// @route   GET /api/games/export/all
// @desc    Export all games as JSON
// @access  Private
router.get('/export/all', protect, async (req, res) => {
  try {
    const games = await Game.find({ user: req.user._id })
      .select('-user -__v')
      .lean();

    res.json({ games, exportDate: new Date() });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error exporting games' });
  }
});

// @route   GET /api/games/:id
// @desc    Get single game
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, user: req.user._id });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ message: 'Server error fetching game' });
  }
});

// @route   POST /api/games
// @desc    Create a new game
// @access  Private
router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Game name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('topic').isIn(['offensive', 'defensive', 'control', 'transition'])
    .withMessage('Invalid topic')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, topic, topPlayer, bottomPlayer, coaching, skills, aiGenerated, aiMetadata, position, techniques, gameType, difficulty } = req.body;

    const game = await Game.create({
      user: req.user._id,
      name,
      topic,
      topPlayer: topPlayer || '',
      bottomPlayer: bottomPlayer || '',
      coaching: coaching || '',
      skills: skills || [],
      position: position || '',
      techniques: techniques || [],
      gameType: gameType || 'main',
      difficulty: difficulty || 'intermediate',
      aiGenerated: aiGenerated || false,
      aiMetadata: aiMetadata || null
    });

    res.status(201).json(game);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ message: 'Server error creating game' });
  }
});

// @route   PUT /api/games/:id
// @desc    Update a game
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, user: req.user._id });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const allowedFields = ['name', 'topic', 'topPlayer', 'bottomPlayer', 'coaching', 'skills', 'favorite', 'rating', 'videoUrl', 'personalNotes', 'gameType', 'difficulty', 'position', 'techniques', 'linkedGames'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        game[field] = req.body[field];
      }
    });

    await game.save();
    res.json(game);
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ message: 'Server error updating game' });
  }
});

// @route   PUT /api/games/:id/use
// @desc    Mark game as used
// @access  Private
router.put('/:id/use', protect, async (req, res) => {
  try {
    const game = await Game.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        lastUsed: new Date(),
        $inc: { usageCount: 1 }
      },
      { new: true }
    );

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error('Mark used error:', error);
    res.status(500).json({ message: 'Server error marking game as used' });
  }
});

// @route   POST /api/games/:id/rate-effectiveness
// @desc    Rate game effectiveness after use
// @access  Private
router.post('/:id/rate-effectiveness', protect, async (req, res) => {
  try {
    const { rating, sessionId, notes } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const game = await Game.findOne({ _id: req.params.id, user: req.user._id });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Add the new rating
    game.effectivenessRatings.push({
      rating,
      sessionId: sessionId || null,
      notes: notes || '',
      date: new Date()
    });

    // Calculate new average
    const totalRatings = game.effectivenessRatings.length;
    const sum = game.effectivenessRatings.reduce((acc, r) => acc + r.rating, 0);
    game.averageEffectiveness = Math.round((sum / totalRatings) * 10) / 10;

    await game.save();
    res.json(game);
  } catch (error) {
    console.error('Rate effectiveness error:', error);
    res.status(500).json({ message: 'Server error rating game' });
  }
});

// @route   DELETE /api/games/:id
// @desc    Delete a game
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const game = await Game.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ message: 'Server error deleting game' });
  }
});

// @route   POST /api/games/bulk
// @desc    Bulk operations on games
// @access  Private
router.post('/bulk', protect, async (req, res) => {
  try {
    const { gameIds, action, data } = req.body;

    if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({ message: 'Game IDs required' });
    }

    let result;

    switch (action) {
      case 'favorite':
        result = await Game.updateMany(
          { _id: { $in: gameIds }, user: req.user._id },
          { favorite: true }
        );
        break;

      case 'unfavorite':
        result = await Game.updateMany(
          { _id: { $in: gameIds }, user: req.user._id },
          { favorite: false }
        );
        break;

      case 'delete':
        result = await Game.deleteMany(
          { _id: { $in: gameIds }, user: req.user._id }
        );
        break;

      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    res.json({ message: 'Bulk operation completed', result });
  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({ message: 'Server error during bulk operation' });
  }
});

module.exports = router;
