const { Follow, Karma } = require('../models');
const { User } = require('../../auth/models');
const { logger } = require('../../../core/utils/logger');
const mongoose = require('mongoose');

class FollowService {
  constructor() {
    // Follow limits to prevent spam
    this.followLimits = {
      maxFollowing: 5000, // Maximum users a person can follow
      maxFollowers: 10000, // Maximum followers (for rate limiting)
      dailyFollowLimit: 100, // Maximum follows per day
      hourlyFollowLimit: 20 // Maximum follows per hour
    };
  }

  // Follow a user
  async followUser(followerId, followingId, source = 'MANUAL') {
    try {
      // Check if trying to follow self
      if (followerId === followingId) {
        throw new Error('Users cannot follow themselves');
      }

      // Check if already following
      const existingFollow = await Follow.findOne({
        follower: new mongoose.Types.ObjectId(followerId),
        following: new mongoose.Types.ObjectId(followingId)
      });

      if (existingFollow) {
        if (existingFollow.status === 'ACTIVE') {
          throw new Error('Already following this user');
        } else if (existingFollow.status === 'BLOCKED') {
          throw new Error('Cannot follow this user');
        } else {
          // Reactivate muted follow
          existingFollow.status = 'ACTIVE';
          existingFollow.mutedAt = null;
          existingFollow.source = source;
          await existingFollow.save();
          return existingFollow;
        }
      }

      // Check follow limits
      await this.checkFollowLimits(followerId);

      // Create new follow relationship
      const follow = new Follow({
        follower: new mongoose.Types.ObjectId(followerId),
        following: new mongoose.Types.ObjectId(followingId),
        source,
        status: 'ACTIVE'
      });

      await follow.save();

      // Award karma for following (small amount)
      try {
        const karmaService = require('./karma.service');
        await karmaService.addKarma(
          followerId,
          1,
          'FOLLOW',
          follow._id,
          'Followed a user'
        );
      } catch (karmaError) {
        logger.error(`[ERROR] Failed to award karma for follow:`, karmaError);
      }

      logger.info(`[INFO] User ${followerId} followed user ${followingId}`);
      return follow;
    } catch (error) {
      logger.error(`[ERROR] Failed to follow user:`, error);
      throw error;
    }
  }

  // Unfollow a user
  async unfollowUser(followerId, followingId) {
    try {
      const follow = await Follow.findOne({
        follower: new mongoose.Types.ObjectId(followerId),
        following: new mongoose.Types.ObjectId(followingId)
      });

      if (!follow) {
        throw new Error('Not following this user');
      }

      await Follow.deleteOne({ _id: follow._id });

      logger.info(`[INFO] User ${followerId} unfollowed user ${followingId}`);
      return { message: 'Successfully unfollowed user' };
    } catch (error) {
      logger.error(`[ERROR] Failed to unfollow user:`, error);
      throw error;
    }
  }

  // Check if user A follows user B
  async isFollowing(followerId, followingId) {
    try {
      return await Follow.isFollowing(followerId, followingId);
    } catch (error) {
      logger.error(`[ERROR] Failed to check follow status:`, error);
      throw error;
    }
  }

  // Get user's followers
  async getFollowers(userId, limit = 50, offset = 0) {
    try {
      const followers = await Follow.find({
        following: new mongoose.Types.ObjectId(userId),
        status: 'ACTIVE'
      })
        .populate('follower', 'name username avatar bio')
        .sort({ followedAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return followers.map(follow => ({
        ...follow.follower,
        followedAt: follow.followedAt,
        followDuration: follow.followDuration,
        followDurationDays: follow.followDurationDays
      }));
    } catch (error) {
      logger.error(`[ERROR] Failed to get followers:`, error);
      throw error;
    }
  }

  // Get users that a user is following
  async getFollowing(userId, limit = 50, offset = 0) {
    try {
      const following = await Follow.find({
        follower: new mongoose.Types.ObjectId(userId),
        status: 'ACTIVE'
      })
        .populate('following', 'name username avatar bio')
        .sort({ followedAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return following.map(follow => ({
        ...follow.following,
        followedAt: follow.followedAt,
        followDuration: follow.followDuration,
        followDurationDays: follow.followDurationDays
      }));
    } catch (error) {
      logger.error(`[ERROR] Failed to get following:`, error);
      throw error;
    }
  }

  // Get mutual follows between two users
  async getMutualFollows(userId1, userId2) {
    try {
      return await Follow.getMutualFollows(userId1, userId2);
    } catch (error) {
      logger.error(`[ERROR] Failed to get mutual follows:`, error);
      throw error;
    }
  }

  // Get follow suggestions for a user
  async getFollowSuggestions(userId, limit = 10) {
    try {
      return await Follow.getFollowSuggestions(userId, limit);
    } catch (error) {
      logger.error(`[ERROR] Failed to get follow suggestions:`, error);
      throw error;
    }
  }

  // Get follower statistics
  async getFollowerStats(userId) {
    try {
      return await Follow.getFollowerStats(userId);
    } catch (error) {
      logger.error(`[ERROR] Failed to get follower stats:`, error);
      throw error;
    }
  }

  // Get following statistics
  async getFollowingStats(userId) {
    try {
      return await Follow.getFollowingStats(userId);
    } catch (error) {
      logger.error(`[ERROR] Failed to get following stats:`, error);
      throw error;
    }
  }

  // Get trending users
  async getTrendingUsers(limit = 20, timeframe = 7) {
    try {
      return await Follow.getTrendingUsers(limit, timeframe);
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending users:`, error);
      throw error;
    }
  }

  // Mute a user (stop seeing their posts in feed)
  async muteUser(followerId, followingId) {
    try {
      const follow = await Follow.findOne({
        follower: new mongoose.Types.ObjectId(followerId),
        following: new mongoose.Types.ObjectId(followingId)
      });

      if (!follow) {
        throw new Error('Not following this user');
      }

      await follow.mute();
      logger.info(`[INFO] User ${followerId} muted user ${followingId}`);
      return follow;
    } catch (error) {
      logger.error(`[ERROR] Failed to mute user:`, error);
      throw error;
    }
  }

  // Unmute a user
  async unmuteUser(followerId, followingId) {
    try {
      const follow = await Follow.findOne({
        follower: new mongoose.Types.ObjectId(followerId),
        following: new mongoose.Types.ObjectId(followingId)
      });

      if (!follow) {
        throw new Error('Not following this user');
      }

      await follow.unmute();
      logger.info(`[INFO] User ${followerId} unmuted user ${followingId}`);
      return follow;
    } catch (error) {
      logger.error(`[ERROR] Failed to unmute user:`, error);
      throw error;
    }
  }

  // Block a user
  async blockUser(followerId, followingId) {
    try {
      const follow = await Follow.findOne({
        follower: new mongoose.Types.ObjectId(followerId),
        following: new mongoose.Types.ObjectId(followingId)
      });

      if (!follow) {
        // Create a blocked follow relationship
        const blockedFollow = new Follow({
          follower: new mongoose.Types.ObjectId(followerId),
          following: new mongoose.Types.ObjectId(followingId),
          status: 'BLOCKED',
          blockedAt: new Date()
        });
        await blockedFollow.save();
        return blockedFollow;
      }

      await follow.block();
      logger.info(`[INFO] User ${followerId} blocked user ${followingId}`);
      return follow;
    } catch (error) {
      logger.error(`[ERROR] Failed to block user:`, error);
      throw error;
    }
  }

  // Unblock a user
  async unblockUser(followerId, followingId) {
    try {
      const follow = await Follow.findOne({
        follower: new mongoose.Types.ObjectId(followerId),
        following: new mongoose.Types.ObjectId(followingId)
      });

      if (!follow) {
        throw new Error('User is not blocked');
      }

      await follow.unblock();
      logger.info(`[INFO] User ${followerId} unblocked user ${followingId}`);
      return follow;
    } catch (error) {
      logger.error(`[ERROR] Failed to unblock user:`, error);
      throw error;
    }
  }

  // Search users
  async searchUsers(query, currentUserId = null, limit = 20, offset = 0) {
    try {
      const searchRegex = new RegExp(query, 'i');
      
      const searchConditions = {
        $and: [
          { isEmailVerified: true },
          {
            $or: [
              { name: searchRegex },
              { username: searchRegex },
              { bio: searchRegex }
            ]
          }
        ]
      };

      // Exclude current user from search results
      if (currentUserId) {
        searchConditions.$and.push({ _id: { $ne: new mongoose.Types.ObjectId(currentUserId) } });
      }
      
      const users = await User.find(searchConditions)
        .select('name username avatar bio isEmailVerified')
        .limit(limit)
        .skip(offset)
        .lean();

      // Add follow status for each user if currentUserId is provided
      if (currentUserId) {
        const usersWithFollowStatus = await Promise.all(
          users.map(async (user) => {
            const isFollowing = await this.isFollowing(currentUserId, user._id.toString());
            return {
              ...user,
              isFollowing
            };
          })
        );
        return usersWithFollowStatus;
      }

      return users;
    } catch (error) {
      logger.error(`[ERROR] Failed to search users:`, error);
      throw error;
    }
  }

  // Get user profile with follow status
  async getUserProfileWithFollowStatus(userId, currentUserId) {
    try {
      const user = await User.findById(userId)
        .select('name username avatar bio location website coverImage createdAt')
        .lean();

      if (!user) {
        throw new Error('User not found');
      }

      // Get follow statistics
      const followerStats = await this.getFollowerStats(userId);
      const followingStats = await this.getFollowingStats(userId);

      // Get follow status if current user is provided
      let followStatus = null;
      if (currentUserId && currentUserId !== userId) {
        const isFollowing = await this.isFollowing(currentUserId, userId);
        const isFollowedBy = await this.isFollowing(userId, currentUserId);
        
        followStatus = {
          isFollowing,
          isFollowedBy,
          canFollow: !isFollowing
        };
      }

      // Get karma information
      const karma = await Karma.findOne({ userId })
        .select('totalKarma currentLevel badges')
        .lean();

      return {
        ...user,
        stats: {
          followers: followerStats.totalFollowers,
          following: followingStats.totalFollowing,
          karma: karma?.totalKarma || 0,
          level: karma?.currentLevel || 'NEWBIE',
          badges: karma?.badges?.length || 0
        },
        followStatus
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get user profile:`, error);
      throw error;
    }
  }

  // Check follow limits
  async checkFollowLimits(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Check total following limit
      const totalFollowing = await Follow.countDocuments({
        follower: new mongoose.Types.ObjectId(userId),
        status: 'ACTIVE'
      });

      if (totalFollowing >= this.followLimits.maxFollowing) {
        throw new Error(`Cannot follow more than ${this.followLimits.maxFollowing} users`);
      }

      // Check daily follow limit
      const todayFollows = await Follow.countDocuments({
        follower: new mongoose.Types.ObjectId(userId),
        followedAt: { $gte: today }
      });

      if (todayFollows >= this.followLimits.dailyFollowLimit) {
        throw new Error(`Daily follow limit of ${this.followLimits.dailyFollowLimit} reached`);
      }

      // Check hourly follow limit
      const hourlyFollows = await Follow.countDocuments({
        follower: new mongoose.Types.ObjectId(userId),
        followedAt: { $gte: oneHourAgo }
      });

      if (hourlyFollows >= this.followLimits.hourlyFollowLimit) {
        throw new Error(`Hourly follow limit of ${this.followLimits.hourlyFollowLimit} reached`);
      }
    } catch (error) {
      logger.error(`[ERROR] Failed to check follow limits:`, error);
      throw error;
    }
  }

  // Get follow feed (users that current user follows)
  async getFollowFeed(userId, limit = 50, offset = 0) {
    try {
      const following = await Follow.find({
        follower: new mongoose.Types.ObjectId(userId),
        status: 'ACTIVE'
      }).select('following');

      const followingIds = following.map(f => f.following);

      if (followingIds.length === 0) {
        return [];
      }

      // Get recent posts from followed users
      const Post = require('../models').Post;
      const posts = await Post.find({
        userId: { $in: followingIds },
        visibility: 'public'
      })
        .populate('userId', 'name username avatar')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      return posts;
    } catch (error) {
      logger.error(`[ERROR] Failed to get follow feed:`, error);
      throw error;
    }
  }
}

module.exports = new FollowService();
