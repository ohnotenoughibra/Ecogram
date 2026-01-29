const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const Session = require('../models/Session');
const { protect, optionalAuth } = require('../middleware/auth');

// @route   POST /api/share/game/:id
// @desc    Generate share link for a game
// @access  Private
router.post('/game/:id', protect, async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, user: req.user._id });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const shareId = game.generateShareId();
    await game.save();

    const shareUrl = `${process.env.FRONTEND_URL}/shared/game/${shareId}`;

    res.json({
      shareId,
      shareUrl,
      message: 'Share link generated successfully'
    });
  } catch (error) {
    console.error('Share game error:', error);
    res.status(500).json({ message: 'Server error generating share link' });
  }
});

// @route   DELETE /api/share/game/:id
// @desc    Remove share link for a game
// @access  Private
router.delete('/game/:id', protect, async (req, res) => {
  try {
    const game = await Game.findOne({ _id: req.params.id, user: req.user._id });

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    game.shareId = undefined;
    game.isPublic = false;
    await game.save();

    res.json({ message: 'Share link removed' });
  } catch (error) {
    console.error('Unshare game error:', error);
    res.status(500).json({ message: 'Server error removing share link' });
  }
});

// @route   GET /api/share/game/:shareId
// @desc    Get shared game by share ID (public)
// @access  Public
router.get('/game/:shareId', optionalAuth, async (req, res) => {
  try {
    const game = await Game.findOne({
      shareId: req.params.shareId,
      isPublic: true
    }).populate('user', 'username');

    if (!game) {
      return res.status(404).json({ message: 'Shared game not found' });
    }

    res.json({
      game,
      canCopy: !!req.user,
      isOwner: req.user && game.user._id.toString() === req.user._id.toString()
    });
  } catch (error) {
    console.error('Get shared game error:', error);
    res.status(500).json({ message: 'Server error fetching shared game' });
  }
});

// @route   POST /api/share/game/:shareId/copy
// @desc    Copy a shared game to user's library
// @access  Private
router.post('/game/:shareId/copy', protect, async (req, res) => {
  try {
    const originalGame = await Game.findOne({
      shareId: req.params.shareId,
      isPublic: true
    });

    if (!originalGame) {
      return res.status(404).json({ message: 'Shared game not found' });
    }

    // Create a copy for the user
    const newGame = await Game.create({
      user: req.user._id,
      name: `${originalGame.name} (Copied)`,
      topic: originalGame.topic,
      topPlayer: originalGame.topPlayer,
      bottomPlayer: originalGame.bottomPlayer,
      coaching: originalGame.coaching,
      skills: originalGame.skills,
      aiGenerated: originalGame.aiGenerated,
      aiMetadata: originalGame.aiMetadata
    });

    res.status(201).json({
      message: 'Game copied to your library',
      game: newGame
    });
  } catch (error) {
    console.error('Copy shared game error:', error);
    res.status(500).json({ message: 'Server error copying game' });
  }
});

// @route   POST /api/share/session/:id
// @desc    Generate share link for a session
// @access  Private
router.post('/session/:id', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const shareId = session.generateShareId();
    await session.save();

    const shareUrl = `${process.env.FRONTEND_URL}/shared/session/${shareId}`;

    res.json({
      shareId,
      shareUrl,
      message: 'Share link generated successfully'
    });
  } catch (error) {
    console.error('Share session error:', error);
    res.status(500).json({ message: 'Server error generating share link' });
  }
});

// @route   DELETE /api/share/session/:id
// @desc    Remove share link for a session
// @access  Private
router.delete('/session/:id', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.shareId = undefined;
    session.isPublic = false;
    await session.save();

    res.json({ message: 'Share link removed' });
  } catch (error) {
    console.error('Unshare session error:', error);
    res.status(500).json({ message: 'Server error removing share link' });
  }
});

// @route   GET /api/share/session/:shareId
// @desc    Get shared session by share ID (public)
// @access  Public
router.get('/session/:shareId', optionalAuth, async (req, res) => {
  try {
    const session = await Session.findOne({
      shareId: req.params.shareId,
      isPublic: true
    })
      .populate('user', 'username')
      .populate('games.game');

    if (!session) {
      return res.status(404).json({ message: 'Shared session not found' });
    }

    res.json({
      session,
      canCopy: !!req.user,
      isOwner: req.user && session.user._id.toString() === req.user._id.toString()
    });
  } catch (error) {
    console.error('Get shared session error:', error);
    res.status(500).json({ message: 'Server error fetching shared session' });
  }
});

// @route   POST /api/share/session/:shareId/copy
// @desc    Copy a shared session (and its games) to user's library
// @access  Private
router.post('/session/:shareId/copy', protect, async (req, res) => {
  try {
    const originalSession = await Session.findOne({
      shareId: req.params.shareId,
      isPublic: true
    }).populate('games.game');

    if (!originalSession) {
      return res.status(404).json({ message: 'Shared session not found' });
    }

    // First, copy all the games
    const copiedGames = [];
    for (const gameEntry of originalSession.games) {
      if (gameEntry.game) {
        const newGame = await Game.create({
          user: req.user._id,
          name: gameEntry.game.name,
          topic: gameEntry.game.topic,
          topPlayer: gameEntry.game.topPlayer,
          bottomPlayer: gameEntry.game.bottomPlayer,
          coaching: gameEntry.game.coaching,
          skills: gameEntry.game.skills,
          aiGenerated: gameEntry.game.aiGenerated,
          aiMetadata: gameEntry.game.aiMetadata
        });
        copiedGames.push({
          game: newGame._id,
          order: gameEntry.order,
          completed: false
        });
      }
    }

    // Create the session with copied games
    const newSession = await Session.create({
      user: req.user._id,
      name: `${originalSession.name} (Copied)`,
      games: copiedGames
    });

    const populatedSession = await Session.findById(newSession._id)
      .populate('games.game');

    res.status(201).json({
      message: 'Session and games copied to your library',
      session: populatedSession
    });
  } catch (error) {
    console.error('Copy shared session error:', error);
    res.status(500).json({ message: 'Server error copying session' });
  }
});

// @route   POST /api/share/session/:id/collaborator
// @desc    Add a collaborator to a session
// @access  Private
router.post('/session/:id/collaborator', protect, async (req, res) => {
  try {
    const { userId, role = 'viewer' } = req.body;

    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if collaborator already exists
    const existingCollab = session.collaborators.find(
      c => c.user.toString() === userId
    );

    if (existingCollab) {
      existingCollab.role = role;
    } else {
      session.collaborators.push({ user: userId, role });
    }

    await session.save();

    res.json({ message: 'Collaborator added', collaborators: session.collaborators });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({ message: 'Server error adding collaborator' });
  }
});

// @route   DELETE /api/share/session/:id/collaborator/:userId
// @desc    Remove a collaborator from a session
// @access  Private
router.delete('/session/:id/collaborator/:userId', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.collaborators = session.collaborators.filter(
      c => c.user.toString() !== req.params.userId
    );

    await session.save();

    res.json({ message: 'Collaborator removed', collaborators: session.collaborators });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ message: 'Server error removing collaborator' });
  }
});

module.exports = router;
