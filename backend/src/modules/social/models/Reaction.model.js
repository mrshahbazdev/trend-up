const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: function() {
        return !this.commentId;
      },
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: function() {
        return !this.postId;
      },
    },
    reactionType: {
      type: String,
      enum: [
        'BULLISH',    // 🚀
        'BEARISH',    // 📉
        'FIRE',       // 🔥
        'GEM',        // 💎
        'MOON',       // 🌙
        'RUGGED',     // 💀
        'WAGMI',      // 💪
        'NGMI',       // 😢
        'ROCKET',     // 🎯
        'DIAMOND',    // 💎
        'THINKING',   // 🤔
        'HEART',      // ❤️
        'LIKE',       // 👍
        'LAUGH',      // 😂
        'SURPRISED',  // 😮
        'ANGRY',      // 😡
        'SAD',        // 😢
        'CELEBRATE',  // 🎉
        'CLAP',       // 👏
        'HANDS',      // 🙌
      ],
      required: [true, 'Reaction type is required'],
    },
    weight: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
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

// Compound indexes for uniqueness and performance
reactionSchema.index({ userId: 1, postId: 1, reactionType: 1 }, { unique: true, partialFilterExpression: { postId: { $exists: true } } });
reactionSchema.index({ userId: 1, commentId: 1, reactionType: 1 }, { unique: true, partialFilterExpression: { commentId: { $exists: true } } });
reactionSchema.index({ postId: 1, reactionType: 1 });
reactionSchema.index({ commentId: 1, reactionType: 1 });
reactionSchema.index({ createdAt: -1 });

// Virtual for user
reactionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for post
reactionSchema.virtual('post', {
  ref: 'Post',
  localField: 'postId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for comment
reactionSchema.virtual('comment', {
  ref: 'Comment',
  localField: 'commentId',
  foreignField: '_id',
  justOne: true,
});

// Static method to get reaction counts for a post
reactionSchema.statics.getPostReactionCounts = async function(postId) {
  const counts = await this.aggregate([
    { $match: { postId: new mongoose.Types.ObjectId(postId) } },
    {
      $group: {
        _id: '$reactionType',
        count: { $sum: 1 },
        totalWeight: { $sum: '$weight' },
        users: { $addToSet: '$userId' },
      },
    },
    {
      $project: {
        reactionType: '$_id',
        count: 1,
        totalWeight: 1,
        uniqueUsers: { $size: '$users' },
        _id: 0,
      },
    },
    { $sort: { totalWeight: -1 } },
  ]);

  return counts;
};

// Static method to get reaction counts for a comment
reactionSchema.statics.getCommentReactionCounts = async function(commentId) {
  const counts = await this.aggregate([
    { $match: { commentId: new mongoose.Types.ObjectId(commentId) } },
    {
      $group: {
        _id: '$reactionType',
        count: { $sum: 1 },
        totalWeight: { $sum: '$weight' },
        users: { $addToSet: '$userId' },
      },
    },
    {
      $project: {
        reactionType: '$_id',
        count: 1,
        totalWeight: 1,
        uniqueUsers: { $size: '$users' },
        _id: 0,
      },
    },
    { $sort: { totalWeight: -1 } },
  ]);

  return counts;
};

// Static method to get user's reactions on a post
reactionSchema.statics.getUserPostReactions = async function(userId, postId) {
  return this.find({ userId, postId }).select('reactionType weight createdAt');
};

// Static method to get user's reactions on a comment
reactionSchema.statics.getUserCommentReactions = async function(userId, commentId) {
  return this.find({ userId, commentId }).select('reactionType weight createdAt');
};

// Method to calculate reaction weight based on user karma
reactionSchema.methods.calculateWeight = function(userKarmaLevel) {
  // Weight calculation based on user's karma level
  // Higher karma users have more impact on reactions
  const baseWeight = 1;
  const karmaMultiplier = 1 + (userKarmaLevel * 0.1); // 10% increase per level
  this.weight = Math.min(Math.round(baseWeight * karmaMultiplier), 10); // Cap at 10
  return this.weight;
};

// Pre-save middleware to ensure either postId or commentId is present
reactionSchema.pre('save', function(next) {
  if (!this.postId && !this.commentId) {
    return next(new Error('Either postId or commentId must be provided'));
  }
  if (this.postId && this.commentId) {
    return next(new Error('Cannot react to both post and comment simultaneously'));
  }
  next();
});

// Pre-save middleware to calculate weight if not provided
reactionSchema.pre('save', async function(next) {
  if (this.isNew && !this.weight) {
    // Get user's karma level to calculate weight
    const User = mongoose.model('User');
    const user = await User.findById(this.userId).select('karmaLevel');
    if (user) {
      this.calculateWeight(user.karmaLevel || 0);
    }
  }
  next();
});

const Reaction = mongoose.model('Reaction', reactionSchema);

module.exports = Reaction;
