const predictionService = require('../services/prediction.service');
const { logger } = require('../../../core/utils/logger');
const { ResponseHandler } = require('../../../core/utils/response');

class PredictionController {
  // Create a new prediction
  async createPrediction(req, res, next) {
    try {
      const userId = req.user._id;
      const predictionData = req.body;

      const prediction = await predictionService.createPrediction(userId, predictionData);

      return ResponseHandler.success(res, {
        prediction,
        message: 'Prediction created successfully'
      }, 201);
    } catch (error) {
      logger.error(`[ERROR] Failed to create prediction:`, error);
      next(error);
    }
  }

  // Get prediction by ID
  async getPredictionById(req, res, next) {
    try {
      const { predictionId } = req.params;
      const prediction = await predictionService.getPredictionById(predictionId);

      return ResponseHandler.success(res, {
        prediction,
        message: 'Prediction retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get prediction by ID:`, error);
      next(error);
    }
  }

  // Stake on prediction
  async stakeOnPrediction(req, res, next) {
    try {
      const { predictionId } = req.params;
      const userId = req.user._id;
      const { stake, position } = req.body;

      if (!stake || stake <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid stake amount is required'
        });
      }

      if (!position || !['agree', 'disagree'].includes(position)) {
        return res.status(400).json({
          success: false,
          message: 'Position must be either "agree" or "disagree"'
        });
      }

      const prediction = await predictionService.stakeOnPrediction(predictionId, userId, stake, position);

      return ResponseHandler.success(res, {
        prediction,
        message: 'Stake placed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to stake on prediction:`, error);
      next(error);
    }
  }

  // Remove stake from prediction
  async removeStake(req, res, next) {
    try {
      const { predictionId } = req.params;
      const userId = req.user._id;

      const prediction = await predictionService.removeStake(predictionId, userId);

      return ResponseHandler.success(res, {
        prediction,
        message: 'Stake removed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to remove stake:`, error);
      next(error);
    }
  }

  // Resolve prediction (moderator/admin only)
  async resolvePrediction(req, res, next) {
    try {
      const { predictionId } = req.params;
      const moderatorId = req.user._id;
      const { outcome, resolutionNote, finalPrice } = req.body;

      if (!outcome || !['agree', 'disagree', 'inconclusive'].includes(outcome)) {
        return res.status(400).json({
          success: false,
          message: 'Valid outcome is required (agree, disagree, or inconclusive)'
        });
      }

      const resolutionData = {
        outcome,
        resolutionNote,
        finalPrice: finalPrice ? parseFloat(finalPrice) : null,
      };

      const prediction = await predictionService.resolvePrediction(predictionId, moderatorId, resolutionData);

      return ResponseHandler.success(res, {
        prediction,
        message: 'Prediction resolved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to resolve prediction:`, error);
      next(error);
    }
  }

  // Get active predictions
  async getActivePredictions(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        predictionType = null,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await predictionService.getActivePredictions({
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        predictionType,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        predictions: result.predictions,
        pagination: result.pagination,
        message: 'Active predictions retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get active predictions:`, error);
      next(error);
    }
  }

  // Get trending predictions
  async getTrendingPredictions(req, res, next) {
    try {
      const { limit = 20 } = req.query;
      const predictions = await predictionService.getTrendingPredictions(parseInt(limit));

      return ResponseHandler.success(res, {
        predictions,
        message: 'Trending predictions retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending predictions:`, error);
      next(error);
    }
  }

  // Get predictions by asset
  async getPredictionsByAsset(req, res, next) {
    try {
      const { symbol } = req.params;
      const {
        page = 1,
        limit = 20,
        status = 'active',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const predictions = await predictionService.getPredictionsByAsset(symbol, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        predictions,
        symbol: symbol.toUpperCase(),
        message: `${symbol.toUpperCase()} predictions retrieved successfully`
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get predictions by asset:`, error);
      next(error);
    }
  }

  // Get user's predictions
  async getUserPredictions(req, res, next) {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        limit = 20,
        status = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await predictionService.getUserPredictions(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        predictions: result.predictions,
        pagination: result.pagination,
        message: 'User predictions retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get user predictions:`, error);
      next(error);
    }
  }

  // Get current user's predictions
  async getMyPredictions(req, res, next) {
    try {
      const userId = req.user._id;
      const {
        page = 1,
        limit = 20,
        status = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await predictionService.getUserPredictions(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        predictions: result.predictions,
        pagination: result.pagination,
        message: 'Your predictions retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get current user predictions:`, error);
      next(error);
    }
  }

  // Get user's stakes
  async getUserStakes(req, res, next) {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        limit = 20,
        status = 'all',
        sortBy = 'stakedAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await predictionService.getUserStakes(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        stakes: result.stakes,
        pagination: result.pagination,
        message: 'User stakes retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get user stakes:`, error);
      next(error);
    }
  }

  // Get current user's stakes
  async getMyStakes(req, res, next) {
    try {
      const userId = req.user._id;
      const {
        page = 1,
        limit = 20,
        status = 'all',
        sortBy = 'stakedAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await predictionService.getUserStakes(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        stakes: result.stakes,
        pagination: result.pagination,
        message: 'Your stakes retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get current user stakes:`, error);
      next(error);
    }
  }

  // Update prediction
  async updatePrediction(req, res, next) {
    try {
      const { predictionId } = req.params;
      const userId = req.user._id;
      const updateData = req.body;

      const prediction = await predictionService.updatePrediction(predictionId, userId, updateData);

      return ResponseHandler.success(res, {
        prediction,
        message: 'Prediction updated successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to update prediction:`, error);
      next(error);
    }
  }

  // Cancel prediction
  async cancelPrediction(req, res, next) {
    try {
      const { predictionId } = req.params;
      const userId = req.user._id;

      const prediction = await predictionService.cancelPrediction(predictionId, userId);

      return ResponseHandler.success(res, {
        prediction,
        message: 'Prediction cancelled successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to cancel prediction:`, error);
      next(error);
    }
  }

  // Search predictions
  async searchPredictions(req, res, next) {
    try {
      const { q, page = 1, limit = 20, category = null, predictionType = null, status = 'active', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const result = await predictionService.searchPredictions(q.trim(), {
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        predictionType,
        status,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        predictions: result.predictions,
        query: result.query,
        pagination: result.pagination,
        message: 'Prediction search completed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to search predictions:`, error);
      next(error);
    }
  }

  // Get prediction statistics
  async getPredictionStats(req, res, next) {
    try {
      const stats = await predictionService.getPredictionStats();

      return ResponseHandler.success(res, {
        stats,
        message: 'Prediction statistics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get prediction stats:`, error);
      next(error);
    }
  }

  // Process expired predictions (admin only)
  async processExpiredPredictions(req, res, next) {
    try {
      const result = await predictionService.processExpiredPredictions();

      return ResponseHandler.success(res, {
        result,
        message: 'Expired predictions processed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to process expired predictions:`, error);
      next(error);
    }
  }
}

module.exports = new PredictionController();
