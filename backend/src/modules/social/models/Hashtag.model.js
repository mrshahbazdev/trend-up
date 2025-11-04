const mongoose = require('mongoose');

const hashtagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 50,
    },
    // Hashtag statistics
    postCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reactionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Trending metrics
    trendingScore: {
      type: Number,
      default: 0,
    },
    trendingRank: {
      type: Number,
      default: 0,
    },
    // Time-based metrics
    dailyUsage: [{
      date: {
        type: Date,
        required: true,
      },
      count: {
        type: Number,
        default: 0,
      },
    }],
    weeklyUsage: [{
      week: {
        type: Date,
        required: true,
      },
      count: {
        type: Number,
        default: 0,
      },
    }],
    monthlyUsage: [{
      month: {
        type: Date,
        required: true,
      },
      count: {
        type: Number,
        default: 0,
      },
    }],
    // Hashtag metadata
    firstUsedAt: {
      type: Date,
      default: Date.now,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    // Hashtag status
    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Hashtag description (for verified hashtags)
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Related hashtags
    relatedHashtags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hashtag',
    }],
    // Hashtag categories/topics
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }],
    // Hashtag tags for organization
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    // SEO and discovery
    keywords: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    // Moderation
    flaggedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isModerated: {
      type: Boolean,
      default: false,
    },
    moderationNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
hashtagSchema.index({ name: 1 });
hashtagSchema.index({ postCount: -1 });
hashtagSchema.index({ trendingScore: -1 });
hashtagSchema.index({ trendingRank: 1 });
hashtagSchema.index({ lastUsedAt: -1 });
hashtagSchema.index({ firstUsedAt: -1 });
hashtagSchema.index({ isActive: 1, isBanned: 1 });
hashtagSchema.index({ categories: 1 });
hashtagSchema.index({ tags: 1 });
hashtagSchema.index({ keywords: 1 });

// Virtual for related hashtags
hashtagSchema.virtual('related', {
  ref: 'Hashtag',
  localField: 'relatedHashtags',
  foreignField: '_id',
});

// Virtual for category references
hashtagSchema.virtual('categoryRefs', {
  ref: 'Category',
  localField: 'categories',
  foreignField: '_id',
});

// Method to increment post count
hashtagSchema.methods.incrementPostCount = async function(count = 1) {
  this.postCount += count;
  this.lastUsedAt = new Date();
  await this.updateUsageMetrics('post', count);
  await this.save();
};

// Method to decrement post count
hashtagSchema.methods.decrementPostCount = async function(count = 1) {
  this.postCount = Math.max(0, this.postCount - count);
  await this.save();
};

// Method to increment comment count
hashtagSchema.methods.incrementCommentCount = async function(count = 1) {
  this.commentCount += count;
  this.lastUsedAt = new Date();
  await this.updateUsageMetrics('comment', count);
  await this.save();
};

// Method to increment reaction count
hashtagSchema.methods.incrementReactionCount = async function(count = 1) {
  this.reactionCount += count;
  await this.save();
};

// Method to update usage metrics
hashtagSchema.methods.updateUsageMetrics = async function(type, count) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today);
  thisWeek.setDate(today.getDate() - today.getDay()); // Start of week
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Update daily usage
  let dailyEntry = this.dailyUsage.find(entry => 
    entry.date.getTime() === today.getTime()
  );
  if (!dailyEntry) {
    dailyEntry = { date: today, count: 0 };
    this.dailyUsage.push(dailyEntry);
  }
  dailyEntry.count += count;

  // Update weekly usage
  let weeklyEntry = this.weeklyUsage.find(entry => 
    entry.week.getTime() === thisWeek.getTime()
  );
  if (!weeklyEntry) {
    weeklyEntry = { week: thisWeek, count: 0 };
    this.weeklyUsage.push(weeklyEntry);
  }
  weeklyEntry.count += count;

  // Update monthly usage
  let monthlyEntry = this.monthlyUsage.find(entry => 
    entry.month.getTime() === thisMonth.getTime()
  );
  if (!monthlyEntry) {
    monthlyEntry = { month: thisMonth, count: 0 };
    this.monthlyUsage.push(monthlyEntry);
  }
  monthlyEntry.count += count;

  // Keep only recent data (last 90 days for daily, 12 weeks for weekly, 12 months for monthly)
  const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  this.dailyUsage = this.dailyUsage.filter(entry => entry.date >= cutoffDate);
  
  const weekCutoff = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
  this.weeklyUsage = this.weeklyUsage.filter(entry => entry.week >= weekCutoff);
  
  const monthCutoff = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);
  this.monthlyUsage = this.monthlyUsage.filter(entry => entry.month >= monthCutoff);
};

// Method to calculate trending score
hashtagSchema.methods.calculateTrendingScore = function() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get recent usage
  const recentDaily = this.dailyUsage
    .filter(entry => entry.date >= oneDayAgo)
    .reduce((sum, entry) => sum + entry.count, 0);

  const recentWeekly = this.weeklyUsage
    .filter(entry => entry.week >= oneWeekAgo)
    .reduce((sum, entry) => sum + entry.count, 0);

  // Calculate trending score (weighted by recency and growth)
  const recencyWeight = 0.7; // Recent usage is more important
  const growthWeight = 0.3; // Growth rate is also important

  const recencyScore = recentDaily * recencyWeight;
  const growthScore = recentWeekly > 0 ? (recentDaily / recentWeekly) * growthWeight : 0;

  this.trendingScore = recencyScore + growthScore;
  return this.trendingScore;
};

// Static method to get trending hashtags
hashtagSchema.statics.getTrendingHashtags = function(timeframe = 24, limit = 50) {
  const startDate = new Date(Date.now() - timeframe * 60 * 60 * 1000);
  
  return this.find({
    isActive: true,
    isBanned: false,
    lastUsedAt: { $gte: startDate },
    postCount: { $gt: 0 }
  })
    .sort({ trendingScore: -1, postCount: -1 })
    .limit(limit);
};

// Static method to search hashtags
hashtagSchema.statics.searchHashtags = function(query, options = {}) {
  const { limit = 20, offset = 0, includeBanned = false } = options;
  const searchRegex = new RegExp(query, 'i');
  
  const filter = {
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } },
      { keywords: { $in: [searchRegex] } }
    ],
    isActive: true
  };

  if (!includeBanned) {
    filter.isBanned = false;
  }

  return this.find(filter)
    .sort({ postCount: -1, trendingScore: -1 })
    .skip(offset)
    .limit(limit);
};

// Static method to get popular hashtags
hashtagSchema.statics.getPopularHashtags = function(limit = 50) {
  return this.find({
    isActive: true,
    isBanned: false,
    postCount: { $gt: 0 }
  })
    .sort({ postCount: -1, lastUsedAt: -1 })
    .limit(limit);
};

// Static method to get hashtag statistics
hashtagSchema.statics.getHashtagStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalHashtags: { $sum: 1 },
        activeHashtags: { $sum: { $cond: ['$isActive', 1, 0] } },
        bannedHashtags: { $sum: { $cond: ['$isBanned', 1, 0] } },
        verifiedHashtags: { $sum: { $cond: ['$isVerified', 1, 0] } },
        totalPosts: { $sum: '$postCount' },
        totalComments: { $sum: '$commentCount' },
        totalReactions: { $sum: '$reactionCount' },
        averagePostsPerHashtag: { $avg: '$postCount' }
      }
    }
  ]);
};

// Static method to extract hashtags from text
hashtagSchema.statics.extractHashtags = function(text) {
  if (!text || typeof text !== 'string') return [];
  
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  const matches = text.match(hashtagRegex) || [];
  
  return matches
    .map(match => match.substring(1).toLowerCase()) // Remove # and convert to lowercase
    .filter(hashtag => hashtag.length >= 2 && hashtag.length <= 50) // Filter by length
    .filter((hashtag, index, array) => array.indexOf(hashtag) === index); // Remove duplicates
};

// Static method to create or update hashtags
hashtagSchema.statics.createOrUpdateHashtags = async function(hashtagNames, type = 'post') {
  const hashtags = [];
  
  for (const name of hashtagNames) {
    let hashtag = await this.findOne({ name });
    
    if (!hashtag) {
      hashtag = new this({
        name,
        firstUsedAt: new Date(),
        lastUsedAt: new Date()
      });
    }
    
    // Update usage based on type
    if (type === 'post') {
      await hashtag.incrementPostCount();
    } else if (type === 'comment') {
      await hashtag.incrementCommentCount();
    }
    
    // Calculate trending score
    hashtag.calculateTrendingScore();
    await hashtag.save();
    
    hashtags.push(hashtag);
  }
  
  return hashtags;
};

const Hashtag = mongoose.model('Hashtag', hashtagSchema);

module.exports = Hashtag;
