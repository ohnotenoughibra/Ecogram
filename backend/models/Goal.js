const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Goal title cannot exceed 100 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['sessions_per_week', 'sessions_per_month', 'topic_focus', 'games_used', 'streak', 'custom'],
    required: true
  },
  // Target configuration
  target: {
    value: { type: Number, required: true }, // e.g., 3 sessions per week
    period: { type: String, enum: ['day', 'week', 'month', 'total'], default: 'week' },
    topic: { type: String, enum: ['offensive', 'defensive', 'control', 'transition', 'any'], default: 'any' }
  },
  // Progress tracking
  progress: {
    current: { type: Number, default: 0 },
    history: [{
      value: Number,
      date: { type: Date, default: Date.now },
      periodStart: Date,
      periodEnd: Date
    }]
  },
  // Date range for the goal
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'failed'],
    default: 'active'
  },
  // Milestones
  milestones: [{
    title: String,
    targetValue: Number,
    achieved: { type: Boolean, default: false },
    achievedDate: Date
  }],
  // Streak tracking for streak-type goals
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date,
    default: null
  },
  // Notification preferences
  reminderEnabled: {
    type: Boolean,
    default: true
  },
  reminderTime: {
    type: String,
    default: '09:00'
  }
}, {
  timestamps: true
});

// Index for faster queries
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, type: 1 });

// Virtual to check if goal is achieved
goalSchema.virtual('isAchieved').get(function() {
  if (this.target.period === 'total') {
    return this.progress.current >= this.target.value;
  }
  return false;
});

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  if (!this.target.value) return 0;
  return Math.min(100, Math.round((this.progress.current / this.target.value) * 100));
});

goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Goal', goalSchema);
