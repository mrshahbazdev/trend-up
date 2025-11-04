const { Poll, Vote, Post, User, Karma } = require('../models');
const { logger } = require('../../../core/utils/logger');
const mongoose = require('mongoose');

class PollService {
  constructor() {
    // Poll configuration
    this.pollConfig = {
      maxOptions: 10,
      minOptions: 2,
      maxTitleLength: 200,
      maxDescriptionLength: 1000,
      maxOptionLength: 100,
      minExpirationHours: 1,
      maxExpirationDays: 30,
      defaultExpirationHours: 24,
    };
  }

  // Create a new poll
  async createPoll(userId, pollData) {
    try {
      const {
        title,
        description,
        options,
        allowMultipleVotes = false,
        isAnonymous = false,
        isPublic = true,
        expiresAt,
        category = 'general',
        tags = [],
      } = pollData;

      // Validate poll data
      this.validatePollData(pollData);

      // Create the post first
      const post = new Post({
        userId: new mongoose.Types.ObjectId(userId),
        content: title,
        postType: 'poll',
        category,
        hashtags: tags,
        isPublic,
      });

      await post.save();

      // Create the poll
      const poll = new Poll({
        postId: post._id,
        title,
        description,
        options: options.map((option, index) => ({
          id: `option_${index + 1}`,
          text: option,
          voteCount: 0,
          voters: [],
        })),
        allowMultipleVotes,
        isAnonymous,
        isPublic,
        expiresAt: new Date(expiresAt),
        category,
        tags,
      });

      await poll.save();

      // Populate the poll with post data
      await poll.populate('postId', 'userId content createdAt');
      await poll.populate('postId.userId', 'name username avatar');

      logger.info(`[INFO] Poll created successfully: ${poll._id} by user ${userId}`);
      return poll;
    } catch (error) {
      logger.error(`[ERROR] Failed to create poll:`, error);
      throw error;
    }
  }

  // Validate poll data
  validatePollData(pollData) {
    const { title, options, expiresAt } = pollData;

    if (!title || title.trim().length === 0) {
      throw new Error('Poll title is required');
    }

    if (title.length > this.pollConfig.maxTitleLength) {
      throw new Error(`Poll title cannot exceed ${this.pollConfig.maxTitleLength} characters`);
    }

    if (!options || !Array.isArray(options)) {
      throw new Error('Poll options are required');
    }

    if (options.length < this.pollConfig.minOptions) {
      throw new Error(`Poll must have at least ${this.pollConfig.minOptions} options`);
    }

    if (options.length > this.pollConfig.maxOptions) {
      throw new Error(`Poll cannot have more than ${this.pollConfig.maxOptions} options`);
    }

    // Validate each option
    options.forEach((option, index) => {
      if (!option || option.trim().length === 0) {
        throw new Error(`Option ${index + 1} cannot be empty`);
      }
      if (option.length > this.pollConfig.maxOptionLength) {
        throw new Error(`Option ${index + 1} cannot exceed ${this.pollConfig.maxOptionLength} characters`);
      }
    });

    // Validate expiration date
    if (!expiresAt) {
      throw new Error('Poll expiration date is required');
    }

    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const minExpiration = new Date(now.getTime() + this.pollConfig.minExpirationHours * 60 * 60 * 1000);
    const maxExpiration = new Date(now.getTime() + this.pollConfig.maxExpirationDays * 24 * 60 * 60 * 1000);

    if (expirationDate <= minExpiration) {
      throw new Error(`Poll must expire at least ${this.pollConfig.minExpirationHours} hours from now`);
    }

    if (expirationDate > maxExpiration) {
      throw new Error(`Poll cannot expire more than ${this.pollConfig.maxExpirationDays} days from now`);
    }
  }

  // Get poll by ID
  async getPollById(pollId) {
    try {
      const poll = await Poll.findById(pollId)
        .populate('postId', 'userId content createdAt reactionsCount commentCount')
        .populate('postId.userId', 'name username avatar karma');

      if (!poll) {
        throw new Error('Poll not found');
      }

      if (poll.isExpired && poll.status === 'active') {
        poll.status = 'expired';
        await poll.save();
      }

      return poll;
    } catch (error) {
      logger.error(`[ERROR] Failed to get poll by ID:`, error);
      throw error;
    }
  }

  // Vote on poll
  async voteOnPoll(pollId, userId, optionId, voteData = {}) {
    try {
      const { voteReason, ipAddress, userAgent } = voteData;

      const poll = await Poll.findById(pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      if (poll.status !== 'active') {
        throw new Error('Poll is not active');
      }

      if (poll.isExpired) {
        throw new Error('Poll has expired');
      }

      // Check if user already voted (unless multiple votes allowed)
      if (!poll.allowMultipleVotes) {
        const existingVote = await Vote.hasUserVoted(pollId, userId);
        if (existingVote) {
          throw new Error('You have already voted on this poll');
        }
      }

      // Add vote to poll
      await poll.addVote(userId, optionId);

      // Create vote record
      const vote = new Vote({
        pollId: new mongoose.Types.ObjectId(pollId),
        userId: new mongoose.Types.ObjectId(userId),
        optionId,
        isAnonymous: poll.isAnonymous,
        ipAddress,
        userAgent,
        voteReason,
      });

      await vote.save();

      // Update poll engagement score
      await this.updatePollEngagementScore(pollId);

      logger.info(`[INFO] User ${userId} voted on poll ${pollId} for option ${optionId}`);
      return { poll, vote };
    } catch (error) {
      logger.error(`[ERROR] Failed to vote on poll:`, error);
      throw error;
    }
  }

  // Remove vote from poll
  async removeVote(pollId, userId, optionId) {
    try {
      const poll = await Poll.findById(pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      if (poll.status !== 'active') {
        throw new Error('Poll is not active');
      }

      if (poll.isExpired) {
        throw new Error('Poll has expired');
      }

      // Remove vote from poll
      await poll.removeVote(userId, optionId);

      // Remove vote record
      await Vote.findOneAndDelete({
        pollId: new mongoose.Types.ObjectId(pollId),
        userId: new mongoose.Types.ObjectId(userId),
        optionId,
      });

      // Update poll engagement score
      await this.updatePollEngagementScore(pollId);

      logger.info(`[INFO] User ${userId} removed vote from poll ${pollId} for option ${optionId}`);
      return poll;
    } catch (error) {
      logger.error(`[ERROR] Failed to remove vote from poll:`, error);
      throw error;
    }
  }

  // Get poll results
  async getPollResults(pollId, userId = null) {
    try {
      const poll = await this.getPollById(pollId);

      const results = {
        poll: {
          _id: poll._id,
          title: poll.title,
          description: poll.description,
          status: poll.status,
          expiresAt: poll.expiresAt,
          timeRemaining: poll.timeRemaining,
          totalVotes: poll.totalVotes,
          uniqueVoters: poll.uniqueVoters,
          results: poll.results,
        },
        userVote: null,
        canVote: false,
      };

      // Get user's vote if userId provided
      if (userId) {
        const userVote = await Vote.hasUserVoted(pollId, userId);
        if (userVote) {
          results.userVote = {
            optionId: userVote.optionId,
            votedAt: userVote.votedAt,
          };
        }

        // Check if user can vote
        results.canVote = poll.status === 'active' && 
                         !poll.isExpired && 
                         (poll.allowMultipleVotes || !userVote);
      }

      return results;
    } catch (error) {
      logger.error(`[ERROR] Failed to get poll results:`, error);
      throw error;
    }
  }

  // Get active polls
  async getActivePolls(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const filter = { status: 'active' };
      if (category) filter.category = category;

      const polls = await Poll.find(filter)
        .populate('postId', 'userId content createdAt reactionsCount commentCount')
        .populate('postId.userId', 'name username avatar karma')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalCount = await Poll.countDocuments(filter);

      return {
        polls,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount,
        },
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get active polls:`, error);
      throw error;
    }
  }

  // Get trending polls
  async getTrendingPolls(limit = 20) {
    try {
      const polls = await Poll.getTrendingPolls(limit);
      return polls;
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending polls:`, error);
      throw error;
    }
  }

  // Get polls by category
  async getPollsByCategory(category, options = {}) {
    try {
      const polls = await Poll.getPollsByCategory(category, options);
      return polls;
    } catch (error) {
      logger.error(`[ERROR] Failed to get polls by category:`, error);
      throw error;
    }
  }

  // Get user's polls
  async getUserPolls(userId, options = {}) {
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

      // Get user's posts of type 'poll'
      const userPosts = await Post.find({
        userId: new mongoose.Types.ObjectId(userId),
        postType: 'poll',
      }).select('_id');

      const postIds = userPosts.map(post => post._id);

      const filter = { postId: { $in: postIds } };
      if (status !== 'all') {
        filter.status = status;
      }

      const polls = await Poll.find(filter)
        .populate('postId', 'userId content createdAt reactionsCount commentCount')
        .populate('postId.userId', 'name username avatar karma')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalCount = await Poll.countDocuments(filter);

      return {
        polls,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount,
        },
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get user polls:`, error);
      throw error;
    }
  }

  // Update poll
  async updatePoll(pollId, userId, updateData) {
    try {
      const poll = await Poll.findById(pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      // Check if user owns the poll
      const post = await Post.findById(poll.postId);
      if (post.userId.toString() !== userId.toString()) {
        throw new Error('Not authorized to update this poll');
      }

      if (poll.status !== 'active') {
        throw new Error('Cannot update inactive poll');
      }

      // Update allowed fields
      const allowedFields = ['title', 'description', 'isPublic'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          poll[field] = updateData[field];
        }
      });

      await poll.save();
      await poll.populate('postId', 'userId content createdAt');
      await poll.populate('postId.userId', 'name username avatar');

      logger.info(`[INFO] Poll ${pollId} updated by user ${userId}`);
      return poll;
    } catch (error) {
      logger.error(`[ERROR] Failed to update poll:`, error);
      throw error;
    }
  }

  // Close poll
  async closePoll(pollId, userId) {
    try {
      const poll = await Poll.findById(pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      // Check if user owns the poll
      const post = await Post.findById(poll.postId);
      if (post.userId.toString() !== userId.toString()) {
        throw new Error('Not authorized to close this poll');
      }

      await poll.closePoll();

      logger.info(`[INFO] Poll ${pollId} closed by user ${userId}`);
      return poll;
    } catch (error) {
      logger.error(`[ERROR] Failed to close poll:`, error);
      throw error;
    }
  }

  // Cancel poll
  async cancelPoll(pollId, userId) {
    try {
      const poll = await Poll.findById(pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      // Check if user owns the poll
      const post = await Post.findById(poll.postId);
      if (post.userId.toString() !== userId.toString()) {
        throw new Error('Not authorized to cancel this poll');
      }

      await poll.cancelPoll();

      logger.info(`[INFO] Poll ${pollId} cancelled by user ${userId}`);
      return poll;
    } catch (error) {
      logger.error(`[ERROR] Failed to cancel poll:`, error);
      throw error;
    }
  }

  // Update poll engagement score
  async updatePollEngagementScore(pollId) {
    try {
      const poll = await Poll.findById(pollId);
      if (!poll) return;

      // Calculate engagement score based on votes, views, and comments
      const engagementScore = 
        (poll.totalVotes * 2) + 
        (poll.viewCount * 0.1) + 
        (poll.commentCount * 1.5) + 
        (poll.shareCount * 1);

      poll.engagementScore = engagementScore;

      // Calculate trending score (recent activity weighted)
      const hoursSinceCreation = (Date.now() - poll.createdAt.getTime()) / (1000 * 60 * 60);
      const trendingScore = engagementScore / Math.max(1, hoursSinceCreation);
      poll.trendingScore = trendingScore;

      await poll.save();
    } catch (error) {
      logger.error(`[ERROR] Failed to update poll engagement score:`, error);
    }
  }

  // Get poll statistics
  async getPollStats() {
    try {
      const stats = await Poll.getPollStats();
      return stats[0] || {
        totalPolls: 0,
        activePolls: 0,
        expiredPolls: 0,
        closedPolls: 0,
        totalVotes: 0,
        totalViews: 0,
        avgVotesPerPoll: 0,
        avgViewsPerPoll: 0,
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get poll stats:`, error);
      throw error;
    }
  }

  // Search polls
  async searchPolls(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
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
          { tags: { $in: [new RegExp(query, 'i')] } },
        ],
        status,
      };

      if (category) searchFilter.category = category;
      if (status === 'active') {
        searchFilter.expiresAt = { $gt: new Date() };
      }

      const polls = await Poll.find(searchFilter)
        .populate('postId', 'userId content createdAt reactionsCount commentCount')
        .populate('postId.userId', 'name username avatar karma')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const totalCount = await Poll.countDocuments(searchFilter);

      return {
        polls,
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
      logger.error(`[ERROR] Failed to search polls:`, error);
      throw error;
    }
  }

  // Process expired polls
  async processExpiredPolls() {
    try {
      const expiredPolls = await Poll.find({
        status: 'active',
        expiresAt: { $lte: new Date() },
      });

      for (const poll of expiredPolls) {
        poll.status = 'expired';
        poll.updateResults();
        await poll.save();
      }

      logger.info(`[INFO] Processed ${expiredPolls.length} expired polls`);
      return { processed: expiredPolls.length };
    } catch (error) {
      logger.error(`[ERROR] Failed to process expired polls:`, error);
      throw error;
    }
  }
}

module.exports = new PollService();
