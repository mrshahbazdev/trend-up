const { Prediction, Post, User, Karma } = require('../models');
const { logger } = require('../../../core/utils/logger');
const mongoose = require('mongoose');

class PredictionService {
  constructor() {
    // Prediction configuration
    this.predictionConfig = {
      maxTitleLength: 200,
      maxDescriptionLength: 2000,
      minStake: 10,
      maxStake: 1000,
      defaultStake: 50,
      minTargetDays: 1,
      maxTargetDays: 365,
      defaultTargetDays: 7,
    };
  }

  // Create a new prediction
  async createPrediction(userId, predictionData) {
    try {
      const {
        title,
        description,
        predictionType = 'price',
        asset,
        targetPrice,
        targetDate,
        minStake = this.predictionConfig.minStake,
        maxStake = this.predictionConfig.maxStake,
        category = 'market_analysis',
        tags = [],
      } = predictionData;

      // Validate prediction data
      this.validatePredictionData(predictionData);

      // Check user's karma balance
      const userKarma = await Karma.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (!userKarma || userKarma.totalKarma < minStake) {
        throw new Error('Insufficient karma to create prediction');
      }

      // Create the post first
      const post = new Post({
        userId: new mongoose.Types.ObjectId(userId),
        content: title,
        postType: 'prediction',
        category,
        hashtags: tags,
        isPublic: true,
      });

      await post.save();

      // Create the prediction
      const prediction = new Prediction({
        postId: post._id,
        title,
        description,
        predictionType,
        asset,
        targetPrice,
        targetDate: new Date(targetDate),
        minStake,
        maxStake,
        category,
        tags,
      });

      await prediction.save();

      // Populate the prediction with post data
      await prediction.populate('postId', 'userId content createdAt');
      await prediction.populate('postId.userId', 'name username avatar karma');

      logger.info(`[INFO] Prediction created successfully: ${prediction._id} by user ${userId}`);
      return prediction;
    } catch (error) {
      logger.error(`[ERROR] Failed to create prediction:`, error);
      throw error;
    }
  }

  // Validate prediction data
  validatePredictionData(predictionData) {
    const { title, description, predictionType, asset, targetPrice, targetDate } = predictionData;

    if (!title || title.trim().length === 0) {
      throw new Error('Prediction title is required');
    }

    if (title.length > this.predictionConfig.maxTitleLength) {
      throw new Error(`Prediction title cannot exceed ${this.predictionConfig.maxTitleLength} characters`);
    }

    if (!description || description.trim().length === 0) {
      throw new Error('Prediction description is required');
    }

    if (description.length > this.predictionConfig.maxDescriptionLength) {
      throw new Error(`Prediction description cannot exceed ${this.predictionConfig.maxDescriptionLength} characters`);
    }

    // Validate price prediction
    if (predictionType === 'price') {
      if (!asset || !asset.symbol) {
        throw new Error('Asset symbol is required for price predictions');
      }

      if (!targetPrice || targetPrice <= 0) {
        throw new Error('Target price must be positive for price predictions');
      }
    }

    // Validate target date
    if (!targetDate) {
      throw new Error('Target date is required');
    }

    const targetDateObj = new Date(targetDate);
    const now = new Date();
    const minTarget = new Date(now.getTime() + this.predictionConfig.minTargetDays * 24 * 60 * 60 * 1000);
    const maxTarget = new Date(now.getTime() + this.predictionConfig.maxTargetDays * 24 * 60 * 60 * 1000);

    if (targetDateObj <= minTarget) {
      throw new Error(`Target date must be at least ${this.predictionConfig.minTargetDays} days from now`);
    }

    if (targetDateObj > maxTarget) {
      throw new Error(`Target date cannot be more than ${this.predictionConfig.maxTargetDays} days from now`);
    }
  }

  // Get prediction by ID
  async getPredictionById(predictionId) {
    try {
      const prediction = await Prediction.findById(predictionId)
        .populate('postId', 'userId content createdAt reactionsCount commentCount')
        .populate('postId.userId', 'name username avatar karma')
        .populate('participants.userId', 'name username avatar karma');

      if (!prediction) {
        throw new Error('Prediction not found');
      }

      if (prediction.isExpired && prediction.status === 'active') {
        prediction.status = 'expired';
        await prediction.save();
      }

      return prediction;
    } catch (error) {
      logger.error(`[ERROR] Failed to get prediction by ID:`, error);
      throw error;
    }
  }

  // Stake on prediction
  async stakeOnPrediction(predictionId, userId, stake, position) {
    try {
      const prediction = await Prediction.findById(predictionId);
      if (!prediction) {
        throw new Error('Prediction not found');
      }

      if (prediction.status !== 'active') {
        throw new Error('Prediction is not active');
      }

      if (prediction.isExpired) {
        throw new Error('Prediction has expired');
      }

      // Check user's karma balance
      const userKarma = await Karma.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (!userKarma || userKarma.totalKarma < stake) {
        throw new Error('Insufficient karma to stake');
      }

      // Add stake to prediction
      await prediction.addStake(userId, stake, position);

      // Deduct karma from user
      await userKarma.updateKarma(-stake, `Staked on prediction: ${prediction.title}`, predictionId, 'Prediction');

      // Update prediction engagement score
      await this.updatePredictionEngagementScore(predictionId);

      logger.info(`[INFO] User ${userId} staked ${stake} karma on prediction ${predictionId} (${position})`);
      return prediction;
    } catch (error) {
      logger.error(`[ERROR] Failed to stake on prediction:`, error);
      throw error;
    }
  }

  // Remove stake from prediction
  async removeStake(predictionId, userId) {
    try {
      const prediction = await Prediction.findById(predictionId);
      if (!prediction) {
        throw new Error('Prediction not found');
      }

      if (prediction.status !== 'active') {
        throw new Error('Prediction is not active');
      }

      if (prediction.isExpired) {
        throw new Error('Prediction has expired');
      }

      // Get user's stake
      const userStake = prediction.getUserStake(userId);
      if (!userStake) {
        throw new Error('User has not staked on this prediction');
      }

      // Remove stake from prediction
      await prediction.removeStake(userId);

      // Return karma to user
      const userKarma = await Karma.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (userKarma) {
        await userKarma.updateKarma(userStake.stake, `Removed stake from prediction: ${prediction.title}`, predictionId, 'Prediction');
      }

      // Update prediction engagement score
      await this.updatePredictionEngagementScore(predictionId);

      logger.info(`[INFO] User ${userId} removed stake from prediction ${predictionId}`);
      return prediction;
    } catch (error) {
      logger.error(`[ERROR] Failed to remove stake from prediction:`, error);
      throw error;
    }
  }

  // Resolve prediction
  async resolvePrediction(predictionId, moderatorId, resolutionData) {
    try {
      const { outcome, resolutionNote, finalPrice } = resolutionData;

      const prediction = await Prediction.findById(predictionId);
      if (!prediction) {
        throw new Error('Prediction not found');
      }

      if (prediction.status !== 'active') {
        throw new Error('Prediction is not active');
      }

      // Resolve prediction
      await prediction.resolve(outcome, moderatorId, resolutionNote, finalPrice);

      // Distribute karma rewards
      await this.distributePredictionRewards(prediction);

      logger.info(`[INFO] Prediction ${predictionId} resolved by moderator ${moderatorId} with outcome: ${outcome}`);
      return prediction;
    } catch (error) {
      logger.error(`[ERROR] Failed to resolve prediction:`, error);
      throw error;
    }
  }

  // Distribute prediction rewards
  async distributePredictionRewards(prediction) {
    try {
      for (const participant of prediction.participants) {
        const userKarma = await Karma.findOne({ userId: participant.userId });
        if (userKarma && participant.karmaReward > 0) {
          await userKarma.updateKarma(
            participant.karmaReward,
            `Prediction reward: ${prediction.title} (${prediction.resolution.outcome})`,
            prediction._id,
            'Prediction'
          );
        }
      }

      logger.info(`[INFO] Distributed rewards for prediction ${prediction._id}`);
    } catch (error) {
      logger.error(`[ERROR] Failed to distribute prediction rewards:`, error);
    }
  }

  // Get active predictions
  async getActivePredictions(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        predictionType = null,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const filter = { status: 'active' };
      if (category) filter.category = category;
      if (predictionType) filter.predictionType = predictionType;

      const predictions = await Prediction.find(filter)
        .populate('postId', 'userId content createdAt reactionsCount commentCount')
        .populate('postId.userId', 'name username avatar karma')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalCount = await Prediction.countDocuments(filter);

      return {
        predictions,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount,
        },
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get active predictions:`, error);
      throw error;
    }
  }

  // Get trending predictions
  async getTrendingPredictions(limit = 20) {
    try {
      const predictions = await Prediction.getTrendingPredictions(limit);
      return predictions;
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending predictions:`, error);
      throw error;
    }
  }

  // Get predictions by asset
  async getPredictionsByAsset(symbol, options = {}) {
    try {
      const predictions = await Prediction.getPredictionsByAsset(symbol, options);
      return predictions;
    } catch (error) {
      logger.error(`[ERROR] Failed to get predictions by asset:`, error);
      throw error;
    }
  }

  // Get user's predictions
  async getUserPredictions(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Get user's posts of type 'prediction'
      const userPosts = await Post.find({
        userId: new mongoose.Types.ObjectId(userId),
        postType: 'prediction',
      }).select('_id');

      const postIds = userPosts.map(post => post._id);

      const filter = { postId: { $in: postIds } };
      if (status !== 'all') {
        filter.status = status;
      }

      const predictions = await Prediction.find(filter)
        .populate('postId', 'userId content createdAt reactionsCount commentCount')
        .populate('postId.userId', 'name username avatar karma')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalCount = await Prediction.countDocuments(filter);

      return {
        predictions,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount,
        },
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get user predictions:`, error);
      throw error;
    }
  }

  // Get user's stakes
  async getUserStakes(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status = 'all',
        sortBy = 'stakedAt',
        sortOrder = 'desc',
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const filter = { 'participants.userId': new mongoose.Types.ObjectId(userId) };
      if (status !== 'all') {
        filter.status = status;
      }

      const predictions = await Prediction.find(filter)
        .populate('postId', 'userId content createdAt')
        .populate('postId.userId', 'name username avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Filter to only include user's stakes
      const userStakes = predictions.map(prediction => {
        const userStake = prediction.participants.find(p => 
          p.userId.toString() === userId.toString()
        );
        return {
          prediction,
          stake: userStake,
        };
      }).filter(item => item.stake);

      const totalCount = await Prediction.countDocuments(filter);

      return {
        stakes: userStakes,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount,
        },
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get user stakes:`, error);
      throw error;
    }
  }

  // Update prediction
  async updatePrediction(predictionId, userId, updateData) {
    try {
      const prediction = await Prediction.findById(predictionId);
      if (!prediction) {
        throw new Error('Prediction not found');
      }

      // Check if user owns the prediction
      const post = await Post.findById(prediction.postId);
      if (post.userId.toString() !== userId.toString()) {
        throw new Error('Not authorized to update this prediction');
      }

      if (prediction.status !== 'active') {
        throw new Error('Cannot update inactive prediction');
      }

      // Update allowed fields
      const allowedFields = ['title', 'description'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          prediction[field] = updateData[field];
        }
      });

      await prediction.save();
      await prediction.populate('postId', 'userId content createdAt');
      await prediction.populate('postId.userId', 'name username avatar');

      logger.info(`[INFO] Prediction ${predictionId} updated by user ${userId}`);
      return prediction;
    } catch (error) {
      logger.error(`[ERROR] Failed to update prediction:`, error);
      throw error;
    }
  }

  // Cancel prediction
  async cancelPrediction(predictionId, userId) {
    try {
      const prediction = await Prediction.findById(predictionId);
      if (!prediction) {
        throw new Error('Prediction not found');
      }

      // Check if user owns the prediction
      const post = await Post.findById(prediction.postId);
      if (post.userId.toString() !== userId.toString()) {
        throw new Error('Not authorized to cancel this prediction');
      }

      await prediction.cancelPrediction();

      // Return stakes to all participants
      await this.distributePredictionRewards(prediction);

      logger.info(`[INFO] Prediction ${predictionId} cancelled by user ${userId}`);
      return prediction;
    } catch (error) {
      logger.error(`[ERROR] Failed to cancel prediction:`, error);
      throw error;
    }
  }

  // Update prediction engagement score
  async updatePredictionEngagementScore(predictionId) {
    try {
      const prediction = await Prediction.findById(predictionId);
      if (!prediction) return;

      // Calculate engagement score based on stakes, views, and comments
      const engagementScore = 
        (prediction.totalStake * 0.1) + 
        (prediction.viewCount * 0.1) + 
        (prediction.commentCount * 1.5) + 
        (prediction.shareCount * 1) +
        (prediction.participantCount * 2);

      prediction.engagementScore = engagementScore;

      // Calculate trending score (recent activity weighted)
      const hoursSinceCreation = (Date.now() - prediction.createdAt.getTime()) / (1000 * 60 * 60);
      const trendingScore = engagementScore / Math.max(1, hoursSinceCreation);
      prediction.trendingScore = trendingScore;

      await prediction.save();
    } catch (error) {
      logger.error(`[ERROR] Failed to update prediction engagement score:`, error);
    }
  }

  // Get prediction statistics
  async getPredictionStats() {
    try {
      const stats = await Prediction.getPredictionStats();
      return stats[0] || {
        totalPredictions: 0,
        activePredictions: 0,
        resolvedPredictions: 0,
        totalStake: 0,
        totalParticipants: 0,
        avgStakePerPrediction: 0,
        avgParticipantsPerPrediction: 0,
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get prediction stats:`, error);
      throw error;
    }
  }

  // Search predictions
  async searchPredictions(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        predictionType = null,
        status = 'active',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const searchFilter = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { 'asset.symbol': { $regex: query, $options: 'i' } },
          { 'asset.name': { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
        ],
        status,
      };

      if (category) searchFilter.category = category;
      if (predictionType) searchFilter.predictionType = predictionType;
      if (status === 'active') {
        searchFilter.targetDate = { $gt: new Date() };
      }

      const predictions = await Prediction.find(searchFilter)
        .populate('postId', 'userId content createdAt reactionsCount commentCount')
        .populate('postId.userId', 'name username avatar karma')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalCount = await Prediction.countDocuments(searchFilter);

      return {
        predictions,
        query,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount,
        },
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to search predictions:`, error);
      throw error;
    }
  }

  // Process expired predictions
  async processExpiredPredictions() {
    try {
      const expiredPredictions = await Prediction.find({
        status: 'active',
        targetDate: { $lte: new Date() },
      });

      for (const prediction of expiredPredictions) {
        prediction.status = 'expired';
        await prediction.save();
      }

      logger.info(`[INFO] Processed ${expiredPredictions.length} expired predictions`);
      return { processed: expiredPredictions.length };
    } catch (error) {
      logger.error(`[ERROR] Failed to process expired predictions:`, error);
      throw error;
    }
  }
}

module.exports = new PredictionService();
