const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    // Vote identification
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    optionId: {
      type: String,
      required: [true, 'Option ID is required'],
    },
    // Vote metadata
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    // Vote context
    voteWeight: {
      type: Number,
      default: 1,
      min: 1,
    },
    voteReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Vote reason cannot exceed 500 characters'],
    },
    // Timestamps
    votedAt: {
      type: Date,
      default: Date.now,
    },
    // Vote status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Moderation
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
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
voteSchema.index({ pollId: 1, userId: 1 }, { unique: true });
voteSchema.index({ pollId: 1, optionId: 1 });
voteSchema.index({ userId: 1, votedAt: -1 });
voteSchema.index({ votedAt: -1 });
voteSchema.index({ isActive: 1 });

// Virtual for poll
voteSchema.virtual('poll', {
  ref: 'Poll',
  localField: 'pollId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for user
voteSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Static method to get votes by poll
voteSchema.statics.getVotesByPoll = function(pollId, options = {}) {
  const { page = 1, limit = 50, includeAnonymous = false } = options;
  const skip = (page - 1) * limit;

  const query = { pollId: new mongoose.Types.ObjectId(pollId), isActive: true };
  if (!includeAnonymous) {
    query.isAnonymous = false;
  }

  return this.find(query)
    .populate('userId', 'name username avatar')
    .sort({ votedAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get votes by user
voteSchema.statics.getVotesByUser = function(userId, options = {}) {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  return this.find({
    userId: new mongoose.Types.ObjectId(userId),
    isActive: true,
  })
    .populate('pollId', 'title status expiresAt')
    .sort({ votedAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get vote statistics
voteSchema.statics.getVoteStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalVotes: { $sum: 1 },
        activeVotes: { $sum: { $cond: ['$isActive', 1, 0] } },
        anonymousVotes: { $sum: { $cond: ['$isAnonymous', 1, 0] } },
        flaggedVotes: { $sum: { $cond: ['$isFlagged', 1, 0] } },
        avgVoteWeight: { $avg: '$voteWeight' },
      },
    },
  ]);
};

// Static method to get votes by date range
voteSchema.statics.getVotesByDateRange = function(startDate, endDate) {
  return this.find({
    votedAt: {
      $gte: startDate,
      $lte: endDate,
    },
    isActive: true,
  })
    .populate('pollId', 'title category')
    .populate('userId', 'name username')
    .sort({ votedAt: -1 });
};

// Static method to get recent votes
voteSchema.statics.getRecentVotes = function(limit = 100) {
  return this.find({ isActive: true })
    .populate('pollId', 'title status')
    .populate('userId', 'name username avatar')
    .sort({ votedAt: -1 })
    .limit(limit);
};

// Static method to check if user has voted on poll
voteSchema.statics.hasUserVoted = function(pollId, userId) {
  return this.findOne({
    pollId: new mongoose.Types.ObjectId(pollId),
    userId: new mongoose.Types.ObjectId(userId),
    isActive: true,
  });
};

// Static method to get vote count by option
voteSchema.statics.getVoteCountByOption = function(pollId, optionId) {
  return this.countDocuments({
    pollId: new mongoose.Types.ObjectId(pollId),
    optionId,
    isActive: true,
  });
};

// Static method to get vote distribution
voteSchema.statics.getVoteDistribution = function(pollId) {
  return this.aggregate([
    {
      $match: {
        pollId: new mongoose.Types.ObjectId(pollId),
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$optionId',
        voteCount: { $sum: 1 },
        totalWeight: { $sum: '$voteWeight' },
      },
    },
    {
      $sort: { voteCount: -1 },
    },
  ]);
};

// Method to flag vote
voteSchema.methods.flagVote = function(reason) {
  this.isFlagged = true;
  this.flagReason = reason;
  return this.save();
};

// Method to unflag vote
voteSchema.methods.unflagVote = function() {
  this.isFlagged = false;
  this.flagReason = undefined;
  return this.save();
};

// Method to deactivate vote
voteSchema.methods.deactivateVote = function() {
  this.isActive = false;
  return this.save();
};

// Method to reactivate vote
voteSchema.methods.reactivateVote = function() {
  this.isActive = true;
  return this.save();
};

const Vote = mongoose.model('Vote', voteSchema);

module.exports = Vote;
