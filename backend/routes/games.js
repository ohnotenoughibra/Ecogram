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

// @route   POST /api/games/check-duplicates
// @desc    Check for similar/duplicate games before creating
// @access  Private
router.post('/check-duplicates', protect, async (req, res) => {
  try {
    const { name, topic, position, techniques = [] } = req.body;
    const userId = req.user._id;

    if (!name) {
      return res.json({ duplicates: [], suggestions: [] });
    }

    // Find potential duplicates using multiple criteria
    const allGames = await Game.find({ user: userId }).lean();

    const duplicates = [];
    const suggestions = [];
    const nameLower = name.toLowerCase().trim();

    // Remove common suffixes for comparison
    const cleanName = nameLower.replace(/\s*\(copy\)\s*$/i, '').replace(/\s*\(\d+\)\s*$/i, '').trim();

    for (const game of allGames) {
      const gameNameLower = game.name.toLowerCase().trim();
      const cleanGameName = gameNameLower.replace(/\s*\(copy\)\s*$/i, '').replace(/\s*\(\d+\)\s*$/i, '').trim();

      let score = 0;
      let reasons = [];

      // Exact name match (or with Copy suffix)
      if (cleanName === cleanGameName) {
        score += 100;
        reasons.push('Exact name match');
      }
      // Name contains check
      else if (cleanName.includes(cleanGameName) || cleanGameName.includes(cleanName)) {
        score += 60;
        reasons.push('Similar name');
      }
      // Word overlap
      else {
        const words1 = new Set(cleanName.split(/\s+/).filter(w => w.length > 2));
        const words2 = new Set(cleanGameName.split(/\s+/).filter(w => w.length > 2));
        const overlap = [...words1].filter(w => words2.has(w)).length;
        const maxWords = Math.max(words1.size, words2.size);
        if (maxWords > 0 && overlap / maxWords >= 0.5) {
          score += 40;
          reasons.push('Similar words');
        }
      }

      // Same topic
      if (topic && game.topic === topic) {
        score += 15;
        reasons.push('Same topic');
      }

      // Same position
      if (position && game.position === position) {
        score += 20;
        reasons.push('Same position');
      }

      // Overlapping techniques
      if (techniques.length > 0 && game.techniques?.length > 0) {
        const techOverlap = techniques.filter(t => game.techniques.includes(t)).length;
        if (techOverlap > 0) {
          score += techOverlap * 10;
          reasons.push(`${techOverlap} common technique(s)`);
        }
      }

      if (score >= 60) {
        duplicates.push({
          _id: game._id,
          name: game.name,
          topic: game.topic,
          position: game.position,
          score,
          reasons,
          isExactMatch: score >= 100
        });
      } else if (score >= 30) {
        suggestions.push({
          _id: game._id,
          name: game.name,
          topic: game.topic,
          score,
          reasons
        });
      }
    }

    // Sort by score
    duplicates.sort((a, b) => b.score - a.score);
    suggestions.sort((a, b) => b.score - a.score);

    res.json({
      duplicates: duplicates.slice(0, 5),
      suggestions: suggestions.slice(0, 3),
      hasDuplicates: duplicates.length > 0,
      hasExactMatch: duplicates.some(d => d.isExactMatch)
    });
  } catch (error) {
    console.error('Check duplicates error:', error);
    res.status(500).json({ message: 'Server error checking duplicates' });
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

// @route   GET /api/games/game-of-the-day
// @desc    Get a suggested game for today based on training patterns
// @access  Private
router.get('/game-of-the-day', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all user's games
    const allGames = await Game.find({ user: userId }).lean();

    if (allGames.length === 0) {
      return res.json({ game: null, reason: 'no_games' });
    }

    // Use the day of year + user ID to create a consistent daily seed
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const userIdSum = userId.toString().split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const dailySeed = (dayOfYear + userIdSum) % allGames.length;

    // Priority scoring for games
    const scoredGames = allGames.map(game => {
      let score = 0;
      let reasons = [];

      // Favorite games get a boost
      if (game.favorite) {
        score += 20;
        reasons.push('favorite');
      }

      // High effectiveness games get a boost
      if (game.averageEffectiveness >= 4) {
        score += 15;
        reasons.push('highly_effective');
      }

      // Games not used recently get priority
      if (!game.lastUsed) {
        score += 30;
        reasons.push('never_used');
      } else {
        const daysSinceUsed = Math.floor((today - new Date(game.lastUsed)) / (1000 * 60 * 60 * 24));
        if (daysSinceUsed >= 14) {
          score += 25;
          reasons.push('not_used_recently');
        } else if (daysSinceUsed >= 7) {
          score += 15;
          reasons.push('due_for_review');
        }
      }

      // Underrepresented topics get a boost
      const topicCounts = { offensive: 0, defensive: 0, control: 0, transition: 0 };
      allGames.forEach(g => {
        if (g.topic && g.lastUsed) topicCounts[g.topic]++;
      });
      const minTopic = Object.keys(topicCounts).reduce((min, t) =>
        topicCounts[t] < topicCounts[min] ? t : min
      );
      if (game.topic === minTopic) {
        score += 10;
        reasons.push('balance_training');
      }

      return { ...game, score, reasons };
    });

    // Sort by score and add some randomness using daily seed
    scoredGames.sort((a, b) => b.score - a.score);

    // Get top 10 scored games, then pick based on daily seed
    const topGames = scoredGames.slice(0, Math.min(10, scoredGames.length));
    const selectedIndex = dailySeed % topGames.length;
    const selectedGame = topGames[selectedIndex];

    // Generate a reason message
    let reasonMessage = 'Great game to practice today!';
    if (selectedGame.reasons.includes('never_used')) {
      reasonMessage = "You've never tried this game — give it a shot!";
    } else if (selectedGame.reasons.includes('highly_effective')) {
      reasonMessage = 'This game has been highly effective for you.';
    } else if (selectedGame.reasons.includes('not_used_recently')) {
      reasonMessage = "It's been a while since you used this one.";
    } else if (selectedGame.reasons.includes('favorite')) {
      reasonMessage = 'One of your favorites!';
    } else if (selectedGame.reasons.includes('balance_training')) {
      reasonMessage = 'Good for balancing your training focus.';
    }

    res.json({
      game: {
        _id: selectedGame._id,
        name: selectedGame.name,
        topic: selectedGame.topic,
        position: selectedGame.position,
        favorite: selectedGame.favorite,
        rating: selectedGame.rating,
        averageEffectiveness: selectedGame.averageEffectiveness,
        lastUsed: selectedGame.lastUsed,
        usageCount: selectedGame.usageCount
      },
      reason: reasonMessage,
      date: today.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Get game of the day error:', error);
    res.status(500).json({ message: 'Server error getting game of the day' });
  }
});

// @route   GET /api/games/recommendations
// @desc    Get adaptive training recommendations based on user's training patterns
// @access  Private
router.get('/recommendations', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const recommendations = [];

    // Get all user's games
    const allGames = await Game.find({ user: userId }).lean();

    if (allGames.length === 0) {
      return res.json({
        recommendations: [{
          type: 'getting_started',
          priority: 'high',
          title: 'Welcome to Ecogram!',
          message: 'Create your first training game to get started with personalized recommendations.',
          action: { type: 'create_game', label: 'Create Game' },
          icon: 'rocket'
        }],
        insights: {
          totalGames: 0,
          daysSinceLastTraining: null,
          trainingStreak: 0,
          topicsBalance: {}
        }
      });
    }

    // Calculate time-based metrics
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Games used in different time periods
    const gamesUsedToday = allGames.filter(g => g.lastUsed && new Date(g.lastUsed) > oneDayAgo);
    const gamesUsedThisWeek = allGames.filter(g => g.lastUsed && new Date(g.lastUsed) > oneWeekAgo);
    const gamesUsedThisMonth = allGames.filter(g => g.lastUsed && new Date(g.lastUsed) > oneMonthAgo);
    const neverUsedGames = allGames.filter(g => !g.lastUsed);

    // Calculate days since last training
    const lastUsedDates = allGames
      .filter(g => g.lastUsed)
      .map(g => new Date(g.lastUsed))
      .sort((a, b) => b - a);

    const daysSinceLastTraining = lastUsedDates.length > 0
      ? Math.floor((now - lastUsedDates[0]) / (24 * 60 * 60 * 1000))
      : null;

    // Calculate training streak
    const uniqueTrainingDays = [...new Set(
      allGames
        .filter(g => g.lastUsed)
        .map(g => new Date(g.lastUsed).toDateString())
    )].sort((a, b) => new Date(b) - new Date(a));

    let trainingStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (const dateStr of uniqueTrainingDays) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((checkDate - date) / (24 * 60 * 60 * 1000));

      if (diffDays <= 1) {
        trainingStreak++;
        checkDate = date;
      } else {
        break;
      }
    }

    // Topic distribution
    const topicCounts = { offensive: 0, defensive: 0, control: 0, transition: 0 };
    const topicUsage = { offensive: 0, defensive: 0, control: 0, transition: 0 };
    const topicLastUsed = { offensive: null, defensive: null, control: null, transition: null };

    allGames.forEach(game => {
      if (game.topic) {
        topicCounts[game.topic]++;
        if (game.lastUsed) {
          topicUsage[game.topic]++;
          const lastUsed = new Date(game.lastUsed);
          if (!topicLastUsed[game.topic] || lastUsed > topicLastUsed[game.topic]) {
            topicLastUsed[game.topic] = lastUsed;
          }
        }
      }
    });

    const totalGames = allGames.length;
    const topics = ['offensive', 'defensive', 'control', 'transition'];
    const topicLabels = {
      offensive: 'Submissions & Attacks',
      defensive: 'Defense & Escapes',
      control: 'Control & Passing',
      transition: 'Transitions & Scrambles'
    };

    // Position distribution
    const positionCounts = {};
    const positionLastUsed = {};
    allGames.forEach(game => {
      if (game.position) {
        positionCounts[game.position] = (positionCounts[game.position] || 0) + 1;
        if (game.lastUsed) {
          const lastUsed = new Date(game.lastUsed);
          if (!positionLastUsed[game.position] || lastUsed > positionLastUsed[game.position]) {
            positionLastUsed[game.position] = lastUsed;
          }
        }
      }
    });

    // High-effectiveness games not used recently
    const highEffectivenessGames = allGames
      .filter(g => g.averageEffectiveness >= 4 && g.lastUsed)
      .sort((a, b) => new Date(a.lastUsed) - new Date(b.lastUsed));

    // Favorite games not used recently
    const neglectedFavorites = allGames
      .filter(g => g.favorite && (!g.lastUsed || new Date(g.lastUsed) < twoWeeksAgo))
      .slice(0, 3);

    // === GENERATE RECOMMENDATIONS ===

    // 1. Haven't trained today
    if (daysSinceLastTraining === null || daysSinceLastTraining >= 1) {
      const daysText = daysSinceLastTraining === null
        ? "You haven't started training yet"
        : daysSinceLastTraining === 1
          ? "You didn't train yesterday"
          : `It's been ${daysSinceLastTraining} days since your last training`;

      recommendations.push({
        type: 'training_reminder',
        priority: daysSinceLastTraining >= 3 ? 'high' : 'medium',
        title: 'Time to Train!',
        message: daysText + '. Keep your streak alive!',
        action: { type: 'quick_session', label: 'Start Session' },
        icon: 'fire',
        streak: trainingStreak
      });
    }

    // 2. Neglected topics (not trained in 2+ weeks)
    for (const topic of topics) {
      const lastUsed = topicLastUsed[topic];
      const count = topicCounts[topic];

      if (count > 0 && (!lastUsed || new Date(lastUsed) < twoWeeksAgo)) {
        const daysSince = lastUsed
          ? Math.floor((now - new Date(lastUsed)) / (24 * 60 * 60 * 1000))
          : null;

        recommendations.push({
          type: 'neglected_topic',
          priority: 'high',
          title: `${topicLabels[topic]} Needs Attention`,
          message: daysSince
            ? `You haven't trained ${topicLabels[topic].toLowerCase()} in ${daysSince} days. You have ${count} games available.`
            : `You have ${count} ${topicLabels[topic].toLowerCase()} games you've never used!`,
          action: { type: 'filter_topic', topic, label: `Train ${topic}` },
          icon: 'target',
          topic,
          gamesAvailable: count
        });
      }
    }

    // 3. Imbalanced topics (< 15% of library)
    for (const topic of topics) {
      const percentage = (topicCounts[topic] / totalGames) * 100;
      if (percentage < 15 && topicCounts[topic] < 3) {
        recommendations.push({
          type: 'topic_gap',
          priority: 'medium',
          title: `Build Your ${topicLabels[topic]} Library`,
          message: `Only ${topicCounts[topic]} games (${Math.round(percentage)}%) in ${topicLabels[topic].toLowerCase()}. Consider adding more for balanced training.`,
          action: { type: 'ai_generate', topic, label: 'Generate with AI' },
          icon: 'sparkles',
          topic,
          currentCount: topicCounts[topic],
          percentage: Math.round(percentage)
        });
      }
    }

    // 4. High-effectiveness games to revisit
    if (highEffectivenessGames.length > 0) {
      const game = highEffectivenessGames[0];
      const daysSince = Math.floor((now - new Date(game.lastUsed)) / (24 * 60 * 60 * 1000));

      if (daysSince >= 7) {
        recommendations.push({
          type: 'revisit_effective',
          priority: 'medium',
          title: 'Revisit a Top Performer',
          message: `"${game.name}" has ${game.averageEffectiveness}/5 effectiveness but hasn't been used in ${daysSince} days.`,
          action: { type: 'use_game', gameId: game._id, label: 'Use This Game' },
          icon: 'star',
          game: {
            _id: game._id,
            name: game.name,
            topic: game.topic,
            effectiveness: game.averageEffectiveness
          }
        });
      }
    }

    // 5. Neglected favorites
    if (neglectedFavorites.length > 0) {
      const game = neglectedFavorites[0];
      recommendations.push({
        type: 'neglected_favorite',
        priority: 'low',
        title: 'Your Favorites Miss You',
        message: `"${game.name}" is a favorite but ${game.lastUsed ? "hasn't been used in a while" : "has never been used"}.`,
        action: { type: 'use_game', gameId: game._id, label: 'Use This Game' },
        icon: 'heart',
        game: {
          _id: game._id,
          name: game.name,
          topic: game.topic
        }
      });
    }

    // 6. Try something new (never-used games)
    if (neverUsedGames.length > 5) {
      const randomUnused = neverUsedGames[Math.floor(Math.random() * neverUsedGames.length)];
      recommendations.push({
        type: 'try_new',
        priority: 'low',
        title: 'Try Something New',
        message: `You have ${neverUsedGames.length} games you've never tried. How about "${randomUnused.name}"?`,
        action: { type: 'use_game', gameId: randomUnused._id, label: 'Try It' },
        icon: 'lightbulb',
        game: {
          _id: randomUnused._id,
          name: randomUnused.name,
          topic: randomUnused.topic
        },
        unusedCount: neverUsedGames.length
      });
    }

    // 7. Streak encouragement
    if (trainingStreak >= 3) {
      recommendations.push({
        type: 'streak_celebration',
        priority: 'low',
        title: `${trainingStreak} Day Streak!`,
        message: trainingStreak >= 7
          ? "You're on fire! Keep the momentum going!"
          : "Great consistency! Keep training to build your streak.",
        icon: 'trophy',
        streak: trainingStreak
      });
    }

    // 8. Suggest building a session if user has enough games
    if (totalGames >= 5 && gamesUsedThisWeek.length < 3) {
      recommendations.push({
        type: 'build_session',
        priority: 'medium',
        title: 'Plan Your Training',
        message: 'Create a structured session to get the most out of your practice time.',
        action: { type: 'create_session', label: 'Build Session' },
        icon: 'clipboard'
      });
    }

    // Sort recommendations by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Calculate topic balance scores (0-100)
    const topicsBalance = {};
    const idealPercentage = 25; // Perfect balance would be 25% each
    for (const topic of topics) {
      const percentage = (topicCounts[topic] / Math.max(totalGames, 1)) * 100;
      const deviation = Math.abs(percentage - idealPercentage);
      topicsBalance[topic] = {
        count: topicCounts[topic],
        percentage: Math.round(percentage),
        usageCount: topicUsage[topic],
        lastUsed: topicLastUsed[topic],
        balanceScore: Math.max(0, 100 - deviation * 2) // Higher is better
      };
    }

    // Simplified topic balance for frontend (just percentages)
    const topicBalance = {};
    for (const topic of topics) {
      const percentage = (topicCounts[topic] / Math.max(totalGames, 1)) * 100;
      topicBalance[topic] = Math.round(percentage);
    }

    res.json({
      recommendations: recommendations.slice(0, 5), // Return top 5 recommendations
      insights: {
        totalGames,
        gamesUsedToday: gamesUsedToday.length,
        gamesUsedThisWeek: gamesUsedThisWeek.length,
        gamesUsedThisMonth: gamesUsedThisMonth.length,
        neverUsedCount: neverUsedGames.length,
        daysSinceLastTraining,
        trainingStreak,
        topicsBalance,
        topicBalance, // Simplified version for SmartTrainingHub
        positionCoverage: Object.keys(positionCounts).length,
        totalPositions: Object.keys(positionCounts).length
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error generating recommendations' });
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

    // Position distribution
    const positionDistribution = await Game.aggregate([
      { $match: { user: userId, position: { $ne: '' } } },
      { $group: { _id: '$position', count: { $sum: 1 } } }
    ]);

    // Count games with positions
    const gamesWithPositions = await Game.countDocuments({
      user: userId,
      position: { $ne: '' }
    });

    res.json({
      totalGames,
      favoriteCount,
      usedCount,
      gamesWithPositions,
      topicDistribution: topicDistribution.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      positionDistribution: positionDistribution.reduce((acc, item) => {
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

      // Parse techniques - handle both array and string formats
      let techniques = [];
      if (Array.isArray(gameData.techniques)) {
        techniques = gameData.techniques;
      } else if (typeof gameData.techniques === 'string') {
        techniques = gameData.techniques
          .split(/[,\s]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
      }

      const game = await Game.create({
        user: req.user._id,
        name: gameData.name || 'Imported Game',
        topic: mappedTopic,
        topPlayer: gameData.topPlayer || '',
        bottomPlayer: gameData.bottomPlayer || '',
        coaching: coaching.trim(),
        skills: skills,
        position: gameData.position || '',
        techniques: techniques,
        gameType: gameData.gameType || 'main',
        difficulty: gameData.difficulty || 'intermediate',
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

// @route   DELETE /api/games/all
// @desc    Delete all games for user (empty library)
// @access  Private
router.delete('/all', protect, async (req, res) => {
  try {
    const result = await Game.deleteMany({ user: req.user._id });
    res.json({
      message: `Deleted all ${result.deletedCount} games`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete all games error:', error);
    res.status(500).json({ message: 'Server error deleting all games' });
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
