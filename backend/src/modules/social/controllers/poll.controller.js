const pollService = require('../services/poll.service');
const { logger } = require('../../../core/utils/logger');
const { ResponseHandler } = require('../../../core/utils/response');

class PollController {
  // Create a new poll
  async createPoll(req, res, next) {
    try {
      const userId = req.user._id;
      const pollData = req.body;

      const poll = await pollService.createPoll(userId, pollData);

      return ResponseHandler.success(res, {
        poll,
        message: 'Poll created successfully'
      }, 201);
    } catch (error) {
      logger.error(`[ERROR] Failed to create poll:`, error);
      next(error);
    }
  }

  // Get poll by ID
  async getPollById(req, res, next) {
    try {
      const { pollId } = req.params;
      const poll = await pollService.getPollById(pollId);

      return ResponseHandler.success(res, {
        poll,
        message: 'Poll retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get poll by ID:`, error);
      next(error);
    }
  }

  // Vote on poll
  async voteOnPoll(req, res, next) {
    try {
      const { pollId } = req.params;
      const userId = req.user._id;
      const { optionId, voteReason } = req.body;

      const voteData = {
        voteReason,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      };

      const result = await pollService.voteOnPoll(pollId, userId, optionId, voteData);

      return ResponseHandler.success(res, {
        poll: result.poll,
        vote: result.vote,
        message: 'Vote cast successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to vote on poll:`, error);
      next(error);
    }
  }

  // Remove vote from poll
  async removeVote(req, res, next) {
    try {
      const { pollId } = req.params;
      const userId = req.user._id;
      const { optionId } = req.body;

      const poll = await pollService.removeVote(pollId, userId, optionId);

      return ResponseHandler.success(res, {
        poll,
        message: 'Vote removed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to remove vote:`, error);
      next(error);
    }
  }

  // Get poll results
  async getPollResults(req, res, next) {
    try {
      const { pollId } = req.params;
      const userId = req.user._id;

      const results = await pollService.getPollResults(pollId, userId);

      return ResponseHandler.success(res, {
        results,
        message: 'Poll results retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get poll results:`, error);
      next(error);
    }
  }

  // Get active polls
  async getActivePolls(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await pollService.getActivePolls({
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        polls: result.polls,
        pagination: result.pagination,
        message: 'Active polls retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get active polls:`, error);
      next(error);
    }
  }

  // Get trending polls
  async getTrendingPolls(req, res, next) {
    try {
      const { limit = 20 } = req.query;
      const polls = await pollService.getTrendingPolls(parseInt(limit));

      return ResponseHandler.success(res, {
        polls,
        message: 'Trending polls retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending polls:`, error);
      next(error);
    }
  }

  // Get polls by category
  async getPollsByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const polls = await pollService.getPollsByCategory(category, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        polls,
        category,
        message: `${category} polls retrieved successfully`
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get polls by category:`, error);
      next(error);
    }
  }

  // Get user's polls
  async getUserPolls(req, res, next) {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        limit = 20,
        status = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await pollService.getUserPolls(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        polls: result.polls,
        pagination: result.pagination,
        message: 'User polls retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get user polls:`, error);
      next(error);
    }
  }

  // Get current user's polls
  async getMyPolls(req, res, next) {
    try {
      const userId = req.user._id;
      const {
        page = 1,
        limit = 20,
        status = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await pollService.getUserPolls(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        polls: result.polls,
        pagination: result.pagination,
        message: 'Your polls retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get current user polls:`, error);
      next(error);
    }
  }

  // Update poll
  async updatePoll(req, res, next) {
    try {
      const { pollId } = req.params;
      const userId = req.user._id;
      const updateData = req.body;

      const poll = await pollService.updatePoll(pollId, userId, updateData);

      return ResponseHandler.success(res, {
        poll,
        message: 'Poll updated successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to update poll:`, error);
      next(error);
    }
  }

  // Close poll
  async closePoll(req, res, next) {
    try {
      const { pollId } = req.params;
      const userId = req.user._id;

      const poll = await pollService.closePoll(pollId, userId);

      return ResponseHandler.success(res, {
        poll,
        message: 'Poll closed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to close poll:`, error);
      next(error);
    }
  }

  // Cancel poll
  async cancelPoll(req, res, next) {
    try {
      const { pollId } = req.params;
      const userId = req.user._id;

      const poll = await pollService.cancelPoll(pollId, userId);

      return ResponseHandler.success(res, {
        poll,
        message: 'Poll cancelled successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to cancel poll:`, error);
      next(error);
    }
  }

  // Search polls
  async searchPolls(req, res, next) {
    try {
      const { q, page = 1, limit = 20, category = null, status = 'active', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const result = await pollService.searchPolls(q.trim(), {
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        status,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        polls: result.polls,
        query: result.query,
        pagination: result.pagination,
        message: 'Poll search completed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to search polls:`, error);
      next(error);
    }
  }

  // Get poll statistics
  async getPollStats(req, res, next) {
    try {
      const stats = await pollService.getPollStats();

      return ResponseHandler.success(res, {
        stats,
        message: 'Poll statistics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get poll stats:`, error);
      next(error);
    }
  }

  // Process expired polls (admin only)
  async processExpiredPolls(req, res, next) {
    try {
      const result = await pollService.processExpiredPolls();

      return ResponseHandler.success(res, {
        result,
        message: 'Expired polls processed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to process expired polls:`, error);
      next(error);
    }
  }
}

module.exports = new PollController();
