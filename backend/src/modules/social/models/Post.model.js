const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
      trim: true,
    },
    postType: {
      type: String,
      enum: ['text', 'image', 'video', 'poll', 'prediction'],
      required: [true, 'Post type is required'],
      default: 'text',
    },
    mediaUrls: [{
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Invalid media URL format',
      },
    }],
    category: {
      type: String,
      enum: [
        'general',
        'technology',
        'business',
        'entertainment',
        'sports',
        'science',
        'crypto_news',
        'defi',
        'nfts',
        'trading_signals',
        'market_analysis',
        'memes',
        'tutorials',
        'ama',
        'events',
      ],
      default: 'general',
    },
    hashtags: [{
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 50,
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'flagged', 'removed'],
      default: 'approved', // Auto-approve for now, pending AI moderation later
    },
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },
    // Engagement metrics
    reactionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    engagementScore: {
      type: Number,
      default: 0,
    },
    // Poll-specific fields
    pollOptions: [{
      text: {
        type: String,
        maxlength: 200,
      },
      votes: {
        type: Number,
        default: 0,
      },
    }],
    pollSettings: {
      expiresAt: Date,
      allowMultipleVotes: {
        type: Boolean,
        default: false,
      },
      totalVotes: {
        type: Number,
        default: 0,
      },
    },
    pollVoters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    // Prediction-specific fields
    predictionData: {
      predictionText: {
        type: String,
        maxlength: 500,
      },
      targetDate: Date,
      outcome: {
        type: String,
        enum: ['pending', 'correct', 'incorrect', 'cancelled'],
        default: 'pending',
      },
      totalStakedKarma: {
        type: Number,
        default: 0,
      },
      participantsCount: {
        type: Number,
        default: 0,
      },
      resolvedAt: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    // Timestamps
    scheduledAt: Date,
    expiresAt: Date,
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
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
postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ engagementScore: -1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ status: 1, visibility: 1 });

// Text index for search
postSchema.index({ content: 'text', hashtags: 'text' });

// Virtual for author
postSchema.virtual('author', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for reactions
postSchema.virtual('reactions', {
  ref: 'Reaction',
  localField: '_id',
  foreignField: 'postId',
});

// Virtual for comments
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'postId',
});

// Method to calculate engagement score
postSchema.methods.calculateEngagementScore = function() {
  const ageInHours = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  const timeDecay = Math.exp(-ageInHours / 24); // Exponential decay over 24 hours
  
  const engagementValue = (
    (this.reactionsCount * 2) +
    (this.commentsCount * 3) +
    (this.sharesCount * 5)
  );
  
  this.engagementScore = Math.round(engagementValue * timeDecay * 100);
  return this.engagementScore;
};

// Method to increment reaction count
postSchema.methods.incrementReactions = async function(count = 1) {
  this.reactionsCount += count;
  this.calculateEngagementScore();
  await this.save();
};

// Method to increment comment count
postSchema.methods.incrementComments = async function(count = 1) {
  this.commentsCount += count;
  this.calculateEngagementScore();
  await this.save();
};

// Method to increment share count
postSchema.methods.incrementShares = async function(count = 1) {
  this.sharesCount += count;
  this.calculateEngagementScore();
  await this.save();
};

// Method to increment view count
postSchema.methods.incrementViews = async function(count = 1) {
  this.viewsCount += count;
  await this.save();
};

// Static method to get trending posts
postSchema.statics.getTrending = function(timeRange = '24h', limit = 20) {
  const now = new Date();
  const timeRanges = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  
  const since = new Date(now - timeRanges[timeRange]);
  
  return this.find({
    status: 'approved',
    visibility: 'public',
    isDeleted: false,
    createdAt: { $gte: since },
  })
    .sort({ engagementScore: -1, createdAt: -1 })
    .limit(limit)
    .populate('author', 'name username avatar karmaScore karmaLevel badges');
};

// Pre-save middleware to extract hashtags
postSchema.pre('save', function(next) {
  if (this.isModified('content') && this.content) {
    const hashtagRegex = /#[\w]+/g;
    const extractedHashtags = this.content.match(hashtagRegex) || [];
    this.hashtags = [...new Set(extractedHashtags.map(tag => tag.toLowerCase().substring(1)))];
  }
  next();
});

// Pre-find middleware to exclude deleted posts
postSchema.pre(/^find/, function(next) {
  this.where({ isDeleted: false });
  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;

