const commentService = require('../services/comment.service');
const notificationService = require('../../../core/services/notification.service');
const karmaService = require('../services/karma.service');
const { logger } = require('../../../core/utils/logger');
const { ResponseHandler } = require('../../../core/utils/response');

class CommentController {
  // Create a new comment
  async createComment(req, res, next) {
    try {
      const { postId } = req.params;
      const { content, parentCommentId } = req.body;
      const userId = req.user._id;

      const comment = await commentService.createComment(
        userId,
        postId,
        content,
        parentCommentId
      );

      // Award karma for creating a comment
      try {
        await karmaService.handleCommentCreated(userId, comment._id);
      } catch (karmaError) {
        logger.error('Failed to award karma for comment creation:', karmaError);
        // Don't fail the comment creation if karma fails
      }

      // Send notification to post author or parent comment author
      if (comment && comment.postId) {
        try {
          const templates = notificationService.createNotificationTemplates();
          const commenterInfo = {
            _id: userId,
            username: req.user.username || req.user.name,
            avatar: req.user.avatar
          };

          if (parentCommentId && comment.parentCommentId) {
            // Reply to comment - notify parent comment author
            if (comment.parentCommentId.userId && comment.parentCommentId.userId.toString() !== userId.toString()) {
              const notification = {
                type: notificationService.notificationTypes.COMMENT_REPLIED,
                title: 'New Reply',
                message: `${commenterInfo.username} replied to your comment`,
                data: {
                  commenterId: userId,
                  commenterUsername: commenterInfo.username,
                  commenterAvatar: commenterInfo.avatar,
                  postId: comment.postId._id || postId,
                  commentId: comment._id,
                  parentCommentId: parentCommentId,
                  commentContent: content.substring(0, 100)
                },
                priority: notificationService.priorityLevels.MEDIUM
              };
              await notificationService.sendNotification(comment.parentCommentId.userId.toString(), notification);
            }
          } else if (comment.postId.userId && comment.postId.userId.toString() !== userId.toString()) {
            // Comment on post - notify post author
            const notification = templates.postCommented(
              commenterInfo,
              { _id: comment.postId._id || postId, content: comment.postId.content || '' },
              { _id: comment._id, content: content }
            );
            await notificationService.sendNotification(comment.postId.userId.toString(), notification);
          }
        } catch (notifError) {
          logger.error('[ERROR] Failed to send comment notification:', notifError);
          // Don't fail the request if notification fails
        }
      }

      return ResponseHandler.success(res, {
        comment,
        message: 'Comment created successfully'
      }, 201);
    } catch (error) {
      logger.error(`[ERROR] Failed to create comment:`, error);
      next(error);
    }
  }

  // Get comments for a post
  async getPostComments(req, res, next) {
    try {
      const { postId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeReplies = true,
        level = 0
      } = req.query;

      const result = await commentService.getPostComments(postId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        includeReplies: includeReplies === 'true',
        level: parseInt(level)
      });

      return ResponseHandler.success(res, {
        comments: result.comments,
        pagination: result.pagination,
        message: 'Post comments retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get post comments:`, error);
      next(error);
    }
  }

  // Get comment by ID
  async getCommentById(req, res, next) {
    try {
      const { commentId } = req.params;

      const comment = await commentService.getCommentById(commentId);

      return ResponseHandler.success(res, {
        comment,
        message: 'Comment retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get comment by ID:`, error);
      next(error);
    }
  }

  // Update a comment
  async updateComment(req, res, next) {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user._id;

      const comment = await commentService.updateComment(commentId, userId, content);

      return ResponseHandler.success(res, {
        comment,
        message: 'Comment updated successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to update comment:`, error);
      next(error);
    }
  }

  // Delete a comment
  async deleteComment(req, res, next) {
    try {
      const { commentId } = req.params;
      const userId = req.user._id;
      const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

      const result = await commentService.deleteComment(commentId, userId, isModerator);

      return ResponseHandler.success(res, {
        result,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to delete comment:`, error);
      next(error);
    }
  }

  // Get comment replies
  async getCommentReplies(req, res, next) {
    try {
      const { commentId } = req.params;
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'asc'
      } = req.query;

      const result = await commentService.getCommentReplies(commentId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        replies: result.replies,
        pagination: result.pagination,
        message: 'Comment replies retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get comment replies:`, error);
      next(error);
    }
  }

  // Get user's comments
  async getUserComments(req, res, next) {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await commentService.getUserComments(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        comments: result.comments,
        pagination: result.pagination,
        message: 'User comments retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get user comments:`, error);
      next(error);
    }
  }

  // Get current user's comments
  async getMyComments(req, res, next) {
    try {
      const userId = req.user._id;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await commentService.getUserComments(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        comments: result.comments,
        pagination: result.pagination,
        message: 'Your comments retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get current user comments:`, error);
      next(error);
    }
  }

  // Flag a comment
  async flagComment(req, res, next) {
    try {
      const { commentId } = req.params;
      const { reason } = req.body;
      const userId = req.user._id;

      const result = await commentService.flagComment(commentId, userId, reason);

      return ResponseHandler.success(res, {
        result,
        message: 'Comment flagged successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to flag comment:`, error);
      next(error);
    }
  }

  // Get comment statistics
  async getCommentStats(req, res, next) {
    try {
      const { postId, userId } = req.query;

      const stats = await commentService.getCommentStats(postId, userId);

      return ResponseHandler.success(res, {
        stats,
        message: 'Comment statistics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get comment stats:`, error);
      next(error);
    }
  }

  // Get trending comments
  async getTrendingComments(req, res, next) {
    try {
      const { limit = 10, timeframe = 7 } = req.query;

      const trendingComments = await commentService.getTrendingComments(
        parseInt(limit),
        parseInt(timeframe)
      );

      return ResponseHandler.success(res, {
        trendingComments,
        message: 'Trending comments retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending comments:`, error);
      next(error);
    }
  }

  // Search comments
  async searchComments(req, res, next) {
    try {
      const { q, postId, userId, page = 1, limit = 20 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const result = await commentService.searchComments(q.trim(), {
        page: parseInt(page),
        limit: parseInt(limit),
        postId,
        userId
      });

      return ResponseHandler.success(res, {
        comments: result.comments,
        query: result.query,
        pagination: result.pagination,
        message: 'Comment search completed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to search comments:`, error);
      next(error);
    }
  }

  // Get comment thread (comment with all its replies)
  async getCommentThread(req, res, next) {
    try {
      const { commentId } = req.params;
      const { includeReplies = true } = req.query;

      // Get the main comment
      const comment = await commentService.getCommentById(commentId);

      let replies = [];
      if (includeReplies === 'true') {
        // Get all replies for this comment
        const repliesResult = await commentService.getCommentReplies(commentId, {
          page: 1,
          limit: 100, // Get all replies for the thread
          sortBy: 'createdAt',
          sortOrder: 'asc'
        });
        replies = repliesResult.replies;
      }

      return ResponseHandler.success(res, {
        comment,
        replies,
        message: 'Comment thread retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get comment thread:`, error);
      next(error);
    }
  }

  // Get recent comments (for activity feed)
  async getRecentComments(req, res, next) {
    try {
      const { limit = 20, offset = 0 } = req.query;

      const { Comment } = require('../models');
      const comments = await Comment.find({
        isDeleted: false,
        status: 'approved'
      })
        .populate('userId', 'name username avatar')
        .populate('postId', 'title')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .lean();

      return ResponseHandler.success(res, {
        comments,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: comments.length === parseInt(limit)
        },
        message: 'Recent comments retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get recent comments:`, error);
      next(error);
    }
  }

  // React to a comment
  async reactToComment(req, res, next) {
    try {
      const { commentId } = req.params;
      const userId = req.user._id;
      const { reactionType } = req.body;

      const result = await commentService.reactToComment(commentId, userId, reactionType);

      // Award karma for giving a reaction
      if (result.action === 'added') {
        try {
          await karmaService.handleReactionGiven(userId, reactionType);
        } catch (karmaError) {
          logger.error('Failed to award karma for comment reaction:', karmaError);
          // Don't fail the request if karma fails
        }
      }

      // Award karma for receiving a reaction (if not own comment)
      if (result.action === 'added' && result.comment && result.comment.userId && result.comment.userId.toString() !== userId.toString()) {
        try {
          await karmaService.handleReactionReceived(result.comment.userId.toString(), reactionType);
        } catch (karmaError) {
          logger.error('Failed to award karma for received comment reaction:', karmaError);
          // Don't fail the request if karma fails
        }
      }

      // Send notification if reaction was added (not removed) and not reacting to own comment
      if (result.action === 'added' && result.comment && result.comment.userId && result.comment.userId.toString() !== userId.toString()) {
        try {
          const notification = {
            type: notificationService.notificationTypes.COMMENT_LIKED,
            title: 'Comment Reaction',
            message: `${req.user.username || req.user.name} reacted to your comment`,
            data: {
              userId: userId,
              username: req.user.username || req.user.name,
              avatar: req.user.avatar,
              commentId: commentId,
              reactionType: reactionType
            },
            priority: notificationService.priorityLevels.LOW
          };
          await notificationService.sendNotification(result.comment.userId.toString(), notification);
        } catch (notifError) {
          logger.error('[ERROR] Failed to send comment reaction notification:', notifError);
          // Don't fail the request if notification fails
        }
      }

      return ResponseHandler.success(res, {
        ...result,
        message: result.message
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to react to comment:`, error);
      next(error);
    }
  }

  // Get comment reactions
  async getCommentReactions(req, res, next) {
    try {
      const { commentId } = req.params;
      const userId = req.user?._id;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
      };

      const result = await commentService.getCommentReactions(commentId, userId, options);

      return ResponseHandler.success(res, {
        ...result,
        message: 'Comment reactions retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get comment reactions:`, error);
      next(error);
    }
  }
}

module.exports = new CommentController();
