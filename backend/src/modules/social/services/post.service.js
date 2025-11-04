const { Post, Reaction, Comment } = require('../models');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../../../core/errors/AppError');
const { logger } = require('../../../core/utils/logger');
const karmaService = require('./karma.service');

class PostService {
  /**
   * Create a new post
   */
  async createPost(userId, postData) {
    try {
      const {
        content,
        postType = 'text',
        category = 'general',
        visibility = 'public',
        mediaUrls = [],
        hashtags = [],
        scheduledAt,
        expiresAt,
        pollOptions,
        pollSettings,
        predictionData,
      } = postData;

      console.log('PostService - Creating post:', {
        userId,
        postType,
        hasContent: !!content,
        pollOptionsCount: pollOptions?.length || 0,
        hasPredictionData: !!predictionData,
        mediaUrlsCount: mediaUrls?.length || 0
      });

      // Validate required fields
      if (!content || content.trim().length === 0) {
        throw new BadRequestError('Post content is required');
      }

      // Validate post type specific data
      if (postType === 'poll') {
        if (!pollOptions || pollOptions.length < 2) {
          throw new BadRequestError('Poll must have at least 2 options');
        }
        // Validate poll options
        const validOptions = pollOptions.filter(opt => opt.text && opt.text.trim().length > 0);
        if (validOptions.length < 2) {
          throw new BadRequestError('Poll options must have valid text');
        }
      }

      if (postType === 'prediction') {
        if (!predictionData?.predictionText || predictionData.predictionText.trim().length === 0) {
          throw new BadRequestError('Prediction must have prediction text');
        }
        if (!predictionData?.targetDate) {
          throw new BadRequestError('Prediction must have a target date');
        }
      }

    // Create post object
    const post = new Post({
      userId,
      content,
      postType,
      category,
      visibility,
      mediaUrls,
      hashtags,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    // Add poll-specific data
    if (postType === 'poll' && pollOptions) {
      post.pollOptions = pollOptions.map(option => ({
        text: option.text,
        votes: 0,
      }));
      post.pollSettings = {
        expiresAt: pollSettings?.expiresAt ? new Date(pollSettings.expiresAt) : undefined,
        allowMultipleVotes: pollSettings?.allowMultipleVotes || false,
        totalVotes: 0,
      };
    }

    // Add prediction-specific data
    if (postType === 'prediction' && predictionData) {
      post.predictionData = {
        predictionText: predictionData.predictionText,
        targetDate: new Date(predictionData.targetDate),
        outcome: 'pending',
        totalStakedKarma: 0,
        participantsCount: 0,
      };
    }

    await post.save();

    // Populate author data
    await post.populate('author', 'name username avatar karmaScore karmaLevel badges');

    // Award karma for poll/prediction creation
    if (postType === 'poll') {
      try {
        await karmaService.addKarma(
          userId,
          karmaService.karmaRates.POLL_CREATED,
          'POLL_CREATED',
          post._id,
          'Created a poll'
        );
      } catch (karmaError) {
        logger.error(`[ERROR] Failed to award karma for poll creation:`, karmaError);
        // Don't fail the post creation if karma fails
      }
    } else if (postType === 'prediction') {
      try {
        await karmaService.addKarma(
          userId,
          karmaService.karmaRates.PREDICTION_CREATED || 10, // Default if not defined
          'PREDICTION_CREATED',
          post._id,
          'Created a prediction'
        );
      } catch (karmaError) {
        logger.error(`[ERROR] Failed to award karma for prediction creation:`, karmaError);
        // Don't fail the post creation if karma fails
      }
    }

    logger.info(`Post created: ${post._id} by user: ${userId}`);

    return { post };
    } catch (error) {
      logger.error(`Failed to create post for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get posts with filtering and pagination
   */
  async getPosts(options = {}) {
    const {
      page = 1,
      limit = 20,
      category,
      postType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      hashtag,
      userId,
      status = 'approved',
    } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Build query
    const query = {
      status,
      visibility: 'public',
      isDeleted: false,
    };

    if (category) query.category = category;
    if (postType) query.postType = postType;
    if (userId) query.userId = userId;
    if (hashtag) query.hashtags = hashtag.toLowerCase();

    // Add expiry filter for polls and predictions
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ];

    const posts = await Post.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username avatar karmaScore karmaLevel badges');

    const total = await Post.countDocuments(query);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single post by ID
   */
  async getPostById(postId, userId = null) {
    const post = await Post.findOne({
      _id: postId,
      isDeleted: false,
    }).populate('author', 'name username avatar karmaScore karmaLevel badges');

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Check visibility
    if (post.visibility === 'private' && post.userId.toString() !== userId) {
      throw new ForbiddenError('Post is private');
    }

    // Increment view count
    await post.incrementViews();

    // Get reactions for this post
    const reactions = await Reaction.getPostReactionCounts(postId);

    // Get user's reactions if userId provided
    let userReactions = [];
    if (userId) {
      userReactions = await Reaction.getUserPostReactions(userId, postId);
    }

    return {
      post,
      reactions,
      userReactions,
    };
  }

  /**
   * Update post
   */
  async updatePost(postId, userId, updates) {
    const post = await Post.findOne({
      _id: postId,
      userId,
      isDeleted: false,
    });

    if (!post) {
      throw new NotFoundError('Post not found or you do not have permission to edit it');
    }

    // Check if post can be edited (not too old or has engagement)
    const hoursSinceCreation = (Date.now() - post.createdAt) / (1000 * 60 * 60);
    const hasEngagement = post.reactionsCount > 0 || post.commentsCount > 0;

    if (hoursSinceCreation > 24 && hasEngagement) {
      throw new BadRequestError('Cannot edit post after 24 hours if it has engagement');
    }

    // Update allowed fields
    const allowedUpdates = ['content', 'category', 'visibility', 'hashtags'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        post[field] = updates[field];
      }
    });

    await post.save();
    await post.populate('author', 'name username avatar karmaScore karmaLevel badges');

    logger.info(`Post updated: ${postId} by user: ${userId}`);

    return { post };
  }

  /**
   * Delete post (soft delete)
   */
  async deletePost(postId, userId) {
    const post = await Post.findOne({
      _id: postId,
      userId,
      isDeleted: false,
    });

    if (!post) {
      throw new NotFoundError('Post not found or you do not have permission to delete it');
    }

    // Soft delete
    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    logger.info(`Post deleted: ${postId} by user: ${userId}`);

    return { message: 'Post deleted successfully' };
  }

  /**
   * React to a post
   */
  async reactToPost(postId, userId, reactionType) {
    // Check if post exists
    const post = await Post.findOne({
      _id: postId,
      isDeleted: false,
      status: 'approved',
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Check if user already has this reaction
    const existingReaction = await Reaction.findOne({
      userId,
      postId,
      reactionType,
    });

    if (existingReaction) {
      // Remove existing reaction
      await Reaction.findByIdAndDelete(existingReaction._id);
      await post.incrementReactions(-1);
      
      logger.info(`Reaction removed: ${reactionType} on post ${postId} by user ${userId}`);
      
      return { 
        message: 'Reaction removed',
        action: 'removed',
        reaction: null,
      };
    }

    // Remove any other reaction by this user on this post
    await Reaction.deleteMany({ userId, postId });

    // Create new reaction
    const reaction = new Reaction({
      userId,
      postId,
      reactionType,
    });

    await reaction.save();
    await post.incrementReactions(1);

    // Populate user data
    await reaction.populate('user', 'name username avatar karmaScore karmaLevel');

    logger.info(`Reaction added: ${reactionType} on post ${postId} by user ${userId}`);

    return {
      message: 'Reaction added',
      action: 'added',
      reaction,
    };
  }

  /**
   * Get post reactions
   */
  async getPostReactions(postId, userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await Post.findOne({
      _id: postId,
      isDeleted: false,
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Get reaction counts
    const reactionCounts = await Reaction.getPostReactionCounts(postId);

    // Get individual reactions with user data
    const reactions = await Reaction.find({ postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name username avatar karmaScore karmaLevel');

    const total = await Reaction.countDocuments({ postId });

    // Get user's reactions if userId is provided
    let userReactions = [];
    if (userId) {
      userReactions = await Reaction.find({ postId, userId }).select('reactionType');
    }

    return {
      reactionCounts,
      reactions,
      userReactions: userReactions.map(r => r.reactionType),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get trending posts
   */
  async getTrendingPosts(timeRange = '24h', limit = 20) {
    return await Post.getTrending(timeRange, limit);
  }

  /**
   * Get user's posts
   */
  async getUserPosts(userId, options = {}) {
    return await this.getPosts({
      ...options,
      userId,
    });
  }

  /**
   * Search posts
   */
  async searchPosts(query, options = {}) {
    const {
      page = 1,
      limit = 20,
      category,
      postType,
    } = options;

    const skip = (page - 1) * limit;

    const searchQuery = {
      $text: { $search: query },
      status: 'approved',
      visibility: 'public',
      isDeleted: false,
    };

    if (category) searchQuery.category = category;
    if (postType) searchQuery.postType = postType;

    const posts = await Post.find(searchQuery, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username avatar karmaScore karmaLevel badges');

    const total = await Post.countDocuments(searchQuery);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Vote on a post-based poll
   */
  async voteOnPostPoll(postId, userId, optionIndex) {
    try {
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      if (post.postType !== 'poll') {
        throw new Error('This post is not a poll');
      }

      if (!post.pollOptions || !post.pollOptions[optionIndex]) {
        throw new Error('Invalid poll option');
      }

      // Check if poll has expired
      if (post.pollSettings?.expiresAt && new Date(post.pollSettings.expiresAt) < new Date()) {
        throw new Error('This poll has expired');
      }

      // Check if user already voted (unless multiple votes allowed)
      if (!post.pollSettings?.allowMultipleVotes) {
        const hasVoted = post.pollOptions.some(option => 
          option.voters?.some(voter => voter.toString() === userId.toString())
        );
        if (hasVoted) {
          throw new Error('You have already voted on this poll');
        }
      }

      // Add vote to the specific option
      const option = post.pollOptions[optionIndex];
      if (!option.voters) {
        option.voters = [];
      }
      option.voters.push(userId);
      option.votes = (option.votes || 0) + 1;

      // Update total votes
      post.pollSettings.totalVotes = (post.pollSettings.totalVotes || 0) + 1;

      await post.save();

      // Award karma for poll participation
      try {
        await karmaService.addKarma(
          userId,
          karmaService.karmaRates.POLL_PARTICIPATED,
          'POLL_PARTICIPATED',
          postId,
          'Participated in a poll'
        );
      } catch (karmaError) {
        logger.error(`[ERROR] Failed to award karma for poll participation:`, karmaError);
        // Don't fail the vote if karma fails
      }

      logger.info(`[INFO] User ${userId} voted on post poll ${postId} for option ${optionIndex}`);
      return { post };
    } catch (error) {
      logger.error(`[ERROR] Failed to vote on post poll:`, error);
      throw error;
    }
  }

  /**
   * Get post poll results
   */
  async getPostPollResults(postId, userId) {
    try {
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      if (post.postType !== 'poll') {
        throw new Error('This post is not a poll');
      }

      const results = {
        postId: post._id,
        question: post.content,
        options: post.pollOptions?.map((option, index) => ({
          index,
          text: option.text,
          votes: option.votes || 0,
          voters: option.voters || [],
          hasUserVoted: option.voters?.some(voter => voter.toString() === userId.toString()) || false,
        })) || [],
        totalVotes: post.pollSettings?.totalVotes || 0,
        expiresAt: post.pollSettings?.expiresAt,
        allowMultipleVotes: post.pollSettings?.allowMultipleVotes || false,
        isExpired: post.pollSettings?.expiresAt && new Date(post.pollSettings.expiresAt) < new Date(),
      };

      return results;
    } catch (error) {
      logger.error(`[ERROR] Failed to get post poll results:`, error);
      throw error;
    }
  }

  /**
   * Stake on a post-based prediction
   */
  async stakeOnPostPrediction(postId, userId, stake, agree) {
    try {
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      if (post.postType !== 'prediction') {
        throw new Error('This post is not a prediction');
      }

      if (!post.predictionData) {
        throw new Error('Prediction data not found');
      }

      // Check if prediction has expired
      if (post.predictionData.targetDate && new Date(post.predictionData.targetDate) < new Date()) {
        throw new Error('This prediction has expired');
      }

      // Check if prediction is already resolved
      if (post.predictionData.outcome !== 'pending') {
        throw new Error('This prediction has already been resolved');
      }

      // Validate stake amount
      if (!stake || stake <= 0 || stake > 1000) {
        throw new Error('Stake amount must be between 1 and 1000 karma');
      }

      // Check if user already staked (we'll store this in a separate field)
      if (!post.predictionData.participants) {
        post.predictionData.participants = [];
      }

      const existingStake = post.predictionData.participants.find(
        participant => participant.userId.toString() === userId.toString()
      );

      if (existingStake) {
        throw new Error('You have already staked on this prediction');
      }

      // Add stake to prediction
      post.predictionData.participants.push({
        userId: userId,
        stake: stake,
        agree: agree,
        stakedAt: new Date()
      });

      // Update totals
      post.predictionData.totalStakedKarma = (post.predictionData.totalStakedKarma || 0) + stake;
      post.predictionData.participantsCount = (post.predictionData.participantsCount || 0) + 1;

      await post.save();

      // Award karma for prediction participation
      try {
        await karmaService.addKarma(
          userId,
          karmaService.karmaRates.PREDICTION_PARTICIPATED || 2, // Default if not defined
          'PREDICTION_PARTICIPATED',
          postId,
          'Participated in a prediction'
        );
      } catch (karmaError) {
        logger.error(`[ERROR] Failed to award karma for prediction participation:`, karmaError);
        // Don't fail the stake if karma fails
      }

      logger.info(`[INFO] User ${userId} staked ${stake} karma on post prediction ${postId} (agree: ${agree})`);
      return { post };
    } catch (error) {
      logger.error(`[ERROR] Failed to stake on post prediction:`, error);
      throw error;
    }
  }

  /**
   * Get post prediction results
   */
  async getPostPredictionResults(postId, userId) {
    try {
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      if (post.postType !== 'prediction') {
        throw new Error('This post is not a prediction');
      }

      const results = {
        postId: post._id,
        predictionText: post.predictionData?.predictionText,
        targetDate: post.predictionData?.targetDate,
        outcome: post.predictionData?.outcome || 'pending',
        totalStakedKarma: post.predictionData?.totalStakedKarma || 0,
        participantsCount: post.predictionData?.participantsCount || 0,
        participants: post.predictionData?.participants || [],
        isExpired: post.predictionData?.targetDate && new Date(post.predictionData.targetDate) < new Date(),
        hasUserStaked: post.predictionData?.participants?.some(
          participant => participant.userId.toString() === userId.toString()
        ) || false,
        userStake: post.predictionData?.participants?.find(
          participant => participant.userId.toString() === userId.toString()
        ) || null,
      };

      return results;
    } catch (error) {
      logger.error(`[ERROR] Failed to get post prediction results:`, error);
      throw error;
    }
  }
}

const postService = new PostService();

module.exports = postService;
