const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    // Topic metadata
    icon: {
      type: String,
      default: null, // URL to topic icon
    },
    banner: {
      type: String,
      default: null, // URL to topic banner
    },
    color: {
      type: String,
      default: '#10B981', // Default green color
      match: /^#[0-9A-F]{6}$/i,
    },
    // Topic hierarchy
    parentTopicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null,
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 2, // Maximum 3 levels deep
    },
    // Topic settings
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Community settings
    isCommunity: {
      type: Boolean,
      default: false,
    },
    allowUserPosts: {
      type: Boolean,
      default: true,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    // Membership settings
    isPrivate: {
      type: Boolean,
      default: false,
    },
    memberLimit: {
      type: Number,
      default: null, // null means no limit
      min: 1,
    },
    // Statistics
    postCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    memberCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    followerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Topic rules and guidelines
    rules: [{
      title: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        required: true,
        trim: true,
      },
    }],
    // Topic tags for better organization
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    // Related topics
    relatedTopics: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
    }],
    // Associated categories
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    }],
    // Associated hashtags
    hashtags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hashtag',
    }],
    // SEO and discovery
    keywords: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    // Topic metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    moderators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    // Topic engagement metrics
    engagementScore: {
      type: Number,
      default: 0,
    },
    trendingScore: {
      type: Number,
      default: 0,
    },
    // Topic status
    status: {
      type: String,
      enum: ['active', 'archived', 'suspended', 'pending'],
      default: 'active',
    },
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
topicSchema.index({ name: 1 });
topicSchema.index({ slug: 1 });
topicSchema.index({ parentTopicId: 1, level: 1 });
topicSchema.index({ isActive: 1, isPublic: 1 });
topicSchema.index({ isCommunity: 1 });
topicSchema.index({ postCount: -1 });
topicSchema.index({ memberCount: -1 });
topicSchema.index({ followerCount: -1 });
topicSchema.index({ engagementScore: -1 });
topicSchema.index({ trendingScore: -1 });
topicSchema.index({ lastActivityAt: -1 });
topicSchema.index({ status: 1 });
topicSchema.index({ tags: 1 });
topicSchema.index({ keywords: 1 });
topicSchema.index({ categories: 1 });
topicSchema.index({ hashtags: 1 });

// Virtual for parent topic
topicSchema.virtual('parentTopic', {
  ref: 'Topic',
  localField: 'parentTopicId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for subtopics
topicSchema.virtual('subtopics', {
  ref: 'Topic',
  localField: '_id',
  foreignField: 'parentTopicId',
});

// Virtual for creator
topicSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual for moderator references
topicSchema.virtual('moderatorRefs', {
  ref: 'User',
  localField: 'moderators',
  foreignField: '_id',
});

// Virtual for category references
topicSchema.virtual('categoryRefs', {
  ref: 'Category',
  localField: 'categories',
  foreignField: '_id',
});

// Virtual for hashtag references
topicSchema.virtual('hashtagRefs', {
  ref: 'Hashtag',
  localField: 'hashtags',
  foreignField: '_id',
});

// Pre-save middleware to generate slug
topicSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim('-'); // Remove leading/trailing hyphens
  }
  next();
});

// Method to increment post count
topicSchema.methods.incrementPostCount = async function(count = 1) {
  this.postCount += count;
  this.lastActivityAt = new Date();
  await this.save();
};

// Method to decrement post count
topicSchema.methods.decrementPostCount = async function(count = 1) {
  this.postCount = Math.max(0, this.postCount - count);
  await this.save();
};

// Method to increment member count
topicSchema.methods.incrementMemberCount = async function(count = 1) {
  this.memberCount += count;
  await this.save();
};

// Method to decrement member count
topicSchema.methods.decrementMemberCount = async function(count = 1) {
  this.memberCount = Math.max(0, this.memberCount - count);
  await this.save();
};

// Method to increment follower count
topicSchema.methods.incrementFollowerCount = async function(count = 1) {
  this.followerCount += count;
  await this.save();
};

// Method to decrement follower count
topicSchema.methods.decrementFollowerCount = async function(count = 1) {
  this.followerCount = Math.max(0, this.followerCount - count);
  await this.save();
};

// Method to calculate engagement score
topicSchema.methods.calculateEngagementScore = function() {
  // Simple engagement score based on posts, members, and followers
  const postWeight = 1;
  const memberWeight = 2;
  const followerWeight = 1.5;
  
  this.engagementScore = (this.postCount * postWeight) + 
                        (this.memberCount * memberWeight) + 
                        (this.followerCount * followerWeight);
  
  return this.engagementScore;
};

// Method to calculate trending score
topicSchema.methods.calculateTrendingScore = function() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Base score on recent activity
  const recencyWeight = this.lastActivityAt >= oneDayAgo ? 1.5 : 1;
  const weeklyWeight = this.lastActivityAt >= oneWeekAgo ? 1.2 : 1;
  
  this.trendingScore = this.engagementScore * recencyWeight * weeklyWeight;
  return this.trendingScore;
};

// Static method to get topics with hierarchy
topicSchema.statics.getTopicHierarchy = function(filter = {}) {
  return this.find({ ...filter, isActive: true })
    .populate('parentTopic', 'name slug')
    .populate('subtopics', 'name slug postCount memberCount')
    .sort({ level: 1, name: 1 });
};

// Static method to get popular topics
topicSchema.statics.getPopularTopics = function(limit = 20) {
  return this.find({ isActive: true, isPublic: true, status: 'active' })
    .sort({ engagementScore: -1, postCount: -1 })
    .limit(limit)
    .populate('createdBy', 'name username avatar');
};

// Static method to get trending topics
topicSchema.statics.getTrendingTopics = function(timeframe = 7, limit = 10) {
  const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
  
  return this.find({
    isActive: true,
    isPublic: true,
    status: 'active',
    lastActivityAt: { $gte: startDate },
    postCount: { $gt: 0 }
  })
    .sort({ trendingScore: -1, engagementScore: -1 })
    .limit(limit)
    .populate('createdBy', 'name username avatar');
};

// Static method to search topics
topicSchema.statics.searchTopics = function(query, options = {}) {
  const { limit = 20, offset = 0, includePrivate = false } = options;
  const searchRegex = new RegExp(query, 'i');
  
  const filter = {
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { shortDescription: searchRegex },
      { tags: { $in: [searchRegex] } },
      { keywords: { $in: [searchRegex] } }
    ],
    isActive: true,
    status: 'active'
  };

  if (!includePrivate) {
    filter.isPublic = true;
  }

  return this.find(filter)
    .sort({ engagementScore: -1, postCount: -1 })
    .skip(offset)
    .limit(limit)
    .populate('createdBy', 'name username avatar');
};

// Static method to get community topics
topicSchema.statics.getCommunityTopics = function(limit = 20) {
  return this.find({
    isActive: true,
    isPublic: true,
    isCommunity: true,
    status: 'active'
  })
    .sort({ memberCount: -1, postCount: -1 })
    .limit(limit)
    .populate('createdBy', 'name username avatar');
};

// Static method to get topic statistics
topicSchema.statics.getTopicStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalTopics: { $sum: 1 },
        activeTopics: { $sum: { $cond: ['$isActive', 1, 0] } },
        publicTopics: { $sum: { $cond: ['$isPublic', 1, 0] } },
        communityTopics: { $sum: { $cond: ['$isCommunity', 1, 0] } },
        verifiedTopics: { $sum: { $cond: ['$isVerified', 1, 0] } },
        totalPosts: { $sum: '$postCount' },
        totalMembers: { $sum: '$memberCount' },
        totalFollowers: { $sum: '$followerCount' },
        averagePostsPerTopic: { $avg: '$postCount' },
        averageMembersPerTopic: { $avg: '$memberCount' }
      }
    }
  ]);
};

const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;
