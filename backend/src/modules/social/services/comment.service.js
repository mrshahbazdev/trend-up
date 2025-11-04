const { Comment, Reaction, Post, Karma } = require('../models');
const { User } = require('../../auth/models');
const { logger } = require('../../../core/utils/logger');
const mongoose = require('mongoose');

class CommentService {
  constructor() {
    // Comment limits
    this.commentLimits = {
      maxLength: 500,
      maxRepliesPerComment: 50,
      maxNestingLevel: 2,
      dailyCommentLimit: 100,
      hourlyCommentLimit: 20
    };
  }

  // Create a new comment
  async createComment(userId, postId, content, parentCommentId = null) {
    try {
      // Validate content
      if (!content || content.trim().length === 0) {
        throw new Error('Comment content is required');
      }

      if (content.length > this.commentLimits.maxLength) {
        throw new Error(`Comment cannot exceed ${this.commentLimits.maxLength} characters`);
      }

      // Check comment limits
      await this.checkCommentLimits(userId);

      // If this is a reply, validate parent comment
      let level = 0;
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (!parentComment) {
          throw new Error('Parent comment not found');
        }

        if (parentComment.postId.toString() !== postId) {
          throw new Error('Parent comment does not belong to this post');
        }

        // Reddit-style threading: allow deeper nesting but flatten in the model
        level = parentComment.level + 1;
      }

      // Create the comment
      const comment = new Comment({
        userId: new mongoose.Types.ObjectId(userId),
        postId: new mongoose.Types.ObjectId(postId),
        parentCommentId: parentCommentId ? new mongoose.Types.ObjectId(parentCommentId) : null,
        content: content.trim(),
        level
      });

      await comment.save();

      // Update parent comment reply count if this is a reply
      if (parentCommentId) {
        await Comment.findByIdAndUpdate(
          parentCommentId,
          { $inc: { replyCount: 1 } }
        );
      }

      // Update post comment count
      await Post.findByIdAndUpdate(
        postId,
        { $inc: { commentCount: 1 } }
      );

      // Award karma for commenting
      try {
        const karmaService = require('./karma.service');
        await karmaService.handleCommentCreated(userId, comment._id);
      } catch (karmaError) {
        logger.error(`[ERROR] Failed to award karma for comment:`, karmaError);
      }

      // Populate the comment with user data
      await comment.populate('userId', 'name username avatar');

      logger.info(`[INFO] Comment created by user ${userId} on post ${postId}`);
      return comment;
    } catch (error) {
      logger.error(`[ERROR] Failed to create comment:`, error);
      throw error;
    }
  }

  // Get comments for a post with threading
  async getPostComments(postId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeReplies = true,
        level = 0
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Build query for top-level comments
      const query = {
        postId: new mongoose.Types.ObjectId(postId),
        isDeleted: false,
        status: 'approved',
        level: 0 // Always start with level 0 for Reddit-style threading
      };

      // If not including replies, only get top-level comments
      if (!includeReplies) {
        query.parentCommentId = null;
      }

      // Get top-level comments with replies using virtual populate
      const topLevelComments = await Comment.find(query)
        .populate('userId', 'name username avatar')
        .populate({
          path: 'replies',
          match: { isDeleted: false, status: 'approved' },
          options: { sort: { createdAt: 1 } },
          populate: {
            path: 'userId',
            select: 'name username avatar'
          }
        })
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();

      // If including replies, populate nested replies for level 1 comments
      if (includeReplies) {
        for (const comment of topLevelComments) {
          if (comment.replies && comment.replies.length > 0) {
            // Populate replies for level 1 comments (level 2)
            for (const reply of comment.replies) {
              // Get all level 2 replies that have this comment as parent
              // This includes both direct replies and flattened replies
              const nestedReplies = await Comment.find({
                parentCommentId: reply._id,
                isDeleted: false,
                status: 'approved',
                level: 2
              })
                .populate('userId', 'name username avatar')
                .sort({ createdAt: 1 })
                .lean();
              
              reply.replies = nestedReplies;
            }
          }
        }
        
        // Also get any additional level 2 replies that might be flattened siblings
        // These are level 2 comments that have the same parent as level 1 comments
        for (const comment of topLevelComments) {
          if (comment.replies && comment.replies.length > 0) {
            // Get all level 2 comments that are siblings of level 1 replies
            const level1Ids = comment.replies.map(reply => reply._id);
            const siblingReplies = await Comment.find({
              postId: new mongoose.Types.ObjectId(postId),
              parentCommentId: { $in: level1Ids },
              isDeleted: false,
              status: 'approved',
              level: 2,
              _id: { $nin: level1Ids } // Exclude the level 1 comments themselves
            })
              .populate('userId', 'name username avatar')
              .sort({ createdAt: 1 })
              .lean();
            
            // Add sibling replies to the appropriate level 1 comments
            siblingReplies.forEach(sibling => {
              const parentReply = comment.replies.find(reply => 
                reply._id.toString() === sibling.parentCommentId.toString()
              );
              if (parentReply) {
                if (!parentReply.replies) parentReply.replies = [];
                parentReply.replies.push(sibling);
              }
            });
          }
        }
      }

      // Get total count for pagination
      const totalCount = await Comment.countDocuments(query);

      return {
        comments: topLevelComments,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get post comments:`, error);
      throw error;
    }
  }

  // Get comment by ID with full details
  async getCommentById(commentId) {
    try {
      const comment = await Comment.findById(commentId)
        .populate('userId', 'name username avatar')
        .populate('postId', 'title content')
        .populate({
          path: 'parentCommentId',
          select: 'content userId',
          populate: {
            path: 'userId',
            select: 'name username'
          }
        })
        .lean();

      if (!comment) {
        throw new Error('Comment not found');
      }

      if (comment.isDeleted) {
        throw new Error('Comment has been deleted');
      }

      return comment;
    } catch (error) {
      logger.error(`[ERROR] Failed to get comment by ID:`, error);
      throw error;
    }
  }

  // Update a comment
  async updateComment(commentId, userId, content) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }

      if (comment.userId.toString() !== userId) {
        throw new Error('Not authorized to edit this comment');
      }

      if (comment.isDeleted) {
        throw new Error('Cannot edit deleted comment');
      }

      if (!content || content.trim().length === 0) {
        throw new Error('Comment content is required');
      }

      if (content.length > this.commentLimits.maxLength) {
        throw new Error(`Comment cannot exceed ${this.commentLimits.maxLength} characters`);
      }

      comment.content = content.trim();
      comment.isEdited = true;
      comment.editedAt = new Date();

      await comment.save();
      await comment.populate('userId', 'name username avatar');

      logger.info(`[INFO] Comment ${commentId} updated by user ${userId}`);
      return comment;
    } catch (error) {
      logger.error(`[ERROR] Failed to update comment:`, error);
      throw error;
    }
  }

  // Delete a comment (soft delete)
  async deleteComment(commentId, userId, isModerator = false) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }

      // Check authorization
      if (!isModerator && comment.userId.toString() !== userId) {
        throw new Error('Not authorized to delete this comment');
      }

      if (comment.isDeleted) {
        throw new Error('Comment already deleted');
      }

      // Soft delete the comment
      comment.isDeleted = true;
      comment.deletedAt = new Date();
      await comment.save();

      // Update parent comment reply count if this is a reply
      if (comment.parentCommentId) {
        await Comment.findByIdAndUpdate(
          comment.parentCommentId,
          { $inc: { replyCount: -1 } }
        );
      }

      // Update post comment count
      await Post.findByIdAndUpdate(
        comment.postId,
        { $inc: { commentCount: -1 } }
      );

      logger.info(`[INFO] Comment ${commentId} deleted by user ${userId}`);
      return { message: 'Comment deleted successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to delete comment:`, error);
      throw error;
    }
  }

  // Get comment replies
  async getCommentReplies(commentId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'asc'
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const replies = await Comment.find({
        parentCommentId: new mongoose.Types.ObjectId(commentId),
        isDeleted: false,
        status: 'approved'
      })
        .populate('userId', 'name username avatar')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await Comment.countDocuments({
        parentCommentId: new mongoose.Types.ObjectId(commentId),
        isDeleted: false,
        status: 'approved'
      });

      return {
        replies,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get comment replies:`, error);
      throw error;
    }
  }

  // Get user's comments
  async getUserComments(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const comments = await Comment.find({
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
        status: 'approved'
      })
        .populate('postId', 'title content')
        .populate('parentCommentId', 'content')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await Comment.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
        status: 'approved'
      });

      return {
        comments,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get user comments:`, error);
      throw error;
    }
  }

  // Flag a comment
  async flagComment(commentId, userId, reason) {
    try {
      const comment = await Comment.findById(commentId);
      
      if (!comment) {
        throw new Error('Comment not found');
      }

      if (comment.userId.toString() === userId) {
        throw new Error('Cannot flag your own comment');
      }

      // Update comment status to flagged
      comment.status = 'flagged';
      await comment.save();

      // TODO: Add to moderation queue
      // This would integrate with a moderation system

      logger.info(`[INFO] Comment ${commentId} flagged by user ${userId} for reason: ${reason}`);
      return { message: 'Comment flagged successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to flag comment:`, error);
      throw error;
    }
  }

  // Get comment statistics
  async getCommentStats(postId = null, userId = null) {
    try {
      const matchQuery = { isDeleted: false, status: 'approved' };
      
      if (postId) {
        matchQuery.postId = new mongoose.Types.ObjectId(postId);
      }
      
      if (userId) {
        matchQuery.userId = new mongoose.Types.ObjectId(userId);
      }

      const stats = await Comment.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalComments: { $sum: 1 },
            totalReplies: { $sum: '$replyCount' },
            totalReactions: { $sum: '$reactionsCount' },
            averageReactions: { $avg: '$reactionsCount' },
            averageReplies: { $avg: '$replyCount' }
          }
        }
      ]);

      return stats[0] || {
        totalComments: 0,
        totalReplies: 0,
        totalReactions: 0,
        averageReactions: 0,
        averageReplies: 0
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get comment stats:`, error);
      throw error;
    }
  }

  // Get trending comments (most reacted to)
  async getTrendingComments(limit = 10, timeframe = 7) {
    try {
      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);

      const trendingComments = await Comment.find({
        createdAt: { $gte: startDate },
        isDeleted: false,
        status: 'approved',
        reactionsCount: { $gt: 0 }
      })
        .populate('userId', 'name username avatar')
        .populate('postId', 'title')
        .sort({ reactionsCount: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      return trendingComments;
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending comments:`, error);
      throw error;
    }
  }

  // Check comment limits
  async checkCommentLimits(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Check daily comment limit
      const todayComments = await Comment.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: today },
        isDeleted: false
      });

      if (todayComments >= this.commentLimits.dailyCommentLimit) {
        throw new Error(`Daily comment limit of ${this.commentLimits.dailyCommentLimit} reached`);
      }

      // Check hourly comment limit
      const hourlyComments = await Comment.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: oneHourAgo },
        isDeleted: false
      });

      if (hourlyComments >= this.commentLimits.hourlyCommentLimit) {
        throw new Error(`Hourly comment limit of ${this.commentLimits.hourlyCommentLimit} reached`);
      }
    } catch (error) {
      logger.error(`[ERROR] Failed to check comment limits:`, error);
      throw error;
    }
  }

  // Search comments
  async searchComments(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        postId = null,
        userId = null
      } = options;

      const skip = (page - 1) * limit;
      const searchRegex = new RegExp(query, 'i');

      const matchQuery = {
        content: searchRegex,
        isDeleted: false,
        status: 'approved'
      };

      if (postId) {
        matchQuery.postId = new mongoose.Types.ObjectId(postId);
      }

      if (userId) {
        matchQuery.userId = new mongoose.Types.ObjectId(userId);
      }

      const comments = await Comment.find(matchQuery)
        .populate('userId', 'name username avatar')
        .populate('postId', 'title')
        .populate('parentCommentId', 'content')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await Comment.countDocuments(matchQuery);

      return {
        comments,
        query,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to search comments:`, error);
      throw error;
    }
  }

  // React to a comment
  async reactToComment(commentId, userId, reactionType) {
    try {
      // Check if comment exists
      const comment = await Comment.findOne({
        _id: commentId,
        isDeleted: false,
        status: 'approved',
      });

      if (!comment) {
        throw new Error('Comment not found');
      }

      // Check if user already reacted with this type
      const existingReaction = await Reaction.findOne({
        userId,
        commentId,
        reactionType,
      });

      if (existingReaction) {
        // Remove existing reaction (toggle off)
        await Reaction.findByIdAndDelete(existingReaction._id);
        
        logger.info(`[INFO] Reaction removed: ${reactionType} on comment ${commentId} by user ${userId}`);
        
        return { 
          message: 'Reaction removed',
          action: 'removed',
          reaction: null,
        };
      }

      // Create new reaction
      const reaction = new Reaction({
        userId,
        commentId,
        reactionType,
      });

      await reaction.save();

      // Populate user data
      await reaction.populate('userId', 'name username avatar karmaScore karmaLevel');

      logger.info(`[INFO] Reaction added: ${reactionType} on comment ${commentId} by user ${userId}`);

      return {
        message: 'Reaction added',
        action: 'added',
        reaction,
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to react to comment:`, error);
      throw error;
    }
  }

  // Get comment reactions
  async getCommentReactions(commentId, userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      // Check if comment exists
      const comment = await Comment.findOne({
        _id: commentId,
        isDeleted: false,
      });

      if (!comment) {
        throw new Error('Comment not found');
      }

      // Get reaction counts
      const reactionCounts = await Reaction.getCommentReactionCounts(commentId);

      // Get individual reactions with user data
      const reactions = await Reaction.find({ commentId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name username avatar karmaScore karmaLevel');

      const total = await Reaction.countDocuments({ commentId });

      // Get user's reactions if userId is provided
      let userReactions = [];
      if (userId) {
        userReactions = await Reaction.find({ commentId, userId }).select('reactionType');
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
    } catch (error) {
      logger.error(`[ERROR] Failed to get comment reactions:`, error);
      throw error;
    }
  }
}

module.exports = new CommentService();
