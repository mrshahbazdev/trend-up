const { Topic, Post, Category, Hashtag } = require('../models');
const { logger } = require('../../../core/utils/logger');
const mongoose = require('mongoose');

class TopicService {
  constructor() {
    // Topic limits
    this.topicLimits = {
      maxNameLength: 100,
      maxDescriptionLength: 1000,
      maxShortDescriptionLength: 200,
      maxRulesCount: 10,
      maxTagsCount: 20,
      maxKeywordsCount: 30,
      maxRelatedTopics: 10,
      maxModerators: 20,
      maxNestingLevel: 2
    };
  }

  // Create a new topic
  async createTopic(topicData, createdBy) {
    try {
      // Validate required fields
      if (!topicData.name || !topicData.description) {
        throw new Error('Topic name and description are required');
      }

      // Check if topic name already exists
      const existingTopic = await Topic.findOne({ 
        $or: [
          { name: topicData.name },
          { slug: topicData.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') }
        ]
      });

      if (existingTopic) {
        throw new Error('Topic with this name already exists');
      }

      // Set level based on parent topic
      let level = 0;
      if (topicData.parentTopicId) {
        const parentTopic = await Topic.findById(topicData.parentTopicId);
        if (!parentTopic) {
          throw new Error('Parent topic not found');
        }

        if (parentTopic.level >= this.topicLimits.maxNestingLevel) {
          throw new Error('Maximum nesting level reached');
        }

        level = parentTopic.level + 1;
      }

      // Create the topic
      const topic = new Topic({
        ...topicData,
        createdBy: new mongoose.Types.ObjectId(createdBy),
        level,
        moderators: [new mongoose.Types.ObjectId(createdBy)] // Creator is automatically a moderator
      });

      await topic.save();
      await topic.populate('createdBy', 'name username avatar');
      await topic.populate('moderators', 'name username avatar');

      logger.info(`[INFO] Topic created: ${topic.name} by user ${createdBy}`);
      return topic;
    } catch (error) {
      logger.error(`[ERROR] Failed to create topic:`, error);
      throw error;
    }
  }

  // Get all topics with optional filtering
  async getAllTopics(options = {}) {
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
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Build query
      const query = {};

      if (isActive !== null) query.isActive = isActive;
      if (isPublic !== null) query.isPublic = isPublic;
      if (isCommunity !== null) query.isCommunity = isCommunity;
      if (parentTopicId) query.parentTopicId = new mongoose.Types.ObjectId(parentTopicId);
      if (level !== null) query.level = level;
      if (status) query.status = status;

      // Add search functionality
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { shortDescription: searchRegex },
          { tags: { $in: [searchRegex] } },
          { keywords: { $in: [searchRegex] } }
        ];
      }

      const topics = await Topic.find(query)
        .populate('createdBy', 'name username avatar')
        .populate('moderators', 'name username avatar')
        .populate('parentTopic', 'name slug')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await Topic.countDocuments(query);

      return {
        topics,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get topics:`, error);
      throw error;
    }
  }

  // Get topic by ID
  async getTopicById(topicId) {
    try {
      const topic = await Topic.findById(topicId)
        .populate('createdBy', 'name username avatar')
        .populate('moderators', 'name username avatar')
        .populate('parentTopic', 'name slug description')
        .populate('subtopics', 'name slug postCount memberCount')
        .populate('categories', 'name slug')
        .populate('hashtags', 'name postCount')
        .lean();

      if (!topic) {
        throw new Error('Topic not found');
      }

      if (!topic.isActive) {
        throw new Error('Topic is not active');
      }

      return topic;
    } catch (error) {
      logger.error(`[ERROR] Failed to get topic by ID:`, error);
      throw error;
    }
  }

  // Get topic by slug
  async getTopicBySlug(slug) {
    try {
      const topic = await Topic.findOne({ slug, isActive: true })
        .populate('createdBy', 'name username avatar')
        .populate('moderators', 'name username avatar')
        .populate('parentTopic', 'name slug description')
        .populate('subtopics', 'name slug postCount memberCount')
        .populate('categories', 'name slug')
        .populate('hashtags', 'name postCount')
        .lean();

      if (!topic) {
        throw new Error('Topic not found');
      }

      return topic;
    } catch (error) {
      logger.error(`[ERROR] Failed to get topic by slug:`, error);
      throw error;
    }
  }

  // Update a topic
  async updateTopic(topicId, updateData, userId, isModerator = false) {
    try {
      const topic = await Topic.findById(topicId);
      
      if (!topic) {
        throw new Error('Topic not found');
      }

      // Check authorization
      if (!isModerator && 
          topic.createdBy.toString() !== userId && 
          !topic.moderators.some(mod => mod.toString() === userId)) {
        throw new Error('Not authorized to update this topic');
      }

      // Check if new name conflicts with existing topics
      if (updateData.name && updateData.name !== topic.name) {
        const existingTopic = await Topic.findOne({ 
          name: updateData.name,
          _id: { $ne: topicId }
        });

        if (existingTopic) {
          throw new Error('Topic with this name already exists');
        }
      }

      // Update the topic
      Object.assign(topic, updateData);
      await topic.save();
      await topic.populate('createdBy', 'name username avatar');
      await topic.populate('moderators', 'name username avatar');

      logger.info(`[INFO] Topic ${topicId} updated by user ${userId}`);
      return topic;
    } catch (error) {
      logger.error(`[ERROR] Failed to update topic:`, error);
      throw error;
    }
  }

  // Delete a topic (soft delete)
  async deleteTopic(topicId, userId, isModerator = false) {
    try {
      const topic = await Topic.findById(topicId);
      
      if (!topic) {
        throw new Error('Topic not found');
      }

      // Check authorization
      if (!isModerator && topic.createdBy.toString() !== userId) {
        throw new Error('Not authorized to delete this topic');
      }

      // Check if topic has posts
      const postCount = await Post.countDocuments({ topicId: new mongoose.Types.ObjectId(topicId) });
      if (postCount > 0) {
        throw new Error('Cannot delete topic with existing posts');
      }

      // Check if topic has subtopics
      const subtopicCount = await Topic.countDocuments({ parentTopicId: new mongoose.Types.ObjectId(topicId) });
      if (subtopicCount > 0) {
        throw new Error('Cannot delete topic with subtopics');
      }

      // Soft delete the topic
      topic.isActive = false;
      topic.status = 'archived';
      await topic.save();

      logger.info(`[INFO] Topic ${topicId} deleted by user ${userId}`);
      return { message: 'Topic deleted successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to delete topic:`, error);
      throw error;
    }
  }

  // Get topic hierarchy
  async getTopicHierarchy() {
    try {
      const topics = await Topic.getTopicHierarchy();
      return topics;
    } catch (error) {
      logger.error(`[ERROR] Failed to get topic hierarchy:`, error);
      throw error;
    }
  }

  // Get popular topics
  async getPopularTopics(limit = 20) {
    try {
      const topics = await Topic.getPopularTopics(limit);
      return topics;
    } catch (error) {
      logger.error(`[ERROR] Failed to get popular topics:`, error);
      throw error;
    }
  }

  // Get trending topics
  async getTrendingTopics(timeframe = 7, limit = 10) {
    try {
      const topics = await Topic.getTrendingTopics(timeframe, limit);
      return topics;
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending topics:`, error);
      throw error;
    }
  }

  // Get community topics
  async getCommunityTopics(limit = 20) {
    try {
      const topics = await Topic.getCommunityTopics(limit);
      return topics;
    } catch (error) {
      logger.error(`[ERROR] Failed to get community topics:`, error);
      throw error;
    }
  }

  // Search topics
  async searchTopics(query, options = {}) {
    try {
      const topics = await Topic.searchTopics(query, options);
      return topics;
    } catch (error) {
      logger.error(`[ERROR] Failed to search topics:`, error);
      throw error;
    }
  }

  // Get topic statistics
  async getTopicStats() {
    try {
      const stats = await Topic.getTopicStats();
      return stats[0] || {
        totalTopics: 0,
        activeTopics: 0,
        publicTopics: 0,
        communityTopics: 0,
        verifiedTopics: 0,
        totalPosts: 0,
        totalMembers: 0,
        totalFollowers: 0,
        averagePostsPerTopic: 0,
        averageMembersPerTopic: 0
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get topic stats:`, error);
      throw error;
    }
  }

  // Get subtopics
  async getSubtopics(topicId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'name',
        sortOrder = 'asc'
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const subtopics = await Topic.find({
        parentTopicId: new mongoose.Types.ObjectId(topicId),
        isActive: true
      })
        .populate('createdBy', 'name username avatar')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await Topic.countDocuments({
        parentTopicId: new mongoose.Types.ObjectId(topicId),
        isActive: true
      });

      return {
        subtopics,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get subtopics:`, error);
      throw error;
    }
  }

  // Add moderator to topic
  async addModerator(topicId, userId, addedBy, isModerator = false) {
    try {
      const topic = await Topic.findById(topicId);
      
      if (!topic) {
        throw new Error('Topic not found');
      }

      // Check authorization
      if (!isModerator && 
          topic.createdBy.toString() !== addedBy && 
          !topic.moderators.some(mod => mod.toString() === addedBy)) {
        throw new Error('Not authorized to add moderators');
      }

      // Check if user is already a moderator
      if (topic.moderators.some(mod => mod.toString() === userId)) {
        throw new Error('User is already a moderator');
      }

      // Check moderator limit
      if (topic.moderators.length >= this.topicLimits.maxModerators) {
        throw new Error('Maximum number of moderators reached');
      }

      topic.moderators.push(new mongoose.Types.ObjectId(userId));
      await topic.save();
      await topic.populate('moderators', 'name username avatar');

      logger.info(`[INFO] User ${userId} added as moderator to topic ${topicId} by user ${addedBy}`);
      return topic;
    } catch (error) {
      logger.error(`[ERROR] Failed to add moderator:`, error);
      throw error;
    }
  }

  // Remove moderator from topic
  async removeModerator(topicId, userId, removedBy, isModerator = false) {
    try {
      const topic = await Topic.findById(topicId);
      
      if (!topic) {
        throw new Error('Topic not found');
      }

      // Check authorization
      if (!isModerator && 
          topic.createdBy.toString() !== removedBy && 
          !topic.moderators.some(mod => mod.toString() === removedBy)) {
        throw new Error('Not authorized to remove moderators');
      }

      // Cannot remove the creator
      if (topic.createdBy.toString() === userId) {
        throw new Error('Cannot remove the topic creator from moderators');
      }

      // Check if user is a moderator
      if (!topic.moderators.some(mod => mod.toString() === userId)) {
        throw new Error('User is not a moderator');
      }

      topic.moderators = topic.moderators.filter(mod => mod.toString() !== userId);
      await topic.save();
      await topic.populate('moderators', 'name username avatar');

      logger.info(`[INFO] User ${userId} removed as moderator from topic ${topicId} by user ${removedBy}`);
      return topic;
    } catch (error) {
      logger.error(`[ERROR] Failed to remove moderator:`, error);
      throw error;
    }
  }

  // Join/Leave topic (if implemented)
  async joinTopic(topicId, userId) {
    try {
      // This would integrate with a TopicMember model if implemented
      logger.info(`[INFO] User ${userId} joined topic ${topicId}`);
      return { message: 'Joined topic successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to join topic:`, error);
      throw error;
    }
  }

  async leaveTopic(topicId, userId) {
    try {
      // This would integrate with a TopicMember model if implemented
      logger.info(`[INFO] User ${userId} left topic ${topicId}`);
      return { message: 'Left topic successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to leave topic:`, error);
      throw error;
    }
  }

  // Follow/Unfollow topic (if implemented)
  async followTopic(topicId, userId) {
    try {
      // This would integrate with a TopicFollow model if implemented
      logger.info(`[INFO] User ${userId} followed topic ${topicId}`);
      return { message: 'Topic followed successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to follow topic:`, error);
      throw error;
    }
  }

  async unfollowTopic(topicId, userId) {
    try {
      // This would integrate with a TopicFollow model if implemented
      logger.info(`[INFO] User ${userId} unfollowed topic ${topicId}`);
      return { message: 'Topic unfollowed successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to unfollow topic:`, error);
      throw error;
    }
  }

  // Get topic posts
  async getTopicPosts(topicId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const posts = await Post.find({
        topicId: new mongoose.Types.ObjectId(topicId),
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
        topicId: new mongoose.Types.ObjectId(topicId),
        isDeleted: false,
        status: 'published'
      });

      return {
        posts,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get topic posts:`, error);
      throw error;
    }
  }

  // Update topic engagement scores
  async updateEngagementScores() {
    try {
      const topics = await Topic.find({ isActive: true });
      
      for (const topic of topics) {
        topic.calculateEngagementScore();
        topic.calculateTrendingScore();
        await topic.save();
      }

      logger.info(`[INFO] Updated engagement scores for ${topics.length} topics`);
      return { message: 'Engagement scores updated successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to update engagement scores:`, error);
      throw error;
    }
  }
}

module.exports = new TopicService();
