const topicService = require('../services/topic.service');
const { logger } = require('../../../core/utils/logger');
const { ResponseHandler } = require('../../../core/utils/response');

class TopicController {
  // Create a new topic
  async createTopic(req, res, next) {
    try {
      const userId = req.user.userId;
      const topic = await topicService.createTopic(req.body, userId);

      return ResponseHandler.success(res, {
        topic,
        message: 'Topic created successfully'
      }, 201);
    } catch (error) {
      logger.error(`[ERROR] Failed to create topic:`, error);
      next(error);
    }
  }

  // Get all topics
  async getAllTopics(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'name',
        sortOrder = 'asc',
        isActive = true,
        isPublic = true,
        isCommunity = null,
        parentTopicId = null,
        level = null,
        status = 'active',
        search = null
      } = req.query;

      const result = await topicService.getAllTopics({
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        isActive: isActive === 'true',
        isPublic: isPublic === 'true',
        isCommunity: isCommunity === 'true' ? true : isCommunity === 'false' ? false : null,
        parentTopicId,
        level: level ? parseInt(level) : null,
        status,
        search
      });

      return ResponseHandler.success(res, {
        topics: result.topics,
        pagination: result.pagination,
        message: 'Topics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get topics:`, error);
      next(error);
    }
  }

  // Get topic by ID
  async getTopicById(req, res, next) {
    try {
      const { topicId } = req.params;
      const topic = await topicService.getTopicById(topicId);

      return ResponseHandler.success(res, {
        topic,
        message: 'Topic retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get topic by ID:`, error);
      next(error);
    }
  }

  // Get topic by slug
  async getTopicBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const topic = await topicService.getTopicBySlug(slug);

      return ResponseHandler.success(res, {
        topic,
        message: 'Topic retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get topic by slug:`, error);
      next(error);
    }
  }

  // Update a topic
  async updateTopic(req, res, next) {
    try {
      const { topicId } = req.params;
      const userId = req.user.userId;
      const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

      const topic = await topicService.updateTopic(topicId, req.body, userId, isModerator);

      return ResponseHandler.success(res, {
        topic,
        message: 'Topic updated successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to update topic:`, error);
      next(error);
    }
  }

  // Delete a topic
  async deleteTopic(req, res, next) {
    try {
      const { topicId } = req.params;
      const userId = req.user.userId;
      const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

      const result = await topicService.deleteTopic(topicId, userId, isModerator);

      return ResponseHandler.success(res, {
        result,
        message: 'Topic deleted successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to delete topic:`, error);
      next(error);
    }
  }

  // Get topic hierarchy
  async getTopicHierarchy(req, res, next) {
    try {
      const topics = await topicService.getTopicHierarchy();

      return ResponseHandler.success(res, {
        topics,
        message: 'Topic hierarchy retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get topic hierarchy:`, error);
      next(error);
    }
  }

  // Get popular topics
  async getPopularTopics(req, res, next) {
    try {
      const { limit = 20 } = req.query;
      const topics = await topicService.getPopularTopics(parseInt(limit));

      return ResponseHandler.success(res, {
        topics,
        message: 'Popular topics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get popular topics:`, error);
      next(error);
    }
  }

  // Get trending topics
  async getTrendingTopics(req, res, next) {
    try {
      const { timeframe = 7, limit = 10 } = req.query;
      const topics = await topicService.getTrendingTopics(
        parseInt(timeframe),
        parseInt(limit)
      );

      return ResponseHandler.success(res, {
        topics,
        message: 'Trending topics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending topics:`, error);
      next(error);
    }
  }

  // Get community topics
  async getCommunityTopics(req, res, next) {
    try {
      const { limit = 20 } = req.query;
      const topics = await topicService.getCommunityTopics(parseInt(limit));

      return ResponseHandler.success(res, {
        topics,
        message: 'Community topics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get community topics:`, error);
      next(error);
    }
  }

  // Search topics
  async searchTopics(req, res, next) {
    try {
      const { q, limit = 20, offset = 0, includePrivate = false } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const topics = await topicService.searchTopics(q.trim(), {
        limit: parseInt(limit),
        offset: parseInt(offset),
        includePrivate: includePrivate === 'true'
      });

      return ResponseHandler.success(res, {
        topics,
        query: q.trim(),
        message: 'Topic search completed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to search topics:`, error);
      next(error);
    }
  }

  // Get topic statistics
  async getTopicStats(req, res, next) {
    try {
      const stats = await topicService.getTopicStats();

      return ResponseHandler.success(res, {
        stats,
        message: 'Topic statistics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get topic stats:`, error);
      next(error);
    }
  }

  // Get subtopics
  async getSubtopics(req, res, next) {
    try {
      const { topicId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      const result = await topicService.getSubtopics(topicId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        subtopics: result.subtopics,
        pagination: result.pagination,
        message: 'Subtopics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get subtopics:`, error);
      next(error);
    }
  }

  // Add moderator to topic
  async addModerator(req, res, next) {
    try {
      const { topicId } = req.params;
      const { userId } = req.body;
      const addedBy = req.user.userId;
      const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

      const topic = await topicService.addModerator(topicId, userId, addedBy, isModerator);

      return ResponseHandler.success(res, {
        topic,
        message: 'Moderator added successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to add moderator:`, error);
      next(error);
    }
  }

  // Remove moderator from topic
  async removeModerator(req, res, next) {
    try {
      const { topicId } = req.params;
      const { userId } = req.body;
      const removedBy = req.user.userId;
      const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

      const topic = await topicService.removeModerator(topicId, userId, removedBy, isModerator);

      return ResponseHandler.success(res, {
        topic,
        message: 'Moderator removed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to remove moderator:`, error);
      next(error);
    }
  }

  // Join topic
  async joinTopic(req, res, next) {
    try {
      const { topicId } = req.params;
      const userId = req.user.userId;

      const result = await topicService.joinTopic(topicId, userId);

      return ResponseHandler.success(res, {
        result,
        message: 'Joined topic successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to join topic:`, error);
      next(error);
    }
  }

  // Leave topic
  async leaveTopic(req, res, next) {
    try {
      const { topicId } = req.params;
      const userId = req.user.userId;

      const result = await topicService.leaveTopic(topicId, userId);

      return ResponseHandler.success(res, {
        result,
        message: 'Left topic successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to leave topic:`, error);
      next(error);
    }
  }

  // Follow topic
  async followTopic(req, res, next) {
    try {
      const { topicId } = req.params;
      const userId = req.user.userId;

      const result = await topicService.followTopic(topicId, userId);

      return ResponseHandler.success(res, {
        result,
        message: 'Topic followed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to follow topic:`, error);
      next(error);
    }
  }

  // Unfollow topic
  async unfollowTopic(req, res, next) {
    try {
      const { topicId } = req.params;
      const userId = req.user.userId;

      const result = await topicService.unfollowTopic(topicId, userId);

      return ResponseHandler.success(res, {
        result,
        message: 'Topic unfollowed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to unfollow topic:`, error);
      next(error);
    }
  }

  // Get topic posts
  async getTopicPosts(req, res, next) {
    try {
      const { topicId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await topicService.getTopicPosts(topicId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        posts: result.posts,
        pagination: result.pagination,
        message: 'Topic posts retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get topic posts:`, error);
      next(error);
    }
  }

  // Update engagement scores (admin only)
  async updateEngagementScores(req, res, next) {
    try {
      const result = await topicService.updateEngagementScores();

      return ResponseHandler.success(res, {
        result,
        message: 'Engagement scores updated successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to update engagement scores:`, error);
      next(error);
    }
  }
}

module.exports = new TopicController();
