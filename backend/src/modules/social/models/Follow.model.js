const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Follow status
  status: {
    type: String,
    enum: ['ACTIVE', 'MUTED', 'BLOCKED'],
    default: 'ACTIVE'
  },
  
  // Follow type (for future features like following topics, etc.)
  followType: {
    type: String,
    enum: ['USER', 'TOPIC', 'CATEGORY'],
    default: 'USER'
  },
  
  // Notification preferences
  notifications: {
    posts: {
      type: Boolean,
      default: true
    },
    comments: {
      type: Boolean,
      default: false
    },
    reactions: {
      type: Boolean,
      default: false
    },
    predictions: {
      type: Boolean,
      default: true
    }
  },
  
  // Follow metadata
  followedAt: {
    type: Date,
    default: Date.now
  },
  
  // Mute/block timestamps
  mutedAt: {
    type: Date,
    default: null
  },
  
  blockedAt: {
    type: Date,
    default: null
  },
  
  // Follow source (how they found each other)
  source: {
    type: String,
    enum: ['SEARCH', 'SUGGESTION', 'MUTUAL_FOLLOW', 'TRENDING', 'CATEGORY', 'MANUAL'],
    default: 'MANUAL'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ follower: 1, status: 1 });
followSchema.index({ following: 1, status: 1 });
followSchema.index({ followedAt: -1 });
followSchema.index({ followType: 1 });

// Virtual for follow duration
followSchema.virtual('followDuration').get(function() {
  return Date.now() - this.followedAt.getTime();
});

// Virtual for follow duration in days
followSchema.virtual('followDurationDays').get(function() {
  return Math.floor(this.followDuration / (1000 * 60 * 60 * 24));
});

// Static method to check if user A follows user B
followSchema.statics.isFollowing = async function(followerId, followingId) {
  const follow = await this.findOne({
    follower: new mongoose.Types.ObjectId(followerId),
    following: new mongoose.Types.ObjectId(followingId),
    status: 'ACTIVE'
  });
  return !!follow;
};

// Static method to get mutual follows
followSchema.statics.getMutualFollows = async function(userId1, userId2) {
  const user1Following = await this.find({
    follower: new mongoose.Types.ObjectId(userId1),
    status: 'ACTIVE'
  }).select('following');
  
  const user2Following = await this.find({
    follower: new mongoose.Types.ObjectId(userId2),
    status: 'ACTIVE'
  }).select('following');
  
  const user1FollowingIds = user1Following.map(f => f.following.toString());
  const user2FollowingIds = user2Following.map(f => f.following.toString());
  
  const mutualIds = user1FollowingIds.filter(id => user2FollowingIds.includes(id));
  
  return await mongoose.model('User').find({
    _id: { $in: mutualIds }
  }).select('_id name username avatar');
};

// Static method to get follow suggestions
followSchema.statics.getFollowSuggestions = async function(userId, limit = 10) {
  const user = await mongoose.model('User').findById(userId);
  if (!user) return [];
  
  // Get users that the current user is already following
  const following = await this.find({
    follower: new mongoose.Types.ObjectId(userId),
    status: 'ACTIVE'
  }).select('following');
  
  const followingIds = following.map(f => f.following.toString());
  followingIds.push(userId.toString()); // Exclude self
  
  // Get users with similar interests (based on karma level and activity)
  const suggestions = await mongoose.model('User').aggregate([
    {
      $match: {
        _id: { $nin: followingIds.map(id => new mongoose.Types.ObjectId(id)) },
        isEmailVerified: true
      }
    },
    {
      $lookup: {
        from: 'karmas',
        localField: '_id',
        foreignField: 'userId',
        as: 'karma'
      }
    },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'userId',
        as: 'posts'
      }
    },
    {
      $addFields: {
        karmaScore: { $ifNull: [{ $arrayElemAt: ['$karma.totalKarma', 0] }, 0] },
        postCount: { $size: '$posts' },
        isActive: {
          $gte: [
            { $ifNull: [{ $arrayElemAt: ['$karma.stats.lastActiveDate', 0] }, new Date(0)] },
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Active in last 7 days
          ]
        }
      }
    },
    {
      $match: {
        $or: [
          { karmaScore: { $gte: 100 } }, // Users with good karma
          { postCount: { $gte: 5 } }, // Active posters
          { isActive: true } // Recently active users
        ]
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        username: 1,
        avatar: 1,
        bio: 1,
        karmaScore: 1,
        postCount: 1,
        isActive: 1,
        createdAt: 1
      }
    },
    {
      $sort: {
        karmaScore: -1,
        postCount: -1,
        createdAt: -1
      }
    },
    {
      $limit: limit
    }
  ]);
  
  return suggestions;
};

// Static method to get follower statistics
followSchema.statics.getFollowerStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: {
        following: new mongoose.Types.ObjectId(userId),
        status: 'ACTIVE'
      }
    },
    {
      $group: {
        _id: null,
        totalFollowers: { $sum: 1 },
        newFollowersToday: {
          $sum: {
            $cond: [
              { $gte: ['$followedAt', new Date(Date.now() - 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        },
        newFollowersThisWeek: {
          $sum: {
            $cond: [
              { $gte: ['$followedAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        },
        newFollowersThisMonth: {
          $sum: {
            $cond: [
              { $gte: ['$followedAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalFollowers: 0,
    newFollowersToday: 0,
    newFollowersThisWeek: 0,
    newFollowersThisMonth: 0
  };
};

// Static method to get following statistics
followSchema.statics.getFollowingStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: {
        follower: new mongoose.Types.ObjectId(userId),
        status: 'ACTIVE'
      }
    },
    {
      $group: {
        _id: null,
        totalFollowing: { $sum: 1 },
        newFollowingToday: {
          $sum: {
            $cond: [
              { $gte: ['$followedAt', new Date(Date.now() - 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        },
        newFollowingThisWeek: {
          $sum: {
            $cond: [
              { $gte: ['$followedAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        },
        newFollowingThisMonth: {
          $sum: {
            $cond: [
              { $gte: ['$followedAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalFollowing: 0,
    newFollowingToday: 0,
    newFollowingThisWeek: 0,
    newFollowingThisMonth: 0
  };
};

// Static method to get trending users (most followed recently)
followSchema.statics.getTrendingUsers = async function(limit = 20, timeframe = 7) {
  const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
  
  const trending = await this.aggregate([
    {
      $match: {
        followedAt: { $gte: startDate },
        status: 'ACTIVE'
      }
    },
    {
      $group: {
        _id: '$following',
        followerCount: { $sum: 1 },
        latestFollow: { $max: '$followedAt' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $lookup: {
        from: 'karmas',
        localField: '_id',
        foreignField: 'userId',
        as: 'karma'
      }
    },
    {
      $addFields: {
        karmaScore: { $ifNull: [{ $arrayElemAt: ['$karma.totalKarma', 0] }, 0] }
      }
    },
    {
      $project: {
        _id: '$user._id',
        name: '$user.name',
        username: '$user.username',
        avatar: '$user.avatar',
        bio: '$user.bio',
        followerCount: 1,
        karmaScore: 1,
        latestFollow: 1
      }
    },
    {
      $sort: {
        followerCount: -1,
        karmaScore: -1
      }
    },
    {
      $limit: limit
    }
  ]);
  
  return trending;
};

// Instance method to mute a follow
followSchema.methods.mute = function() {
  this.status = 'MUTED';
  this.mutedAt = new Date();
  return this.save();
};

// Instance method to unmute a follow
followSchema.methods.unmute = function() {
  this.status = 'ACTIVE';
  this.mutedAt = null;
  return this.save();
};

// Instance method to block a follow
followSchema.methods.block = function() {
  this.status = 'BLOCKED';
  this.blockedAt = new Date();
  return this.save();
};

// Instance method to unblock a follow
followSchema.methods.unblock = function() {
  this.status = 'ACTIVE';
  this.blockedAt = null;
  return this.save();
};

// Pre-save middleware to prevent self-following
followSchema.pre('save', function(next) {
  if (this.follower.toString() === this.following.toString()) {
    const error = new Error('Users cannot follow themselves');
    error.statusCode = 400;
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Follow', followSchema);
