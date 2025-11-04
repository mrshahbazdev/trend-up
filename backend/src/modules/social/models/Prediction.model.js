const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    // Basic prediction information
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Prediction title is required'],
      trim: true,
      maxlength: [200, 'Prediction title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Prediction description is required'],
      trim: true,
      maxlength: [2000, 'Prediction description cannot exceed 2000 characters'],
    },
    // Prediction details
    predictionType: {
      type: String,
      enum: ['price', 'event', 'market', 'other'],
      required: [true, 'Prediction type is required'],
      default: 'price',
    },
    asset: {
      symbol: {
        type: String,
        trim: true,
        uppercase: true,
      },
      name: {
        type: String,
        trim: true,
      },
      currentPrice: {
        type: Number,
        min: 0,
      },
    },
    targetPrice: {
      type: Number,
      min: 0,
    },
    targetDate: {
      type: Date,
      required: [true, 'Target date is required'],
    },
    // Staking system
    totalStake: {
      type: Number,
      default: 0,
      min: 0,
    },
    agreeStake: {
      type: Number,
      default: 0,
      min: 0,
    },
    disagreeStake: {
      type: Number,
      default: 0,
      min: 0,
    },
    minStake: {
      type: Number,
      default: 10,
      min: 1,
    },
    maxStake: {
      type: Number,
      default: 1000,
      min: 1,
    },
    // Participants
    participants: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      stake: {
        type: Number,
        required: true,
        min: 0,
      },
      position: {
        type: String,
        enum: ['agree', 'disagree'],
        required: true,
      },
      stakedAt: {
        type: Date,
        default: Date.now,
      },
      karmaReward: {
        type: Number,
        default: 0,
      },
    }],
    // Prediction status
    status: {
      type: String,
      enum: ['active', 'expired', 'resolved', 'cancelled'],
      default: 'active',
    },
    resolution: {
      outcome: {
        type: String,
        enum: ['agree', 'disagree', 'inconclusive'],
      },
      resolvedAt: {
        type: Date,
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      resolutionNote: {
        type: String,
        trim: true,
        maxlength: [500, 'Resolution note cannot exceed 500 characters'],
      },
      finalPrice: {
        type: Number,
        min: 0,
      },
      accuracy: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    // Statistics
    participantCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    agreeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    disagreeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
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
    // Category and tags
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
      default: 'market_analysis',
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
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
predictionSchema.index({ postId: 1 });
predictionSchema.index({ status: 1, targetDate: 1 });
predictionSchema.index({ category: 1, status: 1 });
predictionSchema.index({ 'asset.symbol': 1, status: 1 });
predictionSchema.index({ trendingScore: -1 });
predictionSchema.index({ engagementScore: -1 });
predictionSchema.index({ totalStake: -1 });
predictionSchema.index({ createdAt: -1 });
predictionSchema.index({ 'participants.userId': 1 });

// Virtual for post
predictionSchema.virtual('post', {
  ref: 'Post',
  localField: 'postId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for time remaining
predictionSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const remaining = this.targetDate.getTime() - now.getTime();
  return Math.max(0, remaining);
});

// Virtual for is expired
predictionSchema.virtual('isExpired').get(function() {
  return this.status === 'expired' || (this.status === 'active' && this.targetDate <= new Date());
});

// Virtual for odds
predictionSchema.virtual('odds').get(function() {
  if (this.agreeStake === 0 && this.disagreeStake === 0) {
    return { agree: 50, disagree: 50 };
  }
  
  const total = this.agreeStake + this.disagreeStake;
  return {
    agree: Math.round((this.agreeStake / total) * 100),
    disagree: Math.round((this.disagreeStake / total) * 100),
  };
});

// Method to add stake
predictionSchema.methods.addStake = function(userId, stake, position) {
  if (this.status !== 'active') {
    throw new Error('Prediction is not active');
  }

  if (this.isExpired) {
    throw new Error('Prediction has expired');
  }

  if (stake < this.minStake || stake > this.maxStake) {
    throw new Error(`Stake must be between ${this.minStake} and ${this.maxStake} karma`);
  }

  // Check if user already has a stake
  const existingStake = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  if (existingStake) {
    throw new Error('User has already staked on this prediction');
  }

  // Add stake
  this.participants.push({
    userId: new mongoose.Types.ObjectId(userId),
    stake,
    position,
    stakedAt: new Date(),
  });

  this.totalStake += stake;
  if (position === 'agree') {
    this.agreeStake += stake;
    this.agreeCount += 1;
  } else {
    this.disagreeStake += stake;
    this.disagreeCount += 1;
  }
  this.participantCount += 1;

  return this.save();
};

// Method to remove stake
predictionSchema.methods.removeStake = function(userId) {
  if (this.status !== 'active') {
    throw new Error('Prediction is not active');
  }

  const participantIndex = this.participants.findIndex(p => 
    p.userId.toString() === userId.toString()
  );
  if (participantIndex === -1) {
    throw new Error('User has not staked on this prediction');
  }

  const participant = this.participants[participantIndex];
  this.totalStake -= participant.stake;
  
  if (participant.position === 'agree') {
    this.agreeStake -= participant.stake;
    this.agreeCount -= 1;
  } else {
    this.disagreeStake -= participant.stake;
    this.disagreeCount -= 1;
  }
  
  this.participantCount -= 1;
  this.participants.splice(participantIndex, 1);

  return this.save();
};

// Method to resolve prediction
predictionSchema.methods.resolve = function(outcome, resolvedBy, resolutionNote, finalPrice) {
  if (this.status !== 'active') {
    throw new Error('Prediction is not active');
  }

  this.status = 'resolved';
  this.resolution = {
    outcome,
    resolvedAt: new Date(),
    resolvedBy: new mongoose.Types.ObjectId(resolvedBy),
    resolutionNote,
    finalPrice,
  };

  // Calculate accuracy if it's a price prediction
  if (this.predictionType === 'price' && finalPrice && this.targetPrice) {
    const priceChange = Math.abs(finalPrice - this.targetPrice) / this.targetPrice;
    this.resolution.accuracy = Math.max(0, 100 - (priceChange * 100));
  }

  // Distribute karma rewards
  this.distributeRewards();

  return this.save();
};

// Method to distribute rewards
predictionSchema.methods.distributeRewards = function() {
  if (this.resolution.outcome === 'inconclusive') {
    // Return stakes to all participants
    this.participants.forEach(participant => {
      participant.karmaReward = participant.stake;
    });
    return;
  }

  const winners = this.participants.filter(p => p.position === this.resolution.outcome);
  const losers = this.participants.filter(p => p.position !== this.resolution.outcome);

  if (winners.length === 0) {
    // No winners, return stakes to all
    this.participants.forEach(participant => {
      participant.karmaReward = participant.stake;
    });
    return;
  }

  const totalLoserStake = losers.reduce((sum, p) => sum + p.stake, 0);
  const totalWinnerStake = winners.reduce((sum, p) => sum + p.stake, 0);

  // Distribute loser stakes proportionally to winners
  winners.forEach(winner => {
    const proportion = winner.stake / totalWinnerStake;
    const reward = winner.stake + (totalLoserStake * proportion);
    winner.karmaReward = Math.round(reward);
  });

  // Losers get nothing
  losers.forEach(loser => {
    loser.karmaReward = 0;
  });
};

// Method to check if user has staked
predictionSchema.methods.hasUserStaked = function(userId) {
  return this.participants.some(p => p.userId.toString() === userId.toString());
};

// Method to get user's stake
predictionSchema.methods.getUserStake = function(userId) {
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  return participant || null;
};

// Method to cancel prediction
predictionSchema.methods.cancelPrediction = function() {
  if (this.status !== 'active') {
    throw new Error('Prediction is not active');
  }

  this.status = 'cancelled';
  
  // Return stakes to all participants
  this.participants.forEach(participant => {
    participant.karmaReward = participant.stake;
  });

  return this.save();
};

// Method to increment view count
predictionSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  await this.save();
};

// Method to increment share count
predictionSchema.methods.incrementShareCount = async function() {
  this.shareCount += 1;
  await this.save();
};

// Method to increment comment count
predictionSchema.methods.incrementCommentCount = async function() {
  this.commentCount += 1;
  await this.save();
};

// Method to decrement comment count
predictionSchema.methods.decrementCommentCount = async function() {
  this.commentCount = Math.max(0, this.commentCount - 1);
  await this.save();
};

// Static method to get active predictions
predictionSchema.statics.getActivePredictions = function(filter = {}) {
  return this.find({
    status: 'active',
    targetDate: { $gt: new Date() },
    ...filter,
  })
    .populate('postId', 'userId content createdAt')
    .populate('postId.userId', 'name username avatar')
    .sort({ createdAt: -1 });
};

// Static method to get expired predictions
predictionSchema.statics.getExpiredPredictions = function(filter = {}) {
  return this.find({
    $or: [
      { status: 'expired' },
      { status: 'active', targetDate: { $lte: new Date() } },
    ],
    ...filter,
  })
    .populate('postId', 'userId content createdAt')
    .populate('postId.userId', 'name username avatar')
    .sort({ targetDate: -1 });
};

// Static method to get resolved predictions
predictionSchema.statics.getResolvedPredictions = function(filter = {}) {
  return this.find({
    status: 'resolved',
    ...filter,
  })
    .populate('postId', 'userId content createdAt')
    .populate('postId.userId', 'name username avatar')
    .sort({ 'resolution.resolvedAt': -1 });
};

// Static method to get trending predictions
predictionSchema.statics.getTrendingPredictions = function(limit = 20) {
  return this.find({
    status: 'active',
    targetDate: { $gt: new Date() },
  })
    .populate('postId', 'userId content createdAt')
    .populate('postId.userId', 'name username avatar')
    .sort({ trendingScore: -1, totalStake: -1 })
    .limit(limit);
};

// Static method to get predictions by asset
predictionSchema.statics.getPredictionsByAsset = function(symbol, options = {}) {
  const { page = 1, limit = 20, status = 'active' } = options;
  const skip = (page - 1) * limit;

  const query = { 'asset.symbol': symbol.toUpperCase(), status };
  if (status === 'active') {
    query.targetDate = { $gt: new Date() };
  }

  return this.find(query)
    .populate('postId', 'userId content createdAt')
    .populate('postId.userId', 'name username avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get prediction statistics
predictionSchema.statics.getPredictionStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalPredictions: { $sum: 1 },
        activePredictions: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        resolvedPredictions: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        totalStake: { $sum: '$totalStake' },
        totalParticipants: { $sum: '$participantCount' },
        avgStakePerPrediction: { $avg: '$totalStake' },
        avgParticipantsPerPrediction: { $avg: '$participantCount' },
      },
    },
  ]);
};

// Pre-save middleware to validate prediction
predictionSchema.pre('save', function(next) {
  // Validate target date
  if (this.targetDate <= new Date()) {
    return next(new Error('Target date must be in the future'));
  }

  // Validate price prediction
  if (this.predictionType === 'price') {
    if (!this.asset.symbol) {
      return next(new Error('Asset symbol is required for price predictions'));
    }
    if (!this.targetPrice || this.targetPrice <= 0) {
      return next(new Error('Target price must be positive for price predictions'));
    }
  }

  // Validate stake limits
  if (this.minStake > this.maxStake) {
    return next(new Error('Minimum stake cannot be greater than maximum stake'));
  }

  next();
});

// Pre-save middleware to update status
predictionSchema.pre('save', function(next) {
  if (this.status === 'active' && this.targetDate <= new Date()) {
    this.status = 'expired';
  }
  next();
});

const Prediction = mongoose.model('Prediction', predictionSchema);

module.exports = Prediction;
