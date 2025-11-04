const postService = require('../services/post.service');
const s3Service = require('../../../core/services/s3.service');
const notificationService = require('../../../core/services/notification.service');
const karmaService = require('../services/karma.service');
const { sendSuccessResponse } = require('../../../core/utils/response');
const ErrorHandler = require('../../../core/errors/ErrorHandler');

class PostController {
  /**
   * Create a new post
   */
  async createPost(req, res) {
    try {
      const userId = req.user._id;
      const postData = req.body;
      const files = req.files || [];

      console.log('Creating post with data:', { 
        userId, 
        postType: postData.postType, 
        hasContent: !!postData.content,
        hasMedia: files.length > 0,
        pollOptions: postData.pollOptions?.length || 0,
        predictionData: !!postData.predictionData
      });

      // Handle media uploads if files are provided
      if (files.length > 0) {
        const mediaUrls = [];
        
        for (const file of files) {
          try {
            // Generate unique filename
            const filename = s3Service.generateFilename(userId, file.originalname, 'post');
            
            // Upload to S3
            const uploadResult = await s3Service.uploadFile(
              file.buffer,
              'posts',
              filename,
              file.mimetype
            );
            
            mediaUrls.push(uploadResult.url);
          } catch (error) {
            console.error('Failed to upload media:', error);
            // Continue with other files, don't fail the entire post
          }
        }
        
        // Add media URLs to post data
        postData.mediaUrls = mediaUrls;
      }

      const result = await postService.createPost(userId, postData);
      
      // Award karma for creating a post
      try {
        await karmaService.handlePostCreated(userId, result.post._id);
      } catch (karmaError) {
        console.error('Failed to award karma for post creation:', karmaError);
        // Don't fail the post creation if karma fails
      }
      
      sendSuccessResponse(res, result, 'Post created successfully', 201);
    } catch (error) {
      console.error('Post creation error:', error);
      ErrorHandler.handleAsync(error, req, res);
    }
  }

  /**
   * Vote on a post-based poll
   */
  async voteOnPostPoll(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;
      const { optionIndex } = req.body;

      console.log('Voting on post poll:', { postId, userId, optionIndex });

      if (optionIndex === undefined || optionIndex === null) {
        return res.status(400).json({
          success: false,
          message: 'Option index is required'
        });
      }

      const result = await postService.voteOnPostPoll(postId, userId, optionIndex);
      sendSuccessResponse(res, result, 'Vote cast successfully');
    } catch (error) {
      console.error('Post poll voting error:', error);
      ErrorHandler.handleAsync(error, req, res);
    }
  }

  /**
   * Get post poll results
   */
  async getPostPollResults(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const results = await postService.getPostPollResults(postId, userId);
      sendSuccessResponse(res, { results }, 'Poll results retrieved successfully');
    } catch (error) {
      console.error('Get post poll results error:', error);
      ErrorHandler.handleAsync(error, req, res);
    }
  }

  /**
   * Stake on a post-based prediction
   */
  async stakeOnPostPrediction(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;
      const { stake, agree } = req.body;

      console.log('Staking on post prediction:', { postId, userId, stake, agree });

      if (stake === undefined || stake === null || stake <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid stake amount is required'
        });
      }

      if (agree === undefined || agree === null) {
        return res.status(400).json({
          success: false,
          message: 'Agree/disagree position is required'
        });
      }

      const result = await postService.stakeOnPostPrediction(postId, userId, stake, agree);
      sendSuccessResponse(res, result, 'Stake submitted successfully');
    } catch (error) {
      console.error('Post prediction staking error:', error);
      ErrorHandler.handleAsync(error, req, res);
    }
  }

  /**
   * Get post prediction results
   */
  async getPostPredictionResults(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const results = await postService.getPostPredictionResults(postId, userId);
      sendSuccessResponse(res, { results }, 'Prediction results retrieved successfully');
    } catch (error) {
      console.error('Get post prediction results error:', error);
      ErrorHandler.handleAsync(error, req, res);
    }
  }

  /**
   * Get posts with filtering and pagination
   */
  async getPosts(req, res) {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      category: req.query.category,
      postType: req.query.postType,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      hashtag: req.query.hashtag,
      userId: req.query.userId,
    };

    const result = await postService.getPosts(options);
    sendSuccessResponse(res, result, 'Posts retrieved successfully');
  }

  /**
   * Get single post by ID
   */
  async getPostById(req, res) {
    const { id } = req.params;
    const userId = req.user?._id;

    const result = await postService.getPostById(id, userId);
    sendSuccessResponse(res, result, 'Post retrieved successfully');
  }

  /**
   * Update post
   */
  async updatePost(req, res) {
    const { id } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const result = await postService.updatePost(id, userId, updates);
    sendSuccessResponse(res, result, 'Post updated successfully');
  }

  /**
   * Delete post
   */
  async deletePost(req, res) {
    const { id } = req.params;
    const userId = req.user._id;

    const result = await postService.deletePost(id, userId);
    sendSuccessResponse(res, result, result.message);
  }

  /**
   * React to a post
   */
  async reactToPost(req, res) {
    const { id } = req.params;
    const userId = req.user._id;
    const { reactionType } = req.body;

    const result = await postService.reactToPost(id, userId, reactionType);
    
    // Award karma for giving a reaction
    if (result.action === 'added') {
      try {
        await karmaService.handleReactionGiven(userId, reactionType);
      } catch (karmaError) {
        console.error('Failed to award karma for reaction:', karmaError);
        // Don't fail the request if karma fails
      }
    }
    
    // Award karma for receiving a reaction (if not own post)
    if (result.action === 'added' && result.post && result.post.userId.toString() !== userId.toString()) {
      try {
        await karmaService.handleReactionReceived(result.post.userId.toString(), reactionType);
      } catch (karmaError) {
        console.error('Failed to award karma for received reaction:', karmaError);
        // Don't fail the request if karma fails
      }
    }
    
    // Send notification if reaction was added (not removed) and not reacting to own post
    if (result.action === 'added' && result.post && result.post.userId.toString() !== userId.toString()) {
      try {
        const templates = notificationService.createNotificationTemplates();
        const notification = templates.postLiked(
          { _id: userId, username: req.user.username || req.user.name, avatar: req.user.avatar },
          { _id: id, content: result.post.content || 'your post' }
        );
        await notificationService.sendNotification(result.post.userId.toString(), notification);
      } catch (notifError) {
        console.error('[ERROR] Failed to send reaction notification:', notifError);
        // Don't fail the request if notification fails
      }
    }
    
    sendSuccessResponse(res, result, result.message);
  }

  /**
   * Get post reactions
   */
  async getPostReactions(req, res) {
    const { id } = req.params;
    const userId = req.user?._id; // Get user ID if authenticated
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    };

    const result = await postService.getPostReactions(id, userId, options);
    sendSuccessResponse(res, result, 'Post reactions retrieved successfully');
  }

  /**
   * Get trending posts
   */
  async getTrendingPosts(req, res) {
    const timeRange = req.query.timeRange || '24h';
    const limit = parseInt(req.query.limit) || 20;

    const posts = await postService.getTrendingPosts(timeRange, limit);
    sendSuccessResponse(res, { posts }, 'Trending posts retrieved successfully');
  }

  /**
   * Get user's posts
   */
  async getUserPosts(req, res) {
    const { userId } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      category: req.query.category,
      postType: req.query.postType,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await postService.getUserPosts(userId, options);
    sendSuccessResponse(res, result, 'User posts retrieved successfully');
  }

  /**
   * Search posts
   */
  async searchPosts(req, res) {
    const { q } = req.query;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      category: req.query.category,
      postType: req.query.postType,
    };

    if (!q || q.trim().length < 2) {
      return sendSuccessResponse(res, { posts: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }, 'Query too short');
    }

    const result = await postService.searchPosts(q, options);
    sendSuccessResponse(res, result, 'Search results retrieved successfully');
  }
}

const postController = new PostController();

module.exports = {
  createPost: ErrorHandler.handleAsync(postController.createPost.bind(postController)),
  getPosts: ErrorHandler.handleAsync(postController.getPosts.bind(postController)),
  getPostById: ErrorHandler.handleAsync(postController.getPostById.bind(postController)),
  updatePost: ErrorHandler.handleAsync(postController.updatePost.bind(postController)),
  deletePost: ErrorHandler.handleAsync(postController.deletePost.bind(postController)),
  reactToPost: ErrorHandler.handleAsync(postController.reactToPost.bind(postController)),
  getPostReactions: ErrorHandler.handleAsync(postController.getPostReactions.bind(postController)),
  getTrendingPosts: ErrorHandler.handleAsync(postController.getTrendingPosts.bind(postController)),
  getUserPosts: ErrorHandler.handleAsync(postController.getUserPosts.bind(postController)),
  getSearchPosts: ErrorHandler.handleAsync(postController.searchPosts.bind(postController)),
  voteOnPostPoll: ErrorHandler.handleAsync(postController.voteOnPostPoll.bind(postController)),
  getPostPollResults: ErrorHandler.handleAsync(postController.getPostPollResults.bind(postController)),
  stakeOnPostPrediction: ErrorHandler.handleAsync(postController.stakeOnPostPrediction.bind(postController)),
  getPostPredictionResults: ErrorHandler.handleAsync(postController.getPostPredictionResults.bind(postController)),
};
