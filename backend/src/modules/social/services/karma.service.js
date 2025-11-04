const { Karma, Badge, Post, Reaction, Comment } = require('../models');
const { logger } = require('../../../core/utils/logger');
const mongoose = require('mongoose');

class KarmaService {
  constructor() {
    // Karma earning rates
    this.karmaRates = {
      // Post-related karma
      POST_CREATED: 10,
      POST_TRENDING: 50,
      POST_VIRAL: 100,
      
      // Comment-related karma
      COMMENT_CREATED: 5,
      COMMENT_UPVOTED: 1,
      
      // Reaction-related karma
      REACTION_RECEIVED: 2,
      REACTION_GIVEN: 1,
      
      // Prediction-related karma
      PREDICTION_CREATED: 10,
      PREDICTION_PARTICIPATED: 2,
      PREDICTION_CORRECT: 25,
      PREDICTION_INCORRECT: -5,
      
      // Poll-related karma
      POLL_CREATED: 10,
      POLL_PARTICIPATED: 1,
      
      // Moderation-related karma
      MODERATION_ACTION: 10,
      CONTENT_FLAGGED: -2,
      
      // Special karma
      BADGE_EARNED: 0, // Handled by badge itself
      STREAK_BONUS: 5,
      DAILY_ACTIVE: 1
    };
    
    // Reaction weights based on karma level
    this.reactionWeights = {
      'NEWBIE': 1,
      'EXPLORER': 1.2,
      'CONTRIBUTOR': 1.5,
      'INFLUENCER': 2,
      'EXPERT': 2.5,
      'LEGEND': 3,
      'TITAN': 4
    };
  }

  // Initialize karma for a new user
  async initializeKarma(userId) {
    try {
      logger.info(`[DEBUG] Initializing karma for user: ${userId}`);
      
      const existingKarma = await Karma.findOne({ userId });
      if (existingKarma) {
        logger.info(`[INFO] Karma already exists for user ${userId} with totalKarma: ${existingKarma.totalKarma}`);
        return existingKarma;
      }

      const karma = new Karma({
        userId: new mongoose.Types.ObjectId(userId),
        totalKarma: 0,
        currentLevel: 'NEWBIE',
        unlockedReactions: [
          {
            reactionType: 'LIKE',
            requiredLevel: 'NEWBIE'
          },
          {
            reactionType: 'DISLIKE',
            requiredLevel: 'NEWBIE'
          }
        ]
      });

      await karma.save();
      logger.info(`[INFO] Successfully initialized karma for user ${userId} with totalKarma: ${karma.totalKarma}, level: ${karma.currentLevel}`);
      return karma;
    } catch (error) {
      logger.error(`[ERROR] Failed to initialize karma for user ${userId}:`, error);
      throw error;
    }
  }

  // Get user karma
  async getUserKarma(userId) {
    try {
      logger.info(`[DEBUG] Getting karma for user: ${userId}`);
      
      let karma = await Karma.findOne({ userId }).populate('userId', 'name username email avatar');
      if (!karma) {
        logger.info(`[DEBUG] No karma found for user ${userId}, initializing...`);
        karma = await this.initializeKarma(userId);
      } else {
        logger.info(`[DEBUG] Found existing karma for user ${userId}: totalKarma=${karma.totalKarma}, level=${karma.currentLevel}`);
      }
      return karma;
    } catch (error) {
      logger.error(`[ERROR] Failed to get karma for user ${userId}:`, error);
      throw error;
    }
  }

  // Add karma to user
  async addKarma(userId, amount, source, sourceId, description) {
    try {
      logger.info(`[DEBUG] Starting karma addition: userId=${userId}, amount=${amount}, source=${source}, sourceId=${sourceId}, description=${description}`);
      
      const karma = await this.getUserKarma(userId);
      const oldLevel = karma.currentLevel;
      const oldTotal = karma.totalKarma;
      
      logger.info(`[DEBUG] Before karma addition: totalKarma=${oldTotal}, level=${oldLevel}`);
      
      await karma.addKarma(amount, source, sourceId, description);
      
      // Refresh karma object to get updated values
      const updatedKarma = await this.getUserKarma(userId);
      const newTotal = updatedKarma.totalKarma;
      const newLevel = updatedKarma.currentLevel;
      
      logger.info(`[DEBUG] After karma addition: totalKarma=${newTotal} (${oldTotal} + ${amount}), level=${newLevel}`);
      
      // Check for level up
      if (newLevel !== oldLevel) {
        logger.info(`[DEBUG] Level up detected: ${oldLevel} -> ${newLevel}`);
        await this.handleLevelUp(updatedKarma, oldLevel);
      }
      
      // Check for badge eligibility
      await this.checkBadgeEligibility(updatedKarma);
      
      logger.info(`[INFO] Successfully added ${amount} karma to user ${userId} for ${source}: ${description}. New total: ${newTotal}`);
      return updatedKarma;
    } catch (error) {
      logger.error(`[ERROR] Failed to add karma to user ${userId}:`, error);
      throw error;
    }
  }

  // Deduct karma from user
  async deductKarma(userId, amount, source, sourceId, description) {
    try {
      const karma = await this.getUserKarma(userId);
      const oldLevel = karma.currentLevel;
      
      await karma.deductKarma(amount, source, sourceId, description);
      
      // Check for level down
      if (karma.currentLevel !== oldLevel) {
        await this.handleLevelDown(karma, oldLevel);
      }
      
      logger.info(`[INFO] Deducted ${amount} karma from user ${userId} for ${source}: ${description}`);
      return karma;
    } catch (error) {
      logger.error(`[ERROR] Failed to deduct karma from user ${userId}:`, error);
      throw error;
    }
  }

  // Handle post creation karma
  async handlePostCreated(userId, postId) {
    try {
      const karma = await this.addKarma(
        userId,
        this.karmaRates.POST_CREATED,
        'POST',
        postId,
        'Created a new post'
      );
      
      // Update stats
      karma.stats.postsCreated += 1;
      await karma.save();
      
      return karma;
    } catch (error) {
      logger.error(`[ERROR] Failed to handle post creation karma for user ${userId}:`, error);
      throw error;
    }
  }

  // Handle post trending karma
  async handlePostTrending(userId, postId) {
    try {
      const karma = await this.addKarma(
        userId,
        this.karmaRates.POST_TRENDING,
        'POST',
        postId,
        'Post became trending'
      );
      
      // Update stats
      karma.stats.trendingPosts += 1;
      await karma.save();
      
      return karma;
    } catch (error) {
      logger.error(`[ERROR] Failed to handle post trending karma for user ${userId}:`, error);
      throw error;
    }
  }

  // Handle comment creation karma
  async handleCommentCreated(userId, commentId) {
    try {
      const karma = await this.addKarma(
        userId,
        this.karmaRates.COMMENT_CREATED,
        'COMMENT',
        commentId,
        'Created a new comment'
      );
      
      // Update stats
      karma.stats.commentsCreated += 1;
      await karma.save();
      
      return karma;
    } catch (error) {
      logger.error(`[ERROR] Failed to handle comment creation karma for user ${userId}:`, error);
      throw error;
    }
  }

  // Handle reaction given karma
  async handleReactionGiven(userId, reactionId) {
    try {
      const karma = await this.addKarma(
        userId,
        this.karmaRates.REACTION_GIVEN,
        'REACTION',
        reactionId,
        'Gave a reaction'
      );
      
      // Update stats
      karma.stats.reactionsGiven += 1;
      await karma.save();
      
      return karma;
    } catch (error) {
      logger.error(`[ERROR] Failed to handle reaction given karma for user ${userId}:`, error);
      throw error;
    }
  }

  // Handle reaction received karma
  async handleReactionReceived(userId, reactionId, reactorKarmaLevel) {
    try {
      const baseKarma = this.karmaRates.REACTION_RECEIVED;
      const weight = this.reactionWeights[reactorKarmaLevel] || 1;
      const weightedKarma = Math.round(baseKarma * weight);
      
      const karma = await this.addKarma(
        userId,
        weightedKarma,
        'REACTION',
        reactionId,
        `Received reaction (weighted by ${reactorKarmaLevel} level)`
      );
      
      // Update stats
      karma.stats.reactionsReceived += 1;
      await karma.save();
      
      return karma;
    } catch (error) {
      logger.error(`[ERROR] Failed to handle reaction received karma for user ${userId}:`, error);
      throw error;
    }
  }

  // Handle prediction karma (standalone predictions)
  async handlePredictionResult(userId, predictionId, wasCorrect) {
    try {
      const amount = wasCorrect ? this.karmaRates.PREDICTION_CORRECT : this.karmaRates.PREDICTION_INCORRECT;
      const description = wasCorrect ? 'Prediction was correct' : 'Prediction was incorrect';
      
      const karma = await this.addKarma(
        userId,
        amount,
        'PREDICTION',
        predictionId,
        description
      );
      
      // Update stats
      karma.stats.predictionsMade += 1;
      if (wasCorrect) {
        karma.stats.predictionsCorrect += 1;
      }
      await karma.save();
      
      return karma;
    } catch (error) {
      logger.error(`[ERROR] Failed to handle prediction karma for user ${userId}:`, error);
      throw error;
    }
  }

  // Handle post-based prediction result karma
  async handlePostPredictionResult(userId, postId, wasCorrect) {
    try {
      const amount = wasCorrect ? this.karmaRates.PREDICTION_CORRECT : this.karmaRates.PREDICTION_INCORRECT;
      const description = wasCorrect ? 'Post prediction was correct' : 'Post prediction was incorrect';
      
      const karma = await this.addKarma(
        userId,
        amount,
        'POST_PREDICTION',
        postId,
        description
      );
      
      // Update stats
      karma.stats.predictionsMade += 1;
      if (wasCorrect) {
        karma.stats.predictionsCorrect += 1;
      }
      await karma.save();
      
      return karma;
    } catch (error) {
      logger.error(`[ERROR] Failed to handle post prediction karma for user ${userId}:`, error);
      throw error;
    }
  }

  // Handle level up
  async handleLevelUp(karma, oldLevel) {
    try {
      logger.info(`[INFO] User ${karma.userId} leveled up from ${oldLevel} to ${karma.currentLevel}`);
      
      // Unlock new reactions based on level
      await this.unlockReactionsForLevel(karma, karma.currentLevel);
      
      // Check for level-specific badges
      await this.checkLevelBadges(karma);
      
      // Update privileges
      karma.updatePrivileges();
      await karma.save();
      
      return karma;
    } catch (error) {
      logger.error(`[ERROR] Failed to handle level up for user ${karma.userId}:`, error);
      throw error;
    }
  }

  // Handle level down
  async handleLevelDown(karma, oldLevel) {
    try {
      logger.info(`[INFO] User ${karma.userId} leveled down from ${oldLevel} to ${karma.currentLevel}`);
      
      // Update privileges
      karma.updatePrivileges();
      await karma.save();
      
      return karma;
    } catch (error) {
      logger.error(`[ERROR] Failed to handle level down for user ${karma.userId}:`, error);
      throw error;
    }
  }

  // Unlock reactions for level
  async unlockReactionsForLevel(karma, level) {
    try {
      const levelReactions = {
        'EXPLORER': ['BULLISH', 'BEARISH', 'FIRE', 'ROCKET'],
        'CONTRIBUTOR': ['DIAMOND', 'CROWN', 'STAR'],
        'INFLUENCER': ['GEM', 'TROPHY', 'MEDAL'],
        'EXPERT': ['CROWN_GOLD', 'DIAMOND_BLUE'],
        'LEGEND': ['LEGENDARY', 'MYTHIC'],
        'TITAN': ['TITAN', 'ULTIMATE']
      };
      
      const reactionsToUnlock = levelReactions[level] || [];
      
      for (const reactionType of reactionsToUnlock) {
        await karma.unlockReaction(reactionType, level);
      }
      
      logger.info(`[INFO] Unlocked ${reactionsToUnlock.length} reactions for user ${karma.userId} at level ${level}`);
    } catch (error) {
      logger.error(`[ERROR] Failed to unlock reactions for user ${karma.userId}:`, error);
      throw error;
    }
  }

  // Check badge eligibility
  async checkBadgeEligibility(karma) {
    try {
      const availableBadges = await Badge.getAvailableBadges(karma.currentLevel, true);
      
      for (const badge of availableBadges) {
        if (!karma.hasBadge(badge.badgeId) || badge.repeatable) {
          const meetsRequirements = await badge.checkRequirements(karma, karma.stats);
          if (meetsRequirements) {
            await badge.awardToUser(karma);
            logger.info(`[INFO] Awarded badge ${badge.name} to user ${karma.userId}`);
          }
        }
      }
    } catch (error) {
      logger.error(`[ERROR] Failed to check badge eligibility for user ${karma.userId}:`, error);
      throw error;
    }
  }

  // Check level-specific badges
  async checkLevelBadges(karma) {
    try {
      const levelBadges = {
        'EXPLORER': 'EXPLORER_BADGE',
        'CONTRIBUTOR': 'CONTRIBUTOR_BADGE',
        'INFLUENCER': 'INFLUENCER_BADGE',
        'EXPERT': 'EXPERT_BADGE',
        'LEGEND': 'LEGEND_BADGE',
        'TITAN': 'TITAN_BADGE'
      };
      
      const badgeId = levelBadges[karma.currentLevel];
      if (badgeId) {
        const badge = await Badge.findOne({ badgeId });
        if (badge && !karma.hasBadge(badgeId)) {
          await badge.awardToUser(karma);
          logger.info(`[INFO] Awarded level badge ${badge.name} to user ${karma.userId}`);
        }
      }
    } catch (error) {
      logger.error(`[ERROR] Failed to check level badges for user ${karma.userId}:`, error);
      throw error;
    }
  }

  // Get karma leaderboard
  async getLeaderboard(limit = 50, offset = 0) {
    try {
      return await Karma.getLeaderboard(limit, offset);
    } catch (error) {
      logger.error(`[ERROR] Failed to get karma leaderboard:`, error);
      throw error;
    }
  }

  // Get users by level
  async getUsersByLevel(level, limit = 50, offset = 0) {
    try {
      return await Karma.getUsersByLevel(level, limit, offset);
    } catch (error) {
      logger.error(`[ERROR] Failed to get users by level ${level}:`, error);
      throw error;
    }
  }

  // Get karma statistics
  async getKarmaStats() {
    try {
      return await Karma.getKarmaStats();
    } catch (error) {
      logger.error(`[ERROR] Failed to get karma statistics:`, error);
      throw error;
    }
  }

  // Get user karma history
  async getUserKarmaHistory(userId, limit = 50, offset = 0) {
    try {
      logger.info(`[DEBUG] Getting karma history for user: ${userId}, limit: ${limit}, offset: ${offset}`);
      
      const karma = await this.getUserKarma(userId);
      const totalHistoryItems = karma.karmaHistory.length;
      
      logger.info(`[DEBUG] Found ${totalHistoryItems} total karma history items for user ${userId}`);
      
      const history = karma.karmaHistory
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(offset, offset + limit);
      
      logger.info(`[DEBUG] Returning ${history.length} karma history items (offset: ${offset}, limit: ${limit})`);
      
      return {
        history,
        total: totalHistoryItems,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < totalHistoryItems
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get karma history for user ${userId}:`, error);
      throw error;
    }
  }

  // Get user badges
  async getUserBadges(userId) {
    try {
      const karma = await this.getUserKarma(userId);
      return karma.badges.sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));
    } catch (error) {
      logger.error(`[ERROR] Failed to get badges for user ${userId}:`, error);
      throw error;
    }
  }

  // Get user unlocked reactions
  async getUserUnlockedReactions(userId) {
    try {
      const karma = await this.getUserKarma(userId);
      return karma.unlockedReactions;
    } catch (error) {
      logger.error(`[ERROR] Failed to get unlocked reactions for user ${userId}:`, error);
      throw error;
    }
  }

  // Check if user can use reaction
  async canUseReaction(userId, reactionType) {
    try {
      const karma = await this.getUserKarma(userId);
      return karma.hasUnlockedReaction(reactionType);
    } catch (error) {
      logger.error(`[ERROR] Failed to check reaction permission for user ${userId}:`, error);
      throw error;
    }
  }

  // Get reaction weight for user
  async getReactionWeight(userId) {
    try {
      const karma = await this.getUserKarma(userId);
      return this.reactionWeights[karma.currentLevel] || 1;
    } catch (error) {
      logger.error(`[ERROR] Failed to get reaction weight for user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = new KarmaService();
