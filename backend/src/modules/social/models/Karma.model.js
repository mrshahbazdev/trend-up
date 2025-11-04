const mongoose = require('mongoose');

const karmaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Karma Points
  totalKarma: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Karma Breakdown by Category
  karmaBreakdown: {
    posts: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    reactions: {
      type: Number,
      default: 0
    },
    predictions: {
      type: Number,
      default: 0
    },
    polls: {
      type: Number,
      default: 0
    },
    moderation: {
      type: Number,
      default: 0
    }
  },
  
  // Current Level
  currentLevel: {
    type: String,
    enum: [
      'NEWBIE',      // 0-99
      'EXPLORER',    // 100-299
      'CONTRIBUTOR', // 300-699
      'INFLUENCER',  // 700-1499
      'EXPERT',      // 1500-2999
      'LEGEND',      // 3000-5999
      'TITAN'        // 6000+
    ],
    default: 'NEWBIE'
  },
  
  // Level Progress
  levelProgress: {
    currentLevelKarma: {
      type: Number,
      default: 0
    },
    nextLevelKarma: {
      type: Number,
      default: 100
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Badges Earned
  badges: [{
    badgeId: {
      type: String,
      required: true
    },
    badgeName: {
      type: String,
      required: true
    },
    badgeDescription: {
      type: String,
      required: true
    },
    badgeIcon: {
      type: String,
      required: true
    },
    badgeColor: {
      type: String,
      required: true
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      enum: ['POSTING', 'ENGAGEMENT', 'PREDICTION', 'MODERATION', 'SPECIAL'],
      required: true
    }
  }],
  
  // Unlockable Reactions (based on karma level)
  unlockedReactions: [{
    reactionType: {
      type: String,
      required: true
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    requiredLevel: {
      type: String,
      required: true
    }
  }],
  
  // Karma History (for analytics)
  karmaHistory: [{
    action: {
      type: String,
      required: true,
      enum: ['EARNED', 'DEDUCTED', 'BONUS', 'PENALTY']
    },
    amount: {
      type: Number,
      required: true
    },
    source: {
      type: String,
      required: true,
      enum: ['POST', 'COMMENT', 'REACTION', 'PREDICTION', 'POLL', 'MODERATION', 'BONUS', 'PENALTY']
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    description: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statistics
  stats: {
    postsCreated: {
      type: Number,
      default: 0
    },
    commentsCreated: {
      type: Number,
      default: 0
    },
    reactionsGiven: {
      type: Number,
      default: 0
    },
    reactionsReceived: {
      type: Number,
      default: 0
    },
    predictionsMade: {
      type: Number,
      default: 0
    },
    predictionsCorrect: {
      type: Number,
      default: 0
    },
    pollsCreated: {
      type: Number,
      default: 0
    },
    moderationActions: {
      type: Number,
      default: 0
    },
    trendingPosts: {
      type: Number,
      default: 0
    },
    streakDays: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Special Privileges
  privileges: {
    canModerate: {
      type: Boolean,
      default: false
    },
    canCreatePolls: {
      type: Boolean,
      default: true
    },
    canCreatePredictions: {
      type: Boolean,
      default: false
    },
    canUseAdvancedReactions: {
      type: Boolean,
      default: false
    },
    canCreateTopics: {
      type: Boolean,
      default: false
    },
    canAccessAnalytics: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
karmaSchema.index({ userId: 1 });
karmaSchema.index({ totalKarma: -1 });
karmaSchema.index({ currentLevel: 1 });
karmaSchema.index({ 'badges.badgeId': 1 });
karmaSchema.index({ 'karmaHistory.timestamp': -1 });

// Virtual for karma rank (calculated based on total karma)
karmaSchema.virtual('rank').get(function() {
  // This would be calculated by a separate service that ranks all users
  return null; // Will be populated by karma service
});

// Virtual for next level info
karmaSchema.virtual('nextLevelInfo').get(function() {
  const levels = {
    'NEWBIE': { min: 0, max: 99, next: 'EXPLORER' },
    'EXPLORER': { min: 100, max: 299, next: 'CONTRIBUTOR' },
    'CONTRIBUTOR': { min: 300, max: 699, next: 'INFLUENCER' },
    'INFLUENCER': { min: 700, max: 1499, next: 'EXPERT' },
    'EXPERT': { min: 1500, max: 2999, next: 'LEGEND' },
    'LEGEND': { min: 3000, max: 5999, next: 'TITAN' },
    'TITAN': { min: 6000, max: Infinity, next: null }
  };
  
  const currentLevelInfo = levels[this.currentLevel];
  const nextLevelInfo = currentLevelInfo.next ? levels[currentLevelInfo.next] : null;
  
  return {
    current: {
      name: this.currentLevel,
      min: currentLevelInfo.min,
      max: currentLevelInfo.max
    },
    next: nextLevelInfo ? {
      name: currentLevelInfo.next,
      min: nextLevelInfo.min,
      max: nextLevelInfo.max
    } : null
  };
});

// Static method to get karma leaderboard
karmaSchema.statics.getLeaderboard = async function(limit = 50, offset = 0) {
  return await this.find()
    .populate('userId', 'name username email avatar')
    .sort({ totalKarma: -1 })
    .limit(limit)
    .skip(offset)
    .lean();
};

// Static method to get users by level
karmaSchema.statics.getUsersByLevel = async function(level, limit = 50, offset = 0) {
  return await this.find({ currentLevel: level })
    .populate('userId', 'name username email avatar')
    .sort({ totalKarma: -1 })
    .limit(limit)
    .skip(offset)
    .lean();
};

// Static method to get karma statistics
karmaSchema.statics.getKarmaStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        averageKarma: { $avg: '$totalKarma' },
        maxKarma: { $max: '$totalKarma' },
        minKarma: { $min: '$totalKarma' },
        levelDistribution: {
          $push: '$currentLevel'
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalUsers: 0,
      averageKarma: 0,
      maxKarma: 0,
      minKarma: 0,
      levelDistribution: {}
    };
  }
  
  const result = stats[0];
  const levelCounts = result.levelDistribution.reduce((acc, level) => {
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalUsers: result.totalUsers,
    averageKarma: Math.round(result.averageKarma),
    maxKarma: result.maxKarma,
    minKarma: result.minKarma,
    levelDistribution: levelCounts
  };
};

// Pre-save middleware to update level and progress
karmaSchema.pre('save', function(next) {
  // Update current level based on total karma
  const levels = {
    'NEWBIE': { min: 0, max: 99 },
    'EXPLORER': { min: 100, max: 299 },
    'CONTRIBUTOR': { min: 300, max: 699 },
    'INFLUENCER': { min: 700, max: 1499 },
    'EXPERT': { min: 1500, max: 2999 },
    'LEGEND': { min: 3000, max: 5999 },
    'TITAN': { min: 6000, max: Infinity }
  };
  
  let newLevel = 'NEWBIE';
  for (const [level, range] of Object.entries(levels)) {
    if (this.totalKarma >= range.min && this.totalKarma <= range.max) {
      newLevel = level;
      break;
    }
  }
  
  // Update level if changed
  if (this.currentLevel !== newLevel) {
    this.currentLevel = newLevel;
    this.updatePrivileges();
  }
  
  // Update level progress
  const currentLevelInfo = levels[newLevel];
  const nextLevelInfo = Object.entries(levels).find(([level, range]) => range.min > currentLevelInfo.max);
  
  this.levelProgress.currentLevelKarma = this.totalKarma - currentLevelInfo.min;
  this.levelProgress.nextLevelKarma = nextLevelInfo ? nextLevelInfo[1].min : currentLevelInfo.max;
  this.levelProgress.progressPercentage = nextLevelInfo 
    ? Math.round((this.levelProgress.currentLevelKarma / (nextLevelInfo[1].min - currentLevelInfo.min)) * 100)
    : 100;
  
  next();
});

// Method to update privileges based on level
karmaSchema.methods.updatePrivileges = function() {
  const levelPrivileges = {
    'NEWBIE': {
      canModerate: false,
      canCreatePolls: true,
      canCreatePredictions: false,
      canUseAdvancedReactions: false,
      canCreateTopics: false,
      canAccessAnalytics: false
    },
    'EXPLORER': {
      canModerate: false,
      canCreatePolls: true,
      canCreatePredictions: false,
      canUseAdvancedReactions: true,
      canCreateTopics: false,
      canAccessAnalytics: false
    },
    'CONTRIBUTOR': {
      canModerate: false,
      canCreatePolls: true,
      canCreatePredictions: true,
      canUseAdvancedReactions: true,
      canCreateTopics: false,
      canAccessAnalytics: false
    },
    'INFLUENCER': {
      canModerate: false,
      canCreatePolls: true,
      canCreatePredictions: true,
      canUseAdvancedReactions: true,
      canCreateTopics: true,
      canAccessAnalytics: false
    },
    'EXPERT': {
      canModerate: true,
      canCreatePolls: true,
      canCreatePredictions: true,
      canUseAdvancedReactions: true,
      canCreateTopics: true,
      canAccessAnalytics: true
    },
    'LEGEND': {
      canModerate: true,
      canCreatePolls: true,
      canCreatePredictions: true,
      canUseAdvancedReactions: true,
      canCreateTopics: true,
      canAccessAnalytics: true
    },
    'TITAN': {
      canModerate: true,
      canCreatePolls: true,
      canCreatePredictions: true,
      canUseAdvancedReactions: true,
      canCreateTopics: true,
      canAccessAnalytics: true
    }
  };
  
  this.privileges = levelPrivileges[this.currentLevel];
};

// Method to add karma
karmaSchema.methods.addKarma = function(amount, source, sourceId, description) {
  this.totalKarma += amount;
  
  // Add to karma history
  this.karmaHistory.push({
    action: 'EARNED',
    amount,
    source,
    sourceId,
    description,
    timestamp: new Date()
  });
  
  // Keep only last 100 karma history entries
  if (this.karmaHistory.length > 100) {
    this.karmaHistory = this.karmaHistory.slice(-100);
  }
  
  return this.save();
};

// Method to deduct karma
karmaSchema.methods.deductKarma = function(amount, source, sourceId, description) {
  this.totalKarma = Math.max(0, this.totalKarma - amount);
  
  // Add to karma history
  this.karmaHistory.push({
    action: 'DEDUCTED',
    amount,
    source,
    sourceId,
    description,
    timestamp: new Date()
  });
  
  // Keep only last 100 karma history entries
  if (this.karmaHistory.length > 100) {
    this.karmaHistory = this.karmaHistory.slice(-100);
  }
  
  return this.save();
};

// Method to check if user has badge
karmaSchema.methods.hasBadge = function(badgeId) {
  return this.badges.some(badge => badge.badgeId === badgeId);
};

// Method to add badge
karmaSchema.methods.addBadge = function(badgeId, badgeName, badgeDescription, badgeIcon, badgeColor, category) {
  if (!this.hasBadge(badgeId)) {
    this.badges.push({
      badgeId,
      badgeName,
      badgeDescription,
      badgeIcon,
      badgeColor,
      category,
      earnedAt: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to check if reaction is unlocked
karmaSchema.methods.hasUnlockedReaction = function(reactionType) {
  return this.unlockedReactions.some(reaction => reaction.reactionType === reactionType);
};

// Method to unlock reaction
karmaSchema.methods.unlockReaction = function(reactionType, requiredLevel) {
  if (!this.hasUnlockedReaction(reactionType)) {
    this.unlockedReactions.push({
      reactionType,
      requiredLevel,
      unlockedAt: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Karma', karmaSchema);
