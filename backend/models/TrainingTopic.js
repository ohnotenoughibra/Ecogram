const mongoose = require('mongoose');

const trainingTopicSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true,
    maxlength: [100, 'Topic name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  color: {
    type: String,
    default: '#6366f1', // Primary purple
    match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid color format']
  },
  category: {
    type: String,
    enum: ['offensive', 'defensive', 'control', 'transition', 'competition', 'fundamentals', 'custom'],
    default: 'custom'
  },
  goals: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
trainingTopicSchema.index({ user: 1, startDate: 1, endDate: 1 });
trainingTopicSchema.index({ user: 1, isActive: 1 });

// Virtual to check if topic is current
trainingTopicSchema.virtual('isCurrent').get(function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
});

// Static method to get current topic for a user
trainingTopicSchema.statics.getCurrentTopic = async function(userId) {
  const now = new Date();
  return this.findOne({
    user: userId,
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true
  }).sort({ startDate: -1 });
};

// Static method to get topics for a date range
trainingTopicSchema.statics.getTopicsInRange = async function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    isActive: true,
    $or: [
      // Topic starts within range
      { startDate: { $gte: startDate, $lte: endDate } },
      // Topic ends within range
      { endDate: { $gte: startDate, $lte: endDate } },
      // Topic spans the entire range
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
    ]
  }).sort({ startDate: 1 });
};

// Ensure virtuals are included in JSON
trainingTopicSchema.set('toJSON', { virtuals: true });
trainingTopicSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TrainingTopic', trainingTopicSchema);
