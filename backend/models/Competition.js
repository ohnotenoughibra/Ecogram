const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Competition name is required'],
    trim: true,
    maxlength: [100, 'Competition name cannot exceed 100 characters']
  },
  date: {
    type: Date,
    required: [true, 'Competition date is required']
  },
  location: {
    type: String,
    default: '',
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  weightClass: {
    type: String,
    default: ''
  },
  targetWeight: {
    type: Number,
    default: null
  },
  division: {
    type: String,
    enum: ['gi', 'nogi', 'both'],
    default: 'nogi'
  },
  category: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'pro'],
    default: 'intermediate'
  },
  focusAreas: [{
    type: String,
    enum: ['offensive', 'defensive', 'control', 'transition', 'competition']
  }],
  // Weight tracking entries
  weightLog: [{
    weight: Number,
    date: { type: Date, default: Date.now },
    notes: String
  }],
  // Training sessions specifically for this competition
  trainingSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  // Notes and strategy
  gameplan: {
    type: String,
    default: '',
    maxlength: [5000, 'Gameplan cannot exceed 5000 characters']
  },
  opponents: [{
    name: String,
    notes: String,
    videoUrl: String
  }],
  // Status
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  result: {
    placement: String,
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    notes: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
competitionSchema.index({ user: 1, date: 1 });
competitionSchema.index({ user: 1, isActive: 1 });

// Virtual to get days until competition
competitionSchema.virtual('daysUntil').get(function() {
  if (!this.date) return null;
  const now = new Date();
  const compDate = new Date(this.date);
  const diffTime = compDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included
competitionSchema.set('toJSON', { virtuals: true });
competitionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Competition', competitionSchema);
