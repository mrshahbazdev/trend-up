const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
  {
    // Basic poll information
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Poll title is required'],
      trim: true,
      maxlength: [200, 'Poll title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Poll description cannot exceed 1000 characters'],
    },
    // Poll options
    options: [{
      id: {
        type: String,
        required: true,
      },
      text: {
        type: String,
        required: [true, 'Option text is required'],
        trim: true,
        maxlength: [100, 'Option text cannot exceed 100 characters'],
      },
      voteCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      voters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
    }],
    // Poll settings
    allowMultipleVotes: {
      type: Boolean,
      default: false,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    // Timing
    expiresAt: {
      type: Date,
      required: [true, 'Poll expiration date is required'],
    },
    // Poll status
    status: {
      type: String,
      enum: ['active', 'expired', 'closed', 'cancelled'],
      default: 'active',
    },
    // Voting statistics
    totalVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueVoters: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Poll metadata
    category: {
      type: String,
      enum: [
        'crypto_news',
        'defi',
        'nfts',
        'trading_signals',
        'market_analysis',
        'memes',
        'technology',
        'tutorials',
        'ama',
        'events',
        'general',
      ],
      default: 'general',
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    // Engagement metrics
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Moderation
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Analytics
    trendingScore: {
      type: Number,
      default: 0,
    },
    engagementScore: {
      type: Number,
      default: 0,
    },
    // Poll results (computed)
    results: {
      winner: {
        optionId: String,
        optionText: String,
        voteCount: Number,
        percentage: Number,
      },
      distribution: [{
        optionId: String,
        optionText: String,
        voteCount: Number,
        percentage: Number,
      }],
      lastUpdated: {
        type: Date,
        default: Date.now,
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
pollSchema.index({ postId: 1 });
pollSchema.index({ status: 1, expiresAt: 1 });
pollSchema.index({ category: 1, status: 1 });
pollSchema.index({ trendingScore: -1 });
pollSchema.index({ engagementScore: -1 });
pollSchema.index({ totalVotes: -1 });
pollSchema.index({ createdAt: -1 });

// Virtual for post
pollSchema.virtual('post', {
  ref: 'Post',
  localField: 'postId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for time remaining
pollSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const remaining = this.expiresAt.getTime() - now.getTime();
  return Math.max(0, remaining);
});

// Virtual for is expired
pollSchema.virtual('isExpired').get(function() {
  return this.status === 'expired' || (this.status === 'active' && this.expiresAt <= new Date());
});

// Method to add vote
pollSchema.methods.addVote = function(userId, optionId) {
  const option = this.options.find(opt => opt.id === optionId);
  if (!option) {
    throw new Error('Invalid option ID');
  }

  // Check if user already voted (unless multiple votes allowed)
  if (!this.allowMultipleVotes) {
    const hasVoted = this.options.some(opt => 
      opt.voters.some(voter => voter.toString() === userId.toString())
    );
    if (hasVoted) {
      throw new Error('User has already voted on this poll');
    }
  }

  // Add vote
  option.voteCount += 1;
  option.voters.push(new mongoose.Types.ObjectId(userId));
  this.totalVotes += 1;

  // Update unique voters count
  const allVoters = new Set();
  this.options.forEach(opt => {
    opt.voters.forEach(voter => allVoters.add(voter.toString()));
  });
  this.uniqueVoters = allVoters.size;

  // Update results
  this.updateResults();

  return this.save();
};

// Method to remove vote
pollSchema.methods.removeVote = function(userId, optionId) {
  const option = this.options.find(opt => opt.id === optionId);
  if (!option) {
    throw new Error('Invalid option ID');
  }

  // Remove vote
  const voterIndex = option.voters.findIndex(voter => 
    voter.toString() === userId.toString()
  );
  if (voterIndex === -1) {
    throw new Error('User has not voted on this option');
  }

  option.voteCount = Math.max(0, option.voteCount - 1);
  option.voters.splice(voterIndex, 1);
  this.totalVotes = Math.max(0, this.totalVotes - 1);

  // Update unique voters count
  const allVoters = new Set();
  this.options.forEach(opt => {
    opt.voters.forEach(voter => allVoters.add(voter.toString()));
  });
  this.uniqueVoters = allVoters.size;

  // Update results
  this.updateResults();

  return this.save();
};

// Method to update results
pollSchema.methods.updateResults = function() {
  if (this.totalVotes === 0) {
    this.results = {
      winner: null,
      distribution: this.options.map(opt => ({
        optionId: opt.id,
        optionText: opt.text,
        voteCount: opt.voteCount,
        percentage: 0,
      })),
      lastUpdated: new Date(),
    };
    return;
  }

  // Calculate distribution
  const distribution = this.options.map(opt => ({
    optionId: opt.id,
    optionText: opt.text,
    voteCount: opt.voteCount,
    percentage: Math.round((opt.voteCount / this.totalVotes) * 100 * 100) / 100, // Round to 2 decimal places
  }));

  // Find winner
  const winner = distribution.reduce((prev, current) => 
    (prev.voteCount > current.voteCount) ? prev : current
  );

  this.results = {
    winner: {
      optionId: winner.optionId,
      optionText: winner.optionText,
      voteCount: winner.voteCount,
      percentage: winner.percentage,
    },
    distribution,
    lastUpdated: new Date(),
  };
};

// Method to check if user has voted
pollSchema.methods.hasUserVoted = function(userId) {
  return this.options.some(opt => 
    opt.voters.some(voter => voter.toString() === userId.toString())
  );
};

// Method to get user's votes
pollSchema.methods.getUserVotes = function(userId) {
  const userVotes = [];
  this.options.forEach(opt => {
    if (opt.voters.some(voter => voter.toString() === userId.toString())) {
      userVotes.push({
        optionId: opt.id,
        optionText: opt.text,
      });
    }
  });
  return userVotes;
};

// Method to close poll
pollSchema.methods.closePoll = function() {
  this.status = 'closed';
  this.updateResults();
  return this.save();
};

// Method to cancel poll
pollSchema.methods.cancelPoll = function() {
  this.status = 'cancelled';
  return this.save();
};

// Method to increment view count
pollSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  await this.save();
};

// Method to increment share count
pollSchema.methods.incrementShareCount = async function() {
  this.shareCount += 1;
  await this.save();
};

// Method to increment comment count
pollSchema.methods.incrementCommentCount = async function() {
  this.commentCount += 1;
  await this.save();
};

// Method to decrement comment count
pollSchema.methods.decrementCommentCount = async function() {
  this.commentCount = Math.max(0, this.commentCount - 1);
  await this.save();
};

// Static method to get active polls
pollSchema.statics.getActivePolls = function(filter = {}) {
  return this.find({
    status: 'active',
    expiresAt: { $gt: new Date() },
    ...filter,
  })
    .populate('postId', 'userId content createdAt')
    .populate('postId.userId', 'name username avatar')
    .sort({ createdAt: -1 });
};

// Static method to get expired polls
pollSchema.statics.getExpiredPolls = function(filter = {}) {
  return this.find({
    $or: [
      { status: 'expired' },
      { status: 'active', expiresAt: { $lte: new Date() } },
    ],
    ...filter,
  })
    .populate('postId', 'userId content createdAt')
    .populate('postId.userId', 'name username avatar')
    .sort({ expiresAt: -1 });
};

// Static method to get trending polls
pollSchema.statics.getTrendingPolls = function(limit = 20) {
  return this.find({
    status: 'active',
    expiresAt: { $gt: new Date() },
  })
    .populate('postId', 'userId content createdAt')
    .populate('postId.userId', 'name username avatar')
    .sort({ trendingScore: -1, totalVotes: -1 })
    .limit(limit);
};

// Static method to get polls by category
pollSchema.statics.getPollsByCategory = function(category, options = {}) {
  const { page = 1, limit = 20, status = 'active' } = options;
  const skip = (page - 1) * limit;

  const query = { category, status };
  if (status === 'active') {
    query.expiresAt = { $gt: new Date() };
  }

  return this.find(query)
    .populate('postId', 'userId content createdAt')
    .populate('postId.userId', 'name username avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get poll statistics
pollSchema.statics.getPollStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalPolls: { $sum: 1 },
        activePolls: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        expiredPolls: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } },
        closedPolls: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        totalVotes: { $sum: '$totalVotes' },
        totalViews: { $sum: '$viewCount' },
        avgVotesPerPoll: { $avg: '$totalVotes' },
        avgViewsPerPoll: { $avg: '$viewCount' },
      },
    },
  ]);
};

// Pre-save middleware to validate options
pollSchema.pre('save', function(next) {
  if (this.options.length < 2) {
    return next(new Error('Poll must have at least 2 options'));
  }
  if (this.options.length > 10) {
    return next(new Error('Poll cannot have more than 10 options'));
  }

  // Validate option IDs are unique
  const optionIds = this.options.map(opt => opt.id);
  const uniqueIds = new Set(optionIds);
  if (optionIds.length !== uniqueIds.size) {
    return next(new Error('Option IDs must be unique'));
  }

  // Validate expiration date
  if (this.expiresAt <= new Date()) {
    return next(new Error('Poll expiration date must be in the future'));
  }

  next();
});

// Pre-save middleware to update status
pollSchema.pre('save', function(next) {
  if (this.status === 'active' && this.expiresAt <= new Date()) {
    this.status = 'expired';
  }
  next();
});

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;
