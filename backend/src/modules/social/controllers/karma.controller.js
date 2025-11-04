const karmaService = require('../services/karma.service');
const { logger } = require('../../../core/utils/logger');
const { ResponseHandler } = require('../../../core/utils/response');

class KarmaController {
  // Get user karma profile
  async getUserKarma(req, res, next) {
    try {
      const { userId } = req.params;
      const karma = await karmaService.getUserKarma(userId);
      
      return ResponseHandler.success(res, {
        karma: karma,
        message: 'User karma retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get user karma:`, error);
      next(error);
    }
  }

  // Get karma leaderboard
  async getLeaderboard(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const leaderboard = await karmaService.getLeaderboard(
        parseInt(limit),
        parseInt(offset)
      );
      
      return ResponseHandler.success(res, {
        leaderboard,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: leaderboard.length === parseInt(limit)
        },
        message: 'Karma leaderboard retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get karma leaderboard:`, error);
      next(error);
    }
  }

  // Get users by level
  async getUsersByLevel(req, res, next) {
    try {
      const { level } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const users = await karmaService.getUsersByLevel(
        level,
        parseInt(limit),
        parseInt(offset)
      );
      
      return ResponseHandler.success(res, {
        users,
        level,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: users.length === parseInt(limit)
        },
        message: `Users with level ${level} retrieved successfully`
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get users by level:`, error);
      next(error);
    }
  }

  // Get karma statistics
  async getKarmaStats(req, res, next) {
    try {
      const stats = await karmaService.getKarmaStats();
      
      return ResponseHandler.success(res, {
        stats,
        message: 'Karma statistics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get karma statistics:`, error);
      next(error);
    }
  }

  // Get user karma history
  async getUserKarmaHistory(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const history = await karmaService.getUserKarmaHistory(
        userId,
        parseInt(limit),
        parseInt(offset)
      );
      
      return ResponseHandler.success(res, {
        history: history.history,
        pagination: history.pagination,
        message: 'User karma history retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get user karma history:`, error);
      next(error);
    }
  }

  // Get user badges
  async getUserBadges(req, res, next) {
    try {
      const { userId } = req.params;
      const badges = await karmaService.getUserBadges(userId);
      
      return ResponseHandler.success(res, {
        badges,
        message: 'User badges retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get user badges:`, error);
      next(error);
    }
  }

  // Get user unlocked reactions
  async getUserUnlockedReactions(req, res, next) {
    try {
      const { userId } = req.params;
      const reactions = await karmaService.getUserUnlockedReactions(userId);
      
      return ResponseHandler.success(res, {
        reactions,
        message: 'User unlocked reactions retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get user unlocked reactions:`, error);
      next(error);
    }
  }

  // Check if user can use reaction
  async canUseReaction(req, res, next) {
    try {
      const { userId } = req.params;
      const { reactionType } = req.query;
      
      if (!reactionType) {
        return res.status(400).json({
          success: false,
          message: 'Reaction type is required'
        });
      }
      
      const canUse = await karmaService.canUseReaction(userId, reactionType);
      
      return ResponseHandler.success(res, {
        canUse,
        reactionType,
        message: `Reaction permission check for ${reactionType}`
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to check reaction permission:`, error);
      next(error);
    }
  }

  // Get user reaction weight
  async getUserReactionWeight(req, res, next) {
    try {
      const { userId } = req.params;
      const weight = await karmaService.getReactionWeight(userId);
      
      return ResponseHandler.success(res, {
        weight,
        message: 'User reaction weight retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get user reaction weight:`, error);
      next(error);
    }
  }

  // Get current user karma (for authenticated user)
  async getMyKarma(req, res, next) {
    try {
      const userId = req.user.userId;
      const karma = await karmaService.getUserKarma(userId);
      
      return ResponseHandler.success(res, {
        karma,
        message: 'Your karma retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get current user karma:`, error);
      next(error);
    }
  }

  // Get current user badges
  async getMyBadges(req, res, next) {
    try {
      const userId = req.user.userId;
      const badges = await karmaService.getUserBadges(userId);
      
      return ResponseHandler.success(res, {
        badges,
        message: 'Your badges retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get current user badges:`, error);
      next(error);
    }
  }

  // Get current user unlocked reactions
  async getMyUnlockedReactions(req, res, next) {
    try {
      const userId = req.user.userId;
      const reactions = await karmaService.getUserUnlockedReactions(userId);
      
      return ResponseHandler.success(res, {
        reactions,
        message: 'Your unlocked reactions retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get current user unlocked reactions:`, error);
      next(error);
    }
  }

  // Get current user karma history
  async getMyKarmaHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const { limit = 50, offset = 0 } = req.query;
      
      const history = await karmaService.getUserKarmaHistory(
        userId,
        parseInt(limit),
        parseInt(offset)
      );
      
      return ResponseHandler.success(res, {
        history: history.history,
        pagination: history.pagination,
        message: 'Your karma history retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get current user karma history:`, error);
      next(error);
    }
  }

  // Add karma (admin only)
  async addKarma(req, res, next) {
    try {
      const { userId, amount, source, description, sourceId } = req.body;
      
      const result = await karmaService.addKarma(userId, amount, source, description, sourceId);
      
      return ResponseHandler.success(res, {
        result,
        message: 'Karma added successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to add karma:`, error);
      next(error);
    }
  }

  // Deduct karma (admin only)
  async deductKarma(req, res, next) {
    try {
      const { userId, amount, source, description, sourceId } = req.body;
      
      const result = await karmaService.deductKarma(userId, amount, source, description, sourceId);
      
      return ResponseHandler.success(res, {
        result,
        message: 'Karma deducted successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to deduct karma:`, error);
      next(error);
    }
  }
}

module.exports = new KarmaController();
