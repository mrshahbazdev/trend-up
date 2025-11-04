const mongoose = require('mongoose');

const feedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    feedType: {
      type: String,
      enum: ['following', 'trending', 'category', 'topic', 'hashtag', 'personalized', 'discover'],
      required: true,
    },
    // Feed configuration
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
    },
    hashtagId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hashtag',
      default: null,
    },
    // Feed content
    posts: [{
      postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
      },
      score: {
        type: Number,
        required: true,
        default: 0,
      },
      reason: {
        type: String,
        enum: ['following', 'trending', 'category', 'topic', 'hashtag', 'karma', 'engagement', 'recency', 'personalized'],
        required: true,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Feed metadata
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    nextUpdate: {
      type: Date,
      default: Date.now,
    },
    // Feed settings
    isActive: {
      type: Boolean,
      default: true,
    },
    maxPosts: {
      type: Number,
      default: 100,
      min: 10,
      max: 1000,
    },
    // User preferences for this feed
    preferences: {
      includeReplies: {
        type: Boolean,
        default: true,
      },
      includeReposts: {
        type: Boolean,
        default: true,
      },
      minKarmaLevel: {
        type: String,
        enum: ['NEWBIE', 'EXPLORER', 'CONTRIBUTOR', 'INFLUENCER', 'EXPERT', 'LEGEND', 'TITAN'],
        default: 'NEWBIE',
      },
      maxAge: {
        type: Number,
        default: 7, // days
        min: 1,
        max: 30,
      },
      languages: [{
        type: String,
        trim: true,
      }],
      excludeCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      }],
      excludeTopics: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
      }],
      excludeUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
    },
    // Feed statistics
    stats: {
      totalPosts: {
        type: Number,
        default: 0,
      },
      avgScore: {
        type: Number,
        default: 0,
      },
      engagementRate: {
        type: Number,
        default: 0,
      },
      diversityScore: {
        type: Number,
        default: 0,
      },
    },
    // Feed performance metrics
    performance: {
      loadTime: {
        type: Number,
        default: 0,
      },
      cacheHitRate: {
        type: Number,
        default: 0,
      },
      userEngagement: {
        type: Number,
        default: 0,
      },
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
feedSchema.index({ userId: 1, feedType: 1 });
feedSchema.index({ userId: 1, lastUpdated: -1 });
feedSchema.index({ feedType: 1, lastUpdated: -1 });
feedSchema.index({ categoryId: 1, lastUpdated: -1 });
feedSchema.index({ topicId: 1, lastUpdated: -1 });
feedSchema.index({ hashtagId: 1, lastUpdated: -1 });
feedSchema.index({ isActive: 1, nextUpdate: 1 });

// Virtual for user
feedSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for category
feedSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for topic
feedSchema.virtual('topic', {
  ref: 'Topic',
  localField: 'topicId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for hashtag
feedSchema.virtual('hashtag', {
  ref: 'Hashtag',
  localField: 'hashtagId',
  foreignField: '_id',
  justOne: true,
});

// Method to add post to feed
feedSchema.methods.addPost = function(postId, score, reason) {
  // Remove existing post if it exists
  this.posts = this.posts.filter(post => post.postId.toString() !== postId.toString());
  
  // Add new post
  this.posts.push({
    postId: new mongoose.Types.ObjectId(postId),
    score,
    reason,
    addedAt: new Date()
  });
  
  // Sort by score (highest first)
  this.posts.sort((a, b) => b.score - a.score);
  
  // Keep only maxPosts
  if (this.posts.length > this.maxPosts) {
    this.posts = this.posts.slice(0, this.maxPosts);
  }
  
  // Update stats
  this.stats.totalPosts = this.posts.length;
  this.stats.avgScore = this.posts.reduce((sum, post) => sum + post.score, 0) / this.posts.length;
  
  this.lastUpdated = new Date();
};

// Method to remove post from feed
feedSchema.methods.removePost = function(postId) {
  this.posts = this.posts.filter(post => post.postId.toString() !== postId.toString());
  this.stats.totalPosts = this.posts.length;
  this.stats.avgScore = this.posts.length > 0 ? 
    this.posts.reduce((sum, post) => sum + post.score, 0) / this.posts.length : 0;
  this.lastUpdated = new Date();
};

// Method to update feed performance
feedSchema.methods.updatePerformance = function(loadTime, cacheHitRate, userEngagement) {
  this.performance.loadTime = loadTime;
  this.performance.cacheHitRate = cacheHitRate;
  this.performance.userEngagement = userEngagement;
  this.lastUpdated = new Date();
};

// Method to calculate diversity score
feedSchema.methods.calculateDiversityScore = function() {
  if (this.posts.length === 0) {
    this.stats.diversityScore = 0;
    return 0;
  }
  
  // Calculate diversity based on different factors
  const categories = new Set();
  const topics = new Set();
  const users = new Set();
  const hashtags = new Set();
  
  // This would be populated when we have the actual post data
  // For now, we'll use a simple calculation based on post count
  const diversityScore = Math.min(this.posts.length / 10, 1); // Max diversity score of 1
  
  this.stats.diversityScore = diversityScore;
  return diversityScore;
};

// Static method to get user feeds
feedSchema.statics.getUserFeeds = function(userId, feedType = null) {
  const query = { userId: new mongoose.Types.ObjectId(userId), isActive: true };
  if (feedType) {
    query.feedType = feedType;
  }
  
  return this.find(query)
    .populate('categoryId', 'name slug')
    .populate('topicId', 'name slug')
    .populate('hashtagId', 'name')
    .sort({ lastUpdated: -1 });
};

// Static method to get feed by type and filters
feedSchema.statics.getFeedByType = function(userId, feedType, filters = {}) {
  const query = {
    userId: new mongoose.Types.ObjectId(userId),
    feedType,
    isActive: true
  };
  
  if (filters.categoryId) {
    query.categoryId = new mongoose.Types.ObjectId(filters.categoryId);
  }
  if (filters.topicId) {
    query.topicId = new mongoose.Types.ObjectId(filters.topicId);
  }
  if (filters.hashtagId) {
    query.hashtagId = new mongoose.Types.ObjectId(filters.hashtagId);
  }
  
  return this.findOne(query)
    .populate('categoryId', 'name slug')
    .populate('topicId', 'name slug')
    .populate('hashtagId', 'name')
    .populate('posts.postId', 'title content userId createdAt reactionsCount commentCount');
};

// Static method to get feeds that need updating
feedSchema.statics.getFeedsToUpdate = function(limit = 100) {
  return this.find({
    isActive: true,
    nextUpdate: { $lte: new Date() }
  })
    .populate('userId', 'name username')
    .limit(limit)
    .sort({ nextUpdate: 1 });
};

// Static method to get feed statistics
feedSchema.statics.getFeedStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalFeeds: { $sum: 1 },
        activeFeeds: { $sum: { $cond: ['$isActive', 1, 0] } },
        avgPostsPerFeed: { $avg: '$stats.totalPosts' },
        avgScore: { $avg: '$stats.avgScore' },
        avgDiversityScore: { $avg: '$stats.diversityScore' }
      }
    }
  ]);
};

// Static method to get feed performance metrics
feedSchema.statics.getFeedPerformance = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        avgLoadTime: { $avg: '$performance.loadTime' },
        avgCacheHitRate: { $avg: '$performance.cacheHitRate' },
        avgUserEngagement: { $avg: '$performance.userEngagement' }
      }
    }
  ]);
};

// Pre-save middleware to update nextUpdate time
feedSchema.pre('save', function(next) {
  if (this.isModified('lastUpdated') || this.isNew) {
    // Set next update to 1 hour from now
    this.nextUpdate = new Date(Date.now() + 60 * 60 * 1000);
  }
  next();
});

const Feed = mongoose.model('Feed', feedSchema);

module.exports = Feed;
