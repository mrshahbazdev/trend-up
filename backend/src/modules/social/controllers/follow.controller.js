const followService = require('../services/follow.service');
const notificationService = require('../../../core/services/notification.service');
const { logger } = require('../../../core/utils/logger');
const { ResponseHandler } = require('../../../core/utils/response');

class FollowController {
  // Follow a user
  async followUser(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user._id;
      const { source = 'MANUAL' } = req.body;

      const follow = await followService.followUser(currentUserId, userId, source);

      // Send follow notification
      if (follow && userId !== currentUserId.toString()) {
        try {
          const templates = notificationService.createNotificationTemplates();
          const notification = templates.userFollowed({
            _id: currentUserId,
            username: req.user.username || req.user.name,
            avatar: req.user.avatar
          });
          await notificationService.sendNotification(userId, notification);
          logger.info(`[INFO] Follow notification sent to user ${userId}`);
        } catch (notifError) {
          logger.error('[ERROR] Failed to send follow notification:', notifError);
          // Don't fail the request if notification fails
        }
      }

      return ResponseHandler.success(res, {
        follow,
        message: 'Successfully followed user'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to follow user:`, error);
      next(error);
    }
  }

  // Unfollow a user
  async unfollowUser(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user._id;

      const result = await followService.unfollowUser(currentUserId, userId);

      return ResponseHandler.success(res, {
        result,
        message: 'Successfully unfollowed user'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to unfollow user:`, error);
      next(error);
    }
  }

  // Check if following a user
  async isFollowing(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user._id;

      const isFollowing = await followService.isFollowing(currentUserId, userId);

      return ResponseHandler.success(res, {
        isFollowing,
        message: 'Follow status retrieved'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to check follow status:`, error);
      next(error);
    }
  }

  // Get user's followers
  async getFollowers(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const followers = await followService.getFollowers(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      return ResponseHandler.success(res, {
        followers,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: followers.length === parseInt(limit)
        },
        message: 'Followers retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get followers:`, error);
      next(error);
    }
  }

  // Get users that a user is following
  async getFollowing(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const following = await followService.getFollowing(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      return ResponseHandler.success(res, {
        following,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: following.length === parseInt(limit)
        },
        message: 'Following retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get following:`, error);
      next(error);
    }
  }

  // Get mutual follows
  async getMutualFollows(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user._id;

      const mutualFollows = await followService.getMutualFollows(currentUserId, userId);

      return ResponseHandler.success(res, {
        mutualFollows,
        message: 'Mutual follows retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get mutual follows:`, error);
      next(error);
    }
  }

  // Get follow suggestions
  async getFollowSuggestions(req, res, next) {
    try {
      const currentUserId = req.user._id;
      const { limit = 10 } = req.query;

      const suggestions = await followService.getFollowSuggestions(
        currentUserId,
        parseInt(limit)
      );

      return ResponseHandler.success(res, {
        suggestions,
        message: 'Follow suggestions retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get follow suggestions:`, error);
      next(error);
    }
  }

  // Get follower statistics
  async getFollowerStats(req, res, next) {
    try {
      const { userId } = req.params;

      const stats = await followService.getFollowerStats(userId);

      return ResponseHandler.success(res, {
        stats,
        message: 'Follower statistics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get follower stats:`, error);
      next(error);
    }
  }

  // Get following statistics
  async getFollowingStats(req, res, next) {
    try {
      const { userId } = req.params;

      const stats = await followService.getFollowingStats(userId);

      return ResponseHandler.success(res, {
        stats,
        message: 'Following statistics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get following stats:`, error);
      next(error);
    }
  }

  // Get trending users
  async getTrendingUsers(req, res, next) {
    try {
      const { limit = 20, timeframe = 7 } = req.query;

      const trendingUsers = await followService.getTrendingUsers(
        parseInt(limit),
        parseInt(timeframe)
      );

      return ResponseHandler.success(res, {
        trendingUsers,
        message: 'Trending users retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending users:`, error);
      next(error);
    }
  }

  // Mute a user
  async muteUser(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user._id;

      const follow = await followService.muteUser(currentUserId, userId);

      return ResponseHandler.success(res, {
        follow,
        message: 'User muted successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to mute user:`, error);
      next(error);
    }
  }

  // Unmute a user
  async unmuteUser(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user._id;

      const follow = await followService.unmuteUser(currentUserId, userId);

      return ResponseHandler.success(res, {
        follow,
        message: 'User unmuted successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to unmute user:`, error);
      next(error);
    }
  }

  // Block a user
  async blockUser(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user._id;

      const follow = await followService.blockUser(currentUserId, userId);

      return ResponseHandler.success(res, {
        follow,
        message: 'User blocked successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to block user:`, error);
      next(error);
    }
  }

  // Unblock a user
  async unblockUser(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user._id;

      const follow = await followService.unblockUser(currentUserId, userId);

      return ResponseHandler.success(res, {
        follow,
        message: 'User unblocked successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to unblock user:`, error);
      next(error);
    }
  }

  // Search users
  async searchUsers(req, res, next) {
    try {
      const { q, limit = 20, offset = 0 } = req.query;
      const currentUserId = req.user?._id; // Get current user ID if authenticated

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const users = await followService.searchUsers(
        q.trim(),
        currentUserId, // Pass current user ID
        parseInt(limit),
        parseInt(offset)
      );

      return ResponseHandler.success(res, {
        users,
        query: q.trim(),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: users.length === parseInt(limit)
        },
        message: 'User search completed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to search users:`, error);
      next(error);
    }
  }

  // Get user profile with follow status
  async getUserProfile(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?._id;

      const profile = await followService.getUserProfileWithFollowStatus(
        userId,
        currentUserId
      );

      return ResponseHandler.success(res, {
        profile,
        message: 'User profile retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get user profile:`, error);
      next(error);
    }
  }

  // Get follow feed
  async getFollowFeed(req, res, next) {
    try {
      const currentUserId = req.user._id;
      const { limit = 50, offset = 0 } = req.query;

      const posts = await followService.getFollowFeed(
        currentUserId,
        parseInt(limit),
        parseInt(offset)
      );

      return ResponseHandler.success(res, {
        posts,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: posts.length === parseInt(limit)
        },
        message: 'Follow feed retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get follow feed:`, error);
      next(error);
    }
  }

  // Get current user's follow statistics
  async getMyFollowStats(req, res, next) {
    try {
      const currentUserId = req.user._id;

      const followerStats = await followService.getFollowerStats(currentUserId);
      const followingStats = await followService.getFollowingStats(currentUserId);

      return ResponseHandler.success(res, {
        stats: {
          followers: followerStats,
          following: followingStats
        },
        message: 'Your follow statistics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get current user follow stats:`, error);
      next(error);
    }
  }
}

module.exports = new FollowController();
