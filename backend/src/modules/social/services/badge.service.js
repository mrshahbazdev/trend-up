const { Badge, Karma } = require('../models');
const { logger } = require('../../../core/utils/logger');

class BadgeService {
  constructor() {
    // Predefined badges
    this.predefinedBadges = [
      // Level badges
      {
        badgeId: 'EXPLORER_BADGE',
        name: 'Explorer',
        description: 'Reached Explorer level (100+ karma)',
        icon: '🚀',
        color: '#10B981',
        category: 'SPECIAL',
        requirements: { type: 'KARMA', value: 100 },
        rarity: 'COMMON',
        karmaReward: 10,
        requiredLevel: 'EXPLORER'
      },
      {
        badgeId: 'CONTRIBUTOR_BADGE',
        name: 'Contributor',
        description: 'Reached Contributor level (300+ karma)',
        icon: '⭐',
        color: '#3B82F6',
        category: 'SPECIAL',
        requirements: { type: 'KARMA', value: 300 },
        rarity: 'UNCOMMON',
        karmaReward: 25,
        requiredLevel: 'CONTRIBUTOR'
      },
      {
        badgeId: 'INFLUENCER_BADGE',
        name: 'Influencer',
        description: 'Reached Influencer level (700+ karma)',
        icon: '👑',
        color: '#8B5CF6',
        category: 'SPECIAL',
        requirements: { type: 'KARMA', value: 700 },
        rarity: 'RARE',
        karmaReward: 50,
        requiredLevel: 'INFLUENCER'
      },
      {
        badgeId: 'EXPERT_BADGE',
        name: 'Expert',
        description: 'Reached Expert level (1500+ karma)',
        icon: '🧠',
        color: '#F59E0B',
        category: 'SPECIAL',
        requirements: { type: 'KARMA', value: 1500 },
        rarity: 'EPIC',
        karmaReward: 100,
        requiredLevel: 'EXPERT'
      },
      {
        badgeId: 'LEGEND_BADGE',
        name: 'Legend',
        description: 'Reached Legend level (3000+ karma)',
        icon: '🏆',
        color: '#EF4444',
        category: 'SPECIAL',
        requirements: { type: 'KARMA', value: 3000 },
        rarity: 'LEGENDARY',
        karmaReward: 200,
        requiredLevel: 'LEGEND'
      },
      {
        badgeId: 'TITAN_BADGE',
        name: 'Titan',
        description: 'Reached Titan level (6000+ karma)',
        icon: '⚡',
        color: '#7C3AED',
        category: 'SPECIAL',
        requirements: { type: 'KARMA', value: 6000 },
        rarity: 'LEGENDARY',
        karmaReward: 500,
        requiredLevel: 'TITAN'
      },
      
      // Posting badges
      {
        badgeId: 'FIRST_POST',
        name: 'First Steps',
        description: 'Created your first post',
        icon: '📝',
        color: '#6B7280',
        category: 'POSTING',
        requirements: { type: 'POSTS', value: 1 },
        rarity: 'COMMON',
        karmaReward: 5,
        requiredLevel: 'NEWBIE'
      },
      {
        badgeId: 'POSTER',
        name: 'Poster',
        description: 'Created 10 posts',
        icon: '📰',
        color: '#10B981',
        category: 'POSTING',
        requirements: { type: 'POSTS', value: 10 },
        rarity: 'COMMON',
        karmaReward: 15,
        requiredLevel: 'NEWBIE'
      },
      {
        badgeId: 'CONTENT_CREATOR',
        name: 'Content Creator',
        description: 'Created 50 posts',
        icon: '✍️',
        color: '#3B82F6',
        category: 'POSTING',
        requirements: { type: 'POSTS', value: 50 },
        rarity: 'UNCOMMON',
        karmaReward: 50,
        requiredLevel: 'EXPLORER'
      },
      {
        badgeId: 'TRENDING_MAKER',
        name: 'Trending Maker',
        description: 'Created 5 trending posts',
        icon: '🔥',
        color: '#F59E0B',
        category: 'POSTING',
        requirements: { type: 'CUSTOM', value: 5, additionalConditions: { type: 'trending_posts' } },
        rarity: 'RARE',
        karmaReward: 100,
        requiredLevel: 'CONTRIBUTOR'
      },
      
      // Engagement badges
      {
        badgeId: 'COMMENTATOR',
        name: 'Commentator',
        description: 'Created 25 comments',
        icon: '💬',
        color: '#6B7280',
        category: 'ENGAGEMENT',
        requirements: { type: 'COMMENTS', value: 25 },
        rarity: 'COMMON',
        karmaReward: 20,
        requiredLevel: 'NEWBIE'
      },
      {
        badgeId: 'SOCIAL_BUTTERFLY',
        name: 'Social Butterfly',
        description: 'Created 100 comments',
        icon: '🦋',
        color: '#10B981',
        category: 'ENGAGEMENT',
        requirements: { type: 'COMMENTS', value: 100 },
        rarity: 'UNCOMMON',
        karmaReward: 50,
        requiredLevel: 'EXPLORER'
      },
      {
        badgeId: 'REACTION_MASTER',
        name: 'Reaction Master',
        description: 'Given 500 reactions',
        icon: '👍',
        color: '#3B82F6',
        category: 'ENGAGEMENT',
        requirements: { type: 'REACTIONS', value: 500 },
        rarity: 'UNCOMMON',
        karmaReward: 75,
        requiredLevel: 'EXPLORER'
      },
      {
        badgeId: 'POPULAR',
        name: 'Popular',
        description: 'Received 1000 reactions',
        icon: '❤️',
        color: '#EF4444',
        category: 'ENGAGEMENT',
        requirements: { type: 'CUSTOM', value: 1000, additionalConditions: { type: 'reactions_received' } },
        rarity: 'RARE',
        karmaReward: 150,
        requiredLevel: 'CONTRIBUTOR'
      },
      
      // Prediction badges
      {
        badgeId: 'PREDICTOR',
        name: 'Predictor',
        description: 'Made 10 predictions',
        icon: '🔮',
        color: '#8B5CF6',
        category: 'PREDICTION',
        requirements: { type: 'PREDICTIONS', value: 10 },
        rarity: 'UNCOMMON',
        karmaReward: 50,
        requiredLevel: 'CONTRIBUTOR'
      },
      {
        badgeId: 'ORACLE',
        name: 'Oracle',
        description: 'Made 50 correct predictions',
        icon: '👁️',
        color: '#F59E0B',
        category: 'PREDICTION',
        requirements: { type: 'CUSTOM', value: 50, additionalConditions: { type: 'correct_predictions' } },
        rarity: 'EPIC',
        karmaReward: 200,
        requiredLevel: 'INFLUENCER'
      },
      
      // Moderation badges
      {
        badgeId: 'MODERATOR',
        name: 'Moderator',
        description: 'Performed 10 moderation actions',
        icon: '🛡️',
        color: '#10B981',
        category: 'MODERATION',
        requirements: { type: 'MODERATION', value: 10 },
        rarity: 'RARE',
        karmaReward: 100,
        requiredLevel: 'EXPERT'
      },
      {
        badgeId: 'COMMUNITY_GUARDIAN',
        name: 'Community Guardian',
        description: 'Performed 100 moderation actions',
        icon: '⚔️',
        color: '#EF4444',
        category: 'MODERATION',
        requirements: { type: 'MODERATION', value: 100 },
        rarity: 'LEGENDARY',
        karmaReward: 500,
        requiredLevel: 'LEGEND'
      }
    ];
  }

  // Initialize predefined badges
  async initializeBadges() {
    try {
      for (const badgeData of this.predefinedBadges) {
        const existingBadge = await Badge.findOne({ badgeId: badgeData.badgeId });
        if (!existingBadge) {
          const badge = new Badge(badgeData);
          await badge.save();
          logger.info(`[INFO] Created badge: ${badgeData.name}`);
        }
      }
      logger.info(`[INFO] Badge initialization completed`);
    } catch (error) {
      logger.error(`[ERROR] Failed to initialize badges:`, error);
      throw error;
    }
  }

  // Get all badges
  async getAllBadges(active = true) {
    try {
      const query = active !== null ? { active } : {};
      return await Badge.find(query)
        .sort({ category: 1, rarity: 1, karmaReward: -1 })
        .lean();
    } catch (error) {
      logger.error(`[ERROR] Failed to get all badges:`, error);
      throw error;
    }
  }

  // Get badges by category
  async getBadgesByCategory(category, active = true) {
    try {
      return await Badge.getBadgesByCategory(category, active);
    } catch (error) {
      logger.error(`[ERROR] Failed to get badges by category ${category}:`, error);
      throw error;
    }
  }

  // Get badges by rarity
  async getBadgesByRarity(rarity, active = true) {
    try {
      return await Badge.getBadgesByRarity(rarity, active);
    } catch (error) {
      logger.error(`[ERROR] Failed to get badges by rarity ${rarity}:`, error);
      throw error;
    }
  }

  // Get available badges for user
  async getAvailableBadgesForUser(userId) {
    try {
      const karma = await Karma.findOne({ userId });
      if (!karma) {
        return [];
      }
      
      return await Badge.getAvailableBadges(karma.currentLevel, true);
    } catch (error) {
      logger.error(`[ERROR] Failed to get available badges for user ${userId}:`, error);
      throw error;
    }
  }

  // Get badge by ID
  async getBadgeById(badgeId) {
    try {
      return await Badge.findOne({ badgeId });
    } catch (error) {
      logger.error(`[ERROR] Failed to get badge ${badgeId}:`, error);
      throw error;
    }
  }

  // Create new badge
  async createBadge(badgeData) {
    try {
      const badge = new Badge(badgeData);
      await badge.save();
      logger.info(`[INFO] Created new badge: ${badge.name}`);
      return badge;
    } catch (error) {
      logger.error(`[ERROR] Failed to create badge:`, error);
      throw error;
    }
  }

  // Update badge
  async updateBadge(badgeId, updateData) {
    try {
      const badge = await Badge.findOneAndUpdate(
        { badgeId },
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!badge) {
        throw new Error('Badge not found');
      }
      
      logger.info(`[INFO] Updated badge: ${badge.name}`);
      return badge;
    } catch (error) {
      logger.error(`[ERROR] Failed to update badge ${badgeId}:`, error);
      throw error;
    }
  }

  // Delete badge
  async deleteBadge(badgeId) {
    try {
      const badge = await Badge.findOneAndDelete({ badgeId });
      
      if (!badge) {
        throw new Error('Badge not found');
      }
      
      logger.info(`[INFO] Deleted badge: ${badge.name}`);
      return badge;
    } catch (error) {
      logger.error(`[ERROR] Failed to delete badge ${badgeId}:`, error);
      throw error;
    }
  }

  // Get badge statistics
  async getBadgeStats() {
    try {
      return await Badge.getBadgeStats();
    } catch (error) {
      logger.error(`[ERROR] Failed to get badge statistics:`, error);
      throw error;
    }
  }

  // Check and award badges for user
  async checkAndAwardBadges(userId) {
    try {
      const karma = await Karma.findOne({ userId });
      if (!karma) {
        return;
      }
      
      const availableBadges = await Badge.getAvailableBadges(karma.currentLevel, true);
      
      for (const badge of availableBadges) {
        if (!karma.hasBadge(badge.badgeId) || badge.repeatable) {
          const meetsRequirements = await badge.checkRequirements(karma, karma.stats);
          if (meetsRequirements) {
            await badge.awardToUser(karma);
            logger.info(`[INFO] Awarded badge ${badge.name} to user ${userId}`);
          }
        }
      }
    } catch (error) {
      logger.error(`[ERROR] Failed to check and award badges for user ${userId}:`, error);
      throw error;
    }
  }

  // Get user badge progress
  async getUserBadgeProgress(userId) {
    try {
      const karma = await Karma.findOne({ userId });
      if (!karma) {
        return { earned: [], available: [], progress: [] };
      }
      
      const availableBadges = await Badge.getAvailableBadges(karma.currentLevel, true);
      const earnedBadges = karma.badges.map(badge => badge.badgeId);
      
      const progress = availableBadges.map(badge => {
        const earned = earnedBadges.includes(badge.badgeId);
        const progressPercentage = this.calculateBadgeProgress(badge, karma, karma.stats);
        
        return {
          badgeId: badge.badgeId,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          color: badge.color,
          category: badge.category,
          rarity: badge.rarity,
          earned,
          progressPercentage,
          requirements: badge.requirements
        };
      });
      
      return {
        earned: karma.badges,
        available: availableBadges.filter(badge => !earnedBadges.includes(badge.badgeId)),
        progress
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get badge progress for user ${userId}:`, error);
      throw error;
    }
  }

  // Calculate badge progress percentage
  calculateBadgeProgress(badge, karma, stats) {
    const { type, value } = badge.requirements;
    
    switch (type) {
      case 'KARMA':
        return Math.min(100, Math.round((karma.totalKarma / value) * 100));
      case 'POSTS':
        return Math.min(100, Math.round((stats.postsCreated / value) * 100));
      case 'COMMENTS':
        return Math.min(100, Math.round((stats.commentsCreated / value) * 100));
      case 'REACTIONS':
        return Math.min(100, Math.round((stats.reactionsGiven / value) * 100));
      case 'PREDICTIONS':
        return Math.min(100, Math.round((stats.predictionsMade / value) * 100));
      case 'POLLS':
        return Math.min(100, Math.round((stats.pollsCreated / value) * 100));
      case 'MODERATION':
        return Math.min(100, Math.round((stats.moderationActions / value) * 100));
      case 'STREAK':
        return Math.min(100, Math.round((stats.streakDays / value) * 100));
      default:
        return 0;
    }
  }
}

module.exports = new BadgeService();
