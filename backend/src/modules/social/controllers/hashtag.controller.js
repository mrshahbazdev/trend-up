const hashtagService = require('../services/hashtag.service');
const { logger } = require('../../../core/utils/logger');
const { ResponseHandler } = require('../../../core/utils/response');

class HashtagController {
  // Get all hashtags
  async getAllHashtags(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'postCount',
        sortOrder = 'desc',
        isActive = true,
        isBanned = false,
        minPostCount = 0,
        search = null
      } = req.query;

      const result = await hashtagService.getAllHashtags({
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        isActive: isActive === 'true',
        isBanned: isBanned === 'true',
        minPostCount: parseInt(minPostCount),
        search
      });

      return ResponseHandler.success(res, {
        hashtags: result.hashtags,
        pagination: result.pagination,
        message: 'Hashtags retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtags:`, error);
      next(error);
    }
  }

  // Get hashtag by name
  async getHashtagByName(req, res, next) {
    try {
      const { name } = req.params;
      const hashtag = await hashtagService.getHashtagByName(name);

      return ResponseHandler.success(res, {
        hashtag,
        message: 'Hashtag retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtag by name:`, error);
      next(error);
    }
  }

  // Get hashtag by ID
  async getHashtagById(req, res, next) {
    try {
      const { hashtagId } = req.params;
      const hashtag = await hashtagService.getHashtagById(hashtagId);

      return ResponseHandler.success(res, {
        hashtag,
        message: 'Hashtag retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtag by ID:`, error);
      next(error);
    }
  }

  // Update hashtag
  async updateHashtag(req, res, next) {
    try {
      const { hashtagId } = req.params;
      const userId = req.user.userId;
      const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

      const hashtag = await hashtagService.updateHashtag(hashtagId, req.body, userId, isModerator);

      return ResponseHandler.success(res, {
        hashtag,
        message: 'Hashtag updated successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to update hashtag:`, error);
      next(error);
    }
  }

  // Ban hashtag
  async banHashtag(req, res, next) {
    try {
      const { hashtagId } = req.params;
      const userId = req.user.userId;
      const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

      const result = await hashtagService.banHashtag(hashtagId, userId, isModerator);

      return ResponseHandler.success(res, {
        result,
        message: 'Hashtag banned successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to ban hashtag:`, error);
      next(error);
    }
  }

  // Unban hashtag
  async unbanHashtag(req, res, next) {
    try {
      const { hashtagId } = req.params;
      const userId = req.user.userId;
      const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

      const result = await hashtagService.unbanHashtag(hashtagId, userId, isModerator);

      return ResponseHandler.success(res, {
        result,
        message: 'Hashtag unbanned successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to unban hashtag:`, error);
      next(error);
    }
  }

  // Get trending hashtags
  async getTrendingHashtags(req, res, next) {
    try {
      const { timeframe = 24, limit = 50 } = req.query;
      const hashtags = await hashtagService.getTrendingHashtags(
        parseInt(timeframe),
        parseInt(limit)
      );

      return ResponseHandler.success(res, {
        hashtags,
        message: 'Trending hashtags retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending hashtags:`, error);
      next(error);
    }
  }

  // Get popular hashtags
  async getPopularHashtags(req, res, next) {
    try {
      const { limit = 50 } = req.query;
      const hashtags = await hashtagService.getPopularHashtags(parseInt(limit));

      return ResponseHandler.success(res, {
        hashtags,
        message: 'Popular hashtags retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get popular hashtags:`, error);
      next(error);
    }
  }

  // Search hashtags
  async searchHashtags(req, res, next) {
    try {
      const { q, limit = 20, offset = 0, includeBanned = false } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const hashtags = await hashtagService.searchHashtags(q.trim(), {
        limit: parseInt(limit),
        offset: parseInt(offset),
        includeBanned: includeBanned === 'true'
      });

      return ResponseHandler.success(res, {
        hashtags,
        query: q.trim(),
        message: 'Hashtag search completed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to search hashtags:`, error);
      next(error);
    }
  }

  // Get hashtag statistics
  async getHashtagStats(req, res, next) {
    try {
      const stats = await hashtagService.getHashtagStats();

      return ResponseHandler.success(res, {
        stats,
        message: 'Hashtag statistics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtag stats:`, error);
      next(error);
    }
  }

  // Get related hashtags
  async getRelatedHashtags(req, res, next) {
    try {
      const { hashtagId } = req.params;
      const { limit = 10 } = req.query;
      const hashtags = await hashtagService.getRelatedHashtags(hashtagId, parseInt(limit));

      return ResponseHandler.success(res, {
        hashtags,
        message: 'Related hashtags retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get related hashtags:`, error);
      next(error);
    }
  }

  // Get hashtag usage history
  async getHashtagUsageHistory(req, res, next) {
    try {
      const { hashtagId } = req.params;
      const { period = 'week' } = req.query;

      const history = await hashtagService.getHashtagUsageHistory(hashtagId, period);

      return ResponseHandler.success(res, {
        history,
        message: 'Hashtag usage history retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtag usage history:`, error);
      next(error);
    }
  }

  // Get hashtag posts
  async getHashtagPosts(req, res, next) {
    try {
      const { name } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await hashtagService.getHashtagPosts(name, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        posts: result.posts,
        hashtag: result.hashtag,
        pagination: result.pagination,
        message: 'Hashtag posts retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtag posts:`, error);
      next(error);
    }
  }

  // Extract hashtags from text
  async extractHashtags(req, res, next) {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Text is required'
        });
      }

      const hashtags = hashtagService.extractHashtags(text);

      return ResponseHandler.success(res, {
        hashtags,
        text,
        message: 'Hashtags extracted successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to extract hashtags:`, error);
      next(error);
    }
  }

  // Update trending scores (admin only)
  async updateTrendingScores(req, res, next) {
    try {
      const result = await hashtagService.updateTrendingScores();

      return ResponseHandler.success(res, {
        result,
        message: 'Trending scores updated successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to update trending scores:`, error);
      next(error);
    }
  }

  // Cleanup unused hashtags (admin only)
  async cleanupUnusedHashtags(req, res, next) {
    try {
      const result = await hashtagService.cleanupUnusedHashtags();

      return ResponseHandler.success(res, {
        result,
        message: 'Unused hashtags cleaned up successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to cleanup unused hashtags:`, error);
      next(error);
    }
  }
}

module.exports = new HashtagController();
