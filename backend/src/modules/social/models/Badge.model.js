const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  badgeId: {
    type: String,
    required: true,
    unique: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  icon: {
    type: String,
    required: true
  },
  
  color: {
    type: String,
    required: true,
    default: '#3B82F6'
  },
  
  category: {
    type: String,
    required: true,
    enum: ['POSTING', 'ENGAGEMENT', 'PREDICTION', 'MODERATION', 'SPECIAL']
  },
  
  // Requirements to earn this badge
  requirements: {
    type: {
      type: String,
      required: true,
      enum: ['KARMA', 'POSTS', 'COMMENTS', 'REACTIONS', 'PREDICTIONS', 'POLLS', 'MODERATION', 'STREAK', 'CUSTOM']
    },
    value: {
      type: Number,
      required: true
    },
    timeframe: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'],
      default: 'ALL_TIME'
    },
    additionalConditions: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  // Badge rarity and prestige
  rarity: {
    type: String,
    enum: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'],
    default: 'COMMON'
  },
  
  // Karma reward for earning this badge
  karmaReward: {
    type: Number,
    default: 0
  },
  
  // Whether this badge can be earned multiple times
  repeatable: {
    type: Boolean,
    default: false
  },
  
  // Whether this badge is currently active/available
  active: {
    type: Boolean,
    default: true
  },
  
  // Badge unlock level requirement
  requiredLevel: {
    type: String,
    enum: ['NEWBIE', 'EXPLORER', 'CONTRIBUTOR', 'INFLUENCER', 'EXPERT', 'LEGEND', 'TITAN'],
    default: 'NEWBIE'
  },
  
  // Statistics
  stats: {
    totalEarned: {
      type: Number,
      default: 0
    },
    uniqueEarners: {
      type: Number,
      default: 0
    },
    lastEarned: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
badgeSchema.index({ badgeId: 1 });
badgeSchema.index({ category: 1 });
badgeSchema.index({ rarity: 1 });
badgeSchema.index({ active: 1 });
badgeSchema.index({ 'requirements.type': 1 });

// Virtual for badge rarity color
badgeSchema.virtual('rarityColor').get(function() {
  const rarityColors = {
    'COMMON': '#6B7280',
    'UNCOMMON': '#10B981',
    'RARE': '#3B82F6',
    'EPIC': '#8B5CF6',
    'LEGENDARY': '#F59E0B'
  };
  return rarityColors[this.rarity] || '#6B7280';
});

// Virtual for badge rarity multiplier
badgeSchema.virtual('rarityMultiplier').get(function() {
  const rarityMultipliers = {
    'COMMON': 1,
    'UNCOMMON': 1.5,
    'RARE': 2,
    'EPIC': 3,
    'LEGENDARY': 5
  };
  return rarityMultipliers[this.rarity] || 1;
});

// Static method to get badges by category
badgeSchema.statics.getBadgesByCategory = async function(category, active = true) {
  const query = { category };
  if (active !== null) {
    query.active = active;
  }
  
  return await this.find(query)
    .sort({ rarity: 1, karmaReward: -1 })
    .lean();
};

// Static method to get badges by rarity
badgeSchema.statics.getBadgesByRarity = async function(rarity, active = true) {
  const query = { rarity };
  if (active !== null) {
    query.active = active;
  }
  
  return await this.find(query)
    .sort({ karmaReward: -1 })
    .lean();
};

// Static method to get available badges for user level
badgeSchema.statics.getAvailableBadges = async function(userLevel, active = true) {
  const levelOrder = ['NEWBIE', 'EXPLORER', 'CONTRIBUTOR', 'INFLUENCER', 'EXPERT', 'LEGEND', 'TITAN'];
  const userLevelIndex = levelOrder.indexOf(userLevel);
  
  const query = {
    requiredLevel: { $in: levelOrder.slice(0, userLevelIndex + 1) }
  };
  
  if (active !== null) {
    query.active = active;
  }
  
  return await this.find(query)
    .sort({ category: 1, rarity: 1, karmaReward: -1 })
    .lean();
};

// Static method to get badge statistics
badgeSchema.statics.getBadgeStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalBadges: { $sum: 1 },
        activeBadges: {
          $sum: { $cond: ['$active', 1, 0] }
        },
        totalKarmaReward: { $sum: '$karmaReward' },
        categoryDistribution: {
          $push: '$category'
        },
        rarityDistribution: {
          $push: '$rarity'
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalBadges: 0,
      activeBadges: 0,
      totalKarmaReward: 0,
      categoryDistribution: {},
      rarityDistribution: {}
    };
  }
  
  const result = stats[0];
  
  const categoryCounts = result.categoryDistribution.reduce((acc, category) => {
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  
  const rarityCounts = result.rarityDistribution.reduce((acc, rarity) => {
    acc[rarity] = (acc[rarity] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalBadges: result.totalBadges,
    activeBadges: result.activeBadges,
    totalKarmaReward: result.totalKarmaReward,
    categoryDistribution: categoryCounts,
    rarityDistribution: rarityCounts
  };
};

// Method to check if user meets badge requirements
badgeSchema.methods.checkRequirements = async function(userKarma, userStats) {
  const { type, value, timeframe, additionalConditions } = this.requirements;
  
  switch (type) {
    case 'KARMA':
      return userKarma.totalKarma >= value;
      
    case 'POSTS':
      return userStats.postsCreated >= value;
      
    case 'COMMENTS':
      return userStats.commentsCreated >= value;
      
    case 'REACTIONS':
      return userStats.reactionsGiven >= value;
      
    case 'PREDICTIONS':
      return userStats.predictionsMade >= value;
      
    case 'POLLS':
      return userStats.pollsCreated >= value;
      
    case 'MODERATION':
      return userStats.moderationActions >= value;
      
    case 'STREAK':
      return userStats.streakDays >= value;
      
    case 'CUSTOM':
      // Custom requirements would be handled by specific logic
      return this.checkCustomRequirements(userKarma, userStats, additionalConditions);
      
    default:
      return false;
  }
};

// Method to check custom requirements
badgeSchema.methods.checkCustomRequirements = function(userKarma, userStats, conditions) {
  // This would contain specific logic for custom badge requirements
  // For now, return true as a placeholder
  return true;
};

// Method to award badge to user
badgeSchema.methods.awardToUser = async function(userKarma) {
  // Check if user already has this badge (unless it's repeatable)
  if (!this.repeatable && userKarma.hasBadge(this.badgeId)) {
    return false;
  }
  
  // Add badge to user
  await userKarma.addBadge(
    this.badgeId,
    this.name,
    this.description,
    this.icon,
    this.color,
    this.category
  );
  
  // Award karma if specified
  if (this.karmaReward > 0) {
    await userKarma.addKarma(
      this.karmaReward,
      'BADGE',
      this._id,
      `Earned badge: ${this.name}`
    );
  }
  
  // Update badge statistics
  this.stats.totalEarned += 1;
  this.stats.lastEarned = new Date();
  
  // Update unique earners count (only for non-repeatable badges)
  if (!this.repeatable) {
    this.stats.uniqueEarners += 1;
  }
  
  await this.save();
  return true;
};

module.exports = mongoose.model('Badge', badgeSchema);
