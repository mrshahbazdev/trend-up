const feedService = require('../services/feed.service');
const { logger } = require('../../../core/utils/logger');
const { ResponseHandler } = require('../../../core/utils/response');

class FeedController {
  // Get user's personalized feed
  async getUserFeed(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        feedType = 'personalized',
        page = 1,
        limit = 20,
        categoryId = null,
        topicId = null,
        hashtagId = null,
        forceRefresh = false
      } = req.query;

      const result = await feedService.getUserFeed(userId, {
        feedType,
        page: parseInt(page),
        limit: parseInt(limit),
        categoryId,
        topicId,
        hashtagId,
        forceRefresh: forceRefresh === 'true'
      });

      return ResponseHandler.success(res, {
        posts: result.posts,
        feedType: result.feedType,
        pagination: result.pagination,
        lastUpdated: result.lastUpdated,
        nextUpdate: result.nextUpdate,
        message: 'Feed retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get user feed:`, error);
      next(error);
    }
  }

  // Get following feed
  async getFollowingFeed(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        page = 1,
        limit = 20,
        forceRefresh = false
      } = req.query;

      const result = await feedService.getUserFeed(userId, {
        feedType: 'following',
        page: parseInt(page),
        limit: parseInt(limit),
        forceRefresh: forceRefresh === 'true'
      });

      return ResponseHandler.success(res, {
        posts: result.posts,
        feedType: 'following',
        pagination: result.pagination,
        lastUpdated: result.lastUpdated,
        nextUpdate: result.nextUpdate,
        message: 'Following feed retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get following feed:`, error);
      next(error);
    }
  }

  // Get trending feed
  async getTrendingFeed(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        page = 1,
        limit = 20,
        forceRefresh = false
      } = req.query;

      const result = await feedService.getUserFeed(userId, {
        feedType: 'trending',
        page: parseInt(page),
        limit: parseInt(limit),
        forceRefresh: forceRefresh === 'true'
      });

      return ResponseHandler.success(res, {
        posts: result.posts,
        feedType: 'trending',
        pagination: result.pagination,
        lastUpdated: result.lastUpdated,
        nextUpdate: result.nextUpdate,
        message: 'Trending feed retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending feed:`, error);
      next(error);
    }
  }

  // Get category feed
  async getCategoryFeed(req, res, next) {
    try {
      const userId = req.user.userId;
      const { categoryId } = req.params;
      const {
        page = 1,
        limit = 20,
        forceRefresh = false
      } = req.query;

      const result = await feedService.getUserFeed(userId, {
        feedType: 'category',
        page: parseInt(page),
        limit: parseInt(limit),
        categoryId,
        forceRefresh: forceRefresh === 'true'
      });

      return ResponseHandler.success(res, {
        posts: result.posts,
        feedType: 'category',
        categoryId,
        pagination: result.pagination,
        lastUpdated: result.lastUpdated,
        nextUpdate: result.nextUpdate,
        message: 'Category feed retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get category feed:`, error);
      next(error);
    }
  }

  // Get topic feed
  async getTopicFeed(req, res, next) {
    try {
      const userId = req.user.userId;
      const { topicId } = req.params;
      const {
        page = 1,
        limit = 20,
        forceRefresh = false
      } = req.query;

      const result = await feedService.getUserFeed(userId, {
        feedType: 'topic',
        page: parseInt(page),
        limit: parseInt(limit),
        topicId,
        forceRefresh: forceRefresh === 'true'
      });

      return ResponseHandler.success(res, {
        posts: result.posts,
        feedType: 'topic',
        topicId,
        pagination: result.pagination,
        lastUpdated: result.lastUpdated,
        nextUpdate: result.nextUpdate,
        message: 'Topic feed retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get topic feed:`, error);
      next(error);
    }
  }

  // Get hashtag feed
  async getHashtagFeed(req, res, next) {
    try {
      const userId = req.user.userId;
      const { hashtagId } = req.params;
      const {
        page = 1,
        limit = 20,
        forceRefresh = false
      } = req.query;

      const result = await feedService.getUserFeed(userId, {
        feedType: 'hashtag',
        page: parseInt(page),
        limit: parseInt(limit),
        hashtagId,
        forceRefresh: forceRefresh === 'true'
      });

      return ResponseHandler.success(res, {
        posts: result.posts,
        feedType: 'hashtag',
        hashtagId,
        pagination: result.pagination,
        lastUpdated: result.lastUpdated,
        nextUpdate: result.nextUpdate,
        message: 'Hashtag feed retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtag feed:`, error);
      next(error);
    }
  }

  // Get discover feed
  async getDiscoverFeed(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        page = 1,
        limit = 20,
        forceRefresh = false
      } = req.query;

      const result = await feedService.getUserFeed(userId, {
        feedType: 'discover',
        page: parseInt(page),
        limit: parseInt(limit),
        forceRefresh: forceRefresh === 'true'
      });

      return ResponseHandler.success(res, {
        posts: result.posts,
        feedType: 'discover',
        pagination: result.pagination,
        lastUpdated: result.lastUpdated,
        nextUpdate: result.nextUpdate,
        message: 'Discover feed retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get discover feed:`, error);
      next(error);
    }
  }

  // Refresh user's feed
  async refreshFeed(req, res, next) {
    try {
      const userId = req.user.userId;
      const { feedType = 'personalized' } = req.body;

      const result = await feedService.getUserFeed(userId, {
        feedType,
        page: 1,
        limit: 20,
        forceRefresh: true
      });

      return ResponseHandler.success(res, {
        posts: result.posts,
        feedType: result.feedType,
        pagination: result.pagination,
        lastUpdated: result.lastUpdated,
        nextUpdate: result.nextUpdate,
        message: 'Feed refreshed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to refresh feed:`, error);
      next(error);
    }
  }

  // Get feed statistics
  async getFeedStats(req, res, next) {
    try {
      const stats = await feedService.getFeedStats();

      return ResponseHandler.success(res, {
        stats,
        message: 'Feed statistics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get feed stats:`, error);
      next(error);
    }
  }

  // Update stale feeds (admin only)
  async updateStaleFeeds(req, res, next) {
    try {
      const result = await feedService.updateStaleFeeds();

      return ResponseHandler.success(res, {
        result,
        message: 'Stale feeds updated successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to update stale feeds:`, error);
      next(error);
    }
  }

  // Get feed performance metrics
  async getFeedPerformance(req, res, next) {
    try {
      const { Feed } = require('../models');
      const performance = await Feed.getFeedPerformance();

      return ResponseHandler.success(res, {
        performance: performance[0] || {
          avgLoadTime: 0,
          avgCacheHitRate: 0,
          avgUserEngagement: 0
        },
        message: 'Feed performance metrics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get feed performance:`, error);
      next(error);
    }
  }

  // Get user's feed preferences
  async getFeedPreferences(req, res, next) {
    try {
      const userId = req.user.userId;
      const { Feed } = require('../models');

      const feed = await Feed.findOne({
        userId: new require('mongoose').Types.ObjectId(userId),
        feedType: 'personalized'
      }).select('preferences');

      return ResponseHandler.success(res, {
        preferences: feed?.preferences || {
          includeReplies: true,
          includeReposts: true,
          minKarmaLevel: 'NEWBIE',
          maxAge: 7,
          languages: [],
          excludeCategories: [],
          excludeTopics: [],
          excludeUsers: []
        },
        message: 'Feed preferences retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get feed preferences:`, error);
      next(error);
    }
  }

  // Update user's feed preferences
  async updateFeedPreferences(req, res, next) {
    try {
      const userId = req.user.userId;
      const { preferences } = req.body;
      const { Feed } = require('../models');

      const feed = await Feed.findOneAndUpdate(
        {
          userId: new require('mongoose').Types.ObjectId(userId),
          feedType: 'personalized'
        },
        { preferences },
        { upsert: true, new: true }
      );

      return ResponseHandler.success(res, {
        preferences: feed.preferences,
        message: 'Feed preferences updated successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to update feed preferences:`, error);
      next(error);
    }
  }

  // Get feed recommendations
  async getFeedRecommendations(req, res, next) {
    try {
      const userId = req.user.userId;
      const { limit = 10 } = req.query;

      // Get user's interests
      const userInterests = await feedService.getUserInterests(userId);

      // Get recommended categories, topics, and hashtags
      const { Category, Topic, Hashtag } = require('../models');

      const recommendedCategories = await Category.find({
        _id: { $nin: userInterests.categories },
        isActive: true,
        isPublic: true
      })
        .sort({ postCount: -1 })
        .limit(parseInt(limit))
        .select('name slug description postCount');

      const recommendedTopics = await Topic.find({
        _id: { $nin: userInterests.topics },
        isActive: true,
        isPublic: true,
        status: 'active'
      })
        .sort({ postCount: -1 })
        .limit(parseInt(limit))
        .select('name slug description postCount memberCount');

      const recommendedHashtags = await Hashtag.find({
        name: { $nin: userInterests.hashtags },
        isActive: true,
        isBanned: false
      })
        .sort({ postCount: -1 })
        .limit(parseInt(limit))
        .select('name postCount');

      return ResponseHandler.success(res, {
        recommendations: {
          categories: recommendedCategories,
          topics: recommendedTopics,
          hashtags: recommendedHashtags
        },
        message: 'Feed recommendations retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get feed recommendations:`, error);
      next(error);
    }
  }
}

module.exports = new FeedController();
