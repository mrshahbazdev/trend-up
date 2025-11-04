const badgeService = require('../services/badge.service');
const { logger } = require('../../../core/utils/logger');
const { ResponseHandler } = require('../../../core/utils/response');

class BadgeController {
  // Get all badges
  async getAllBadges(req, res, next) {
    try {
      const { active = true } = req.query;
      const badges = await badgeService.getAllBadges(active === 'true');
      
      return ResponseHandler.success(res, {
        badges,
        message: 'All badges retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get all badges:`, error);
      next(error);
    }
  }

  // Get badges by category
  async getBadgesByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const { active = true } = req.query;
      
      const badges = await badgeService.getBadgesByCategory(category, active === 'true');
      
      return ResponseHandler.success(res, {
        badges,
        category,
        message: `Badges in category ${category} retrieved successfully`
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get badges by category:`, error);
      next(error);
    }
  }

  // Get badges by rarity
  async getBadgesByRarity(req, res, next) {
    try {
      const { rarity } = req.params;
      const { active = true } = req.query;
      
      const badges = await badgeService.getBadgesByRarity(rarity, active === 'true');
      
      return ResponseHandler.success(res, {
        badges,
        rarity,
        message: `Badges with rarity ${rarity} retrieved successfully`
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get badges by rarity:`, error);
      next(error);
    }
  }

  // Get available badges for user
  async getAvailableBadgesForUser(req, res, next) {
    try {
      const { userId } = req.params;
      const badges = await badgeService.getAvailableBadgesForUser(userId);
      
      return ResponseHandler.success(res, {
        badges,
        message: `Available badges for user ${userId} retrieved successfully`
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get available badges for user:`, error);
      next(error);
    }
  }

  // Get badge by ID
  async getBadgeById(req, res, next) {
    try {
      const { badgeId } = req.params;
      const badge = await badgeService.getBadgeById(badgeId);
      
      if (!badge) {
        return res.status(404).json({
          success: false,
          message: 'Badge not found'
        });
      }
      
      return ResponseHandler.success(res, {
        badge,
        message: 'Badge retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get badge by ID:`, error);
      next(error);
    }
  }

  // Get badge statistics
  async getBadgeStats(req, res, next) {
    try {
      const stats = await badgeService.getBadgeStats();
      
      return ResponseHandler.success(res, {
        stats,
        message: 'Badge statistics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get badge statistics:`, error);
      next(error);
    }
  }

  // Get user badge progress
  async getUserBadgeProgress(req, res, next) {
    try {
      const { userId } = req.params;
      const progress = await badgeService.getUserBadgeProgress(userId);
      
      return ResponseHandler.success(res, {
        progress,
        message: `Badge progress for user ${userId} retrieved successfully`
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get user badge progress:`, error);
      next(error);
    }
  }

  // Get current user badge progress
  async getMyBadgeProgress(req, res, next) {
    try {
      const userId = req.user.userId;
      const progress = await badgeService.getUserBadgeProgress(userId);
      
      return ResponseHandler.success(res, {
        progress,
        message: 'Your badge progress retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get current user badge progress:`, error);
      next(error);
    }
  }

  // Get current user available badges
  async getMyAvailableBadges(req, res, next) {
    try {
      const userId = req.user.userId;
      const badges = await badgeService.getAvailableBadgesForUser(userId);
      
      return ResponseHandler.success(res, {
        badges,
        message: 'Your available badges retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get current user available badges:`, error);
      next(error);
    }
  }

  // Initialize badges (admin only)
  async initializeBadges(req, res, next) {
    try {
      await badgeService.initializeBadges();
      
      return ResponseHandler.success(res, {
        message: 'Badges initialized successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to initialize badges:`, error);
      next(error);
    }
  }

  // Create new badge (admin only)
  async createBadge(req, res, next) {
    try {
      const badgeData = req.body;
      const badge = await badgeService.createBadge(badgeData);
      
      return ResponseHandler.success(res, {
        badge,
        message: 'Badge created successfully'
      }, 201);
    } catch (error) {
      logger.error(`[ERROR] Failed to create badge:`, error);
      next(error);
    }
  }

  // Update badge (admin only)
  async updateBadge(req, res, next) {
    try {
      const { badgeId } = req.params;
      const updateData = req.body;
      
      const badge = await badgeService.updateBadge(badgeId, updateData);
      
      return ResponseHandler.success(res, {
        badge,
        message: 'Badge updated successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to update badge:`, error);
      next(error);
    }
  }

  // Delete badge (admin only)
  async deleteBadge(req, res, next) {
    try {
      const { badgeId } = req.params;
      const badge = await badgeService.deleteBadge(badgeId);
      
      return ResponseHandler.success(res, {
        badge,
        message: 'Badge deleted successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to delete badge:`, error);
      next(error);
    }
  }
}

module.exports = new BadgeController();
