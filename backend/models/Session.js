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
  }],
  // Template support
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateName: {
    type: String,
    default: '',
    maxlength: [100, 'Template name cannot exceed 100 characters']
  },
  templateDescription: {
    type: String,
    default: '',
    maxlength: [500, 'Template description cannot exceed 500 characters']
  },
  // If created from a template, reference the original
  sourceTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  // Post-class notes and reflections
  postClassNotes: {
    type: String,
    default: '',
    maxlength: [3000, 'Post-class notes cannot exceed 3000 characters']
  },
  // What worked well
  whatWorked: {
    type: String,
    default: '',
    maxlength: [1000, 'What worked notes cannot exceed 1000 characters']
  },
  // What to improve
  whatToImprove: {
    type: String,
    default: '',
    maxlength: [1000, 'What to improve notes cannot exceed 1000 characters']
  },
  // Overall session effectiveness rating
  sessionEffectiveness: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  // Focus position for this session (for quick class builder)
  focusPosition: {
    type: String,
    default: ''
  },
  // Class completed status
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
sessionSchema.index({ user: 1, favorite: 1 });
sessionSchema.index({ user: 1, scheduledDate: 1 });
sessionSchema.index({ shareId: 1 });
sessionSchema.index({ user: 1, isTemplate: 1 });

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
