const { Hashtag, Post, Comment } = require('../models');
const { logger } = require('../../../core/utils/logger');
const mongoose = require('mongoose');

class HashtagService {
  constructor() {
    // Hashtag limits
    this.hashtagLimits = {
      maxNameLength: 50,
      minNameLength: 2,
      maxDescriptionLength: 500,
      maxTagsCount: 20,
      maxKeywordsCount: 30,
      maxRelatedHashtags: 10
    };
  }

  // Extract hashtags from text
  extractHashtags(text) {
    return Hashtag.extractHashtags(text);
  }

  // Create or update hashtags from text
  async createOrUpdateHashtags(text, type = 'post') {
    try {
      const hashtagNames = this.extractHashtags(text);
      if (hashtagNames.length === 0) return [];

      const hashtags = await Hashtag.createOrUpdateHashtags(hashtagNames, type);
      logger.info(`[INFO] Created/updated ${hashtags.length} hashtags for ${type}`);
      return hashtags;
    } catch (error) {
      logger.error(`[ERROR] Failed to create/update hashtags:`, error);
      throw error;
    }
  }

  // Get all hashtags with optional filtering
  async getAllHashtags(options = {}) {
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
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Build query
      const query = {};

      if (isActive !== null) query.isActive = isActive;
      if (isBanned !== null) query.isBanned = isBanned;
      if (minPostCount > 0) query.postCount = { $gte: minPostCount };

      // Add search functionality
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } },
          { keywords: { $in: [searchRegex] } }
        ];
      }

      const hashtags = await Hashtag.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await Hashtag.countDocuments(query);

      return {
        hashtags,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtags:`, error);
      throw error;
    }
  }

  // Get hashtag by name
  async getHashtagByName(name) {
    try {
      const hashtag = await Hashtag.findOne({ 
        name: name.toLowerCase(),
        isActive: true,
        isBanned: false
      })
        .populate('categories', 'name slug')
        .populate('relatedHashtags', 'name postCount')
        .lean();

      if (!hashtag) {
        throw new Error('Hashtag not found');
      }

      return hashtag;
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtag by name:`, error);
      throw error;
    }
  }

  // Get hashtag by ID
  async getHashtagById(hashtagId) {
    try {
      const hashtag = await Hashtag.findById(hashtagId)
        .populate('categories', 'name slug')
        .populate('relatedHashtags', 'name postCount')
        .lean();

      if (!hashtag) {
        throw new Error('Hashtag not found');
      }

      return hashtag;
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtag by ID:`, error);
      throw error;
    }
  }

  // Update hashtag
  async updateHashtag(hashtagId, updateData, userId, isModerator = false) {
    try {
      const hashtag = await Hashtag.findById(hashtagId);
      
      if (!hashtag) {
        throw new Error('Hashtag not found');
      }

      // Only moderators can update hashtags
      if (!isModerator) {
        throw new Error('Not authorized to update hashtags');
      }

      // Update the hashtag
      Object.assign(hashtag, updateData);
      await hashtag.save();

      logger.info(`[INFO] Hashtag ${hashtagId} updated by user ${userId}`);
      return hashtag;
    } catch (error) {
      logger.error(`[ERROR] Failed to update hashtag:`, error);
      throw error;
    }
  }

  // Ban/Unban hashtag
  async banHashtag(hashtagId, userId, isModerator = false) {
    try {
      const hashtag = await Hashtag.findById(hashtagId);
      
      if (!hashtag) {
        throw new Error('Hashtag not found');
      }

      // Only moderators can ban hashtags
      if (!isModerator) {
        throw new Error('Not authorized to ban hashtags');
      }

      hashtag.isBanned = true;
      hashtag.isActive = false;
      await hashtag.save();

      logger.info(`[INFO] Hashtag ${hashtagId} banned by user ${userId}`);
      return { message: 'Hashtag banned successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to ban hashtag:`, error);
      throw error;
    }
  }

  async unbanHashtag(hashtagId, userId, isModerator = false) {
    try {
      const hashtag = await Hashtag.findById(hashtagId);
      
      if (!hashtag) {
        throw new Error('Hashtag not found');
      }

      // Only moderators can unban hashtags
      if (!isModerator) {
        throw new Error('Not authorized to unban hashtags');
      }

      hashtag.isBanned = false;
      hashtag.isActive = true;
      await hashtag.save();

      logger.info(`[INFO] Hashtag ${hashtagId} unbanned by user ${userId}`);
      return { message: 'Hashtag unbanned successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to unban hashtag:`, error);
      throw error;
    }
  }

  // Get trending hashtags
  async getTrendingHashtags(timeframe = 24, limit = 50) {
    try {
      const hashtags = await Hashtag.getTrendingHashtags(timeframe, limit);
      return hashtags;
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending hashtags:`, error);
      throw error;
    }
  }

  // Get popular hashtags
  async getPopularHashtags(limit = 50) {
    try {
      const hashtags = await Hashtag.getPopularHashtags(limit);
      return hashtags;
    } catch (error) {
      logger.error(`[ERROR] Failed to get popular hashtags:`, error);
      throw error;
    }
  }

  // Search hashtags
  async searchHashtags(query, options = {}) {
    try {
      const hashtags = await Hashtag.searchHashtags(query, options);
      return hashtags;
    } catch (error) {
      logger.error(`[ERROR] Failed to search hashtags:`, error);
      throw error;
    }
  }

  // Get hashtag statistics
  async getHashtagStats() {
    try {
      const stats = await Hashtag.getHashtagStats();
      return stats[0] || {
        totalHashtags: 0,
        activeHashtags: 0,
        bannedHashtags: 0,
        verifiedHashtags: 0,
        totalPosts: 0,
        totalComments: 0,
        totalReactions: 0,
        averagePostsPerHashtag: 0
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtag stats:`, error);
      throw error;
    }
  }

  // Get related hashtags
  async getRelatedHashtags(hashtagId, limit = 10) {
    try {
      const hashtag = await Hashtag.findById(hashtagId)
        .populate('relatedHashtags', 'name postCount trendingScore')
        .lean();

      if (!hashtag) {
        throw new Error('Hashtag not found');
      }

      // If no related hashtags are set, find similar hashtags based on name similarity
      if (!hashtag.relatedHashtags || hashtag.relatedHashtags.length === 0) {
        const similarHashtags = await this.findSimilarHashtags(hashtag.name, limit);
        return similarHashtags;
      }

      return hashtag.relatedHashtags.slice(0, limit);
    } catch (error) {
      logger.error(`[ERROR] Failed to get related hashtags:`, error);
      throw error;
    }
  }

  // Find similar hashtags based on name similarity
  async findSimilarHashtags(hashtagName, limit = 10) {
    try {
      const hashtags = await Hashtag.find({
        name: { $ne: hashtagName },
        isActive: true,
        isBanned: false,
        postCount: { $gt: 0 }
      })
        .sort({ postCount: -1, trendingScore: -1 })
        .limit(limit)
        .select('name postCount trendingScore')
        .lean();

      return hashtags;
    } catch (error) {
      logger.error(`[ERROR] Failed to find similar hashtags:`, error);
      throw error;
    }
  }

  // Get hashtag usage history
  async getHashtagUsageHistory(hashtagId, period = 'week') {
    try {
      const hashtag = await Hashtag.findById(hashtagId);
      
      if (!hashtag) {
        throw new Error('Hashtag not found');
      }

      let usageData = [];
      const now = new Date();

      switch (period) {
        case 'day':
          usageData = hashtag.dailyUsage.slice(-7); // Last 7 days
          break;
        case 'week':
          usageData = hashtag.weeklyUsage.slice(-4); // Last 4 weeks
          break;
        case 'month':
          usageData = hashtag.monthlyUsage.slice(-6); // Last 6 months
          break;
        default:
          usageData = hashtag.weeklyUsage.slice(-4);
      }

      return {
        hashtag: hashtag.name,
        period,
        usageData
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtag usage history:`, error);
      throw error;
    }
  }

  // Update hashtag trending scores
  async updateTrendingScores() {
    try {
      const hashtags = await Hashtag.find({ isActive: true, isBanned: false });
      
      for (const hashtag of hashtags) {
        hashtag.calculateTrendingScore();
        await hashtag.save();
      }

      // Update trending ranks
      const sortedHashtags = await Hashtag.find({ isActive: true, isBanned: false })
        .sort({ trendingScore: -1 })
        .select('_id');

      for (let i = 0; i < sortedHashtags.length; i++) {
        await Hashtag.findByIdAndUpdate(sortedHashtags[i]._id, { trendingRank: i + 1 });
      }

      logger.info(`[INFO] Updated trending scores for ${hashtags.length} hashtags`);
      return { message: 'Trending scores updated successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to update trending scores:`, error);
      throw error;
    }
  }

  // Get hashtag posts
  async getHashtagPosts(hashtagName, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Find posts that contain this hashtag
      const posts = await Post.find({
        hashtags: hashtagName.toLowerCase(),
        isDeleted: false,
        status: 'published'
      })
        .populate('userId', 'name username avatar')
        .populate('categoryId', 'name slug')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await Post.countDocuments({
        hashtags: hashtagName.toLowerCase(),
        isDeleted: false,
        status: 'published'
      });

      return {
        posts,
        hashtag: hashtagName,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtag posts:`, error);
      throw error;
    }
  }

  // Clean up unused hashtags
  async cleanupUnusedHashtags() {
    try {
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      const unusedHashtags = await Hashtag.find({
        postCount: 0,
        commentCount: 0,
        lastUsedAt: { $lt: cutoffDate },
        isActive: true
      });

      for (const hashtag of unusedHashtags) {
        hashtag.isActive = false;
        await hashtag.save();
      }

      logger.info(`[INFO] Cleaned up ${unusedHashtags.length} unused hashtags`);
      return { message: `Cleaned up ${unusedHashtags.length} unused hashtags` };
    } catch (error) {
      logger.error(`[ERROR] Failed to cleanup unused hashtags:`, error);
      throw error;
    }
  }
}

module.exports = new HashtagService();
