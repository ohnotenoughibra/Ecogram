/**
 * Seed script to populate default BJJ games
 * Run with: node seeds/seedGames.js
 * Or call initializeDefaultGames() from server startup
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const User = require('../models/User');
const Game = require('../models/Game');
const defaultGames = require('./defaultGames');

const DEFAULT_USER_EMAIL = 'default@ecogram.local';

/**
 * Get or create the default user
 */
async function getDefaultUser() {
  let user = await User.findOne({ email: DEFAULT_USER_EMAIL });
  if (!user) {
    user = await User.create({
      username: 'Coach',
      email: DEFAULT_USER_EMAIL,
      password: 'default-no-login-required'
    });
    console.log('Default user created');
  }
  return user;
}

/**
 * Seed default games for the default user
 * Only adds games that don't already exist (by name)
 */
async function seedDefaultGames(userId) {
  const existingGames = await Game.find({ user: userId }).select('name');
  const existingNames = new Set(existingGames.map(g => g.name.toLowerCase()));

  const newGames = defaultGames.filter(g => !existingNames.has(g.name.toLowerCase()));

  if (newGames.length === 0) {
    console.log('All default games already exist');
    return { added: 0, total: existingGames.length };
  }

  const gamesToInsert = newGames.map(game => ({
    ...game,
    user: userId
  }));

  const result = await Game.insertMany(gamesToInsert);
  console.log(`Added ${result.length} new default games`);

  return { added: result.length, total: existingGames.length + result.length };
}

/**
 * Initialize default games - call this on server startup
 */
async function initializeDefaultGames() {
  try {
    const user = await getDefaultUser();
    const result = await seedDefaultGames(user._id);
    return result;
  } catch (error) {
    console.error('Error initializing default games:', error.message);
    throw error;
  }
}

/**
 * Force reseed - removes all games and adds defaults again
 * Use with caution!
 */
async function forceReseed() {
  try {
    const user = await getDefaultUser();

    // Remove all games for default user
    const deleted = await Game.deleteMany({ user: user._id });
    console.log(`Deleted ${deleted.deletedCount} existing games`);

    // Add all default games
    const gamesToInsert = defaultGames.map(game => ({
      ...game,
      user: user._id
    }));

    const result = await Game.insertMany(gamesToInsert);
    console.log(`Added ${result.length} default games`);

    return { deleted: deleted.deletedCount, added: result.length };
  } catch (error) {
    console.error('Error force reseeding games:', error.message);
    throw error;
  }
}

// Run directly if called as script
if (require.main === module) {
  const args = process.argv.slice(2);
  const forceFlag = args.includes('--force') || args.includes('-f');

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecogram')
    .then(async () => {
      console.log('Connected to MongoDB');

      if (forceFlag) {
        console.log('Force reseeding all games...');
        const result = await forceReseed();
        console.log(`Done! Deleted ${result.deleted}, Added ${result.added}`);
      } else {
        console.log('Seeding default games (skipping existing)...');
        const result = await initializeDefaultGames();
        console.log(`Done! Added ${result.added} new games. Total: ${result.total}`);
      }

      process.exit(0);
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

module.exports = { initializeDefaultGames, seedDefaultGames, forceReseed };
