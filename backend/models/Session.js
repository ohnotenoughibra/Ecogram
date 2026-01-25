const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Session name is required'],
    trim: true,
    maxlength: [100, 'Session name cannot exceed 100 characters']
  },
  games: [{
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    },
    order: Number,
    completed: {
      type: Boolean,
      default: false
    },
    notes: String
  }],
  favorite: {
    type: Boolean,
    default: false
  },
  lastUsed: {
    type: Date,
    default: null
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  // For sharing
  shareId: {
    type: String,
    unique: true,
    sparse: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  // For real-time collaboration
  activeTimer: {
    isRunning: { type: Boolean, default: false },
    startTime: { type: Date, default: null },
    duration: { type: Number, default: 300 }, // seconds
    currentGameIndex: { type: Number, default: 0 }
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'viewer'
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
sessionSchema.index({ user: 1, favorite: 1 });
sessionSchema.index({ user: 1, scheduledDate: 1 });
sessionSchema.index({ shareId: 1 });

// Generate share ID
sessionSchema.methods.generateShareId = function() {
  this.shareId = uuidv4();
  this.isPublic = true;
  return this.shareId;
};

// Virtual to get game count
sessionSchema.virtual('gameCount').get(function() {
  return this.games.length;
});

// Ensure virtuals are included in JSON
sessionSchema.set('toJSON', { virtuals: true });
sessionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Session', sessionSchema);
