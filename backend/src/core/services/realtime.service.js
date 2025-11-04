/**
 * Real-time Event Service
 * Handles real-time events and notifications
 */

// const socketService = require('./socket.service'); // Temporarily disabled
const redisService = require('./redis.service');
const { logger } = require('../utils/logger');

class RealtimeService {
  constructor() {
    this.eventHandlers = new Map();
    this.setupEventHandlers();
  }

  /**
   * Initialize real-time service
   */
  async initialize() {
    try {
      // Don't initialize Redis here - it's already initialized in server.js
      // Just verify Redis is available
      const client = redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available. Make sure Redis is initialized first.');
      }
      logger.info('[RealtimeService] Initialized successfully');
    } catch (error) {
      logger.error('[RealtimeService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    // Post events
    this.eventHandlers.set('post:created', this.handlePostCreated.bind(this));
    this.eventHandlers.set('post:updated', this.handlePostUpdated.bind(this));
    this.eventHandlers.set('post:deleted', this.handlePostDeleted.bind(this));
    this.eventHandlers.set('post:liked', this.handlePostLiked.bind(this));
    this.eventHandlers.set('post:unliked', this.handlePostUnliked.bind(this));

    // Comment events
    this.eventHandlers.set('comment:created', this.handleCommentCreated.bind(this));
    this.eventHandlers.set('comment:updated', this.handleCommentUpdated.bind(this));
    this.eventHandlers.set('comment:deleted', this.handleCommentDeleted.bind(this));
    this.eventHandlers.set('comment:liked', this.handleCommentLiked.bind(this));

    // Reaction events
    this.eventHandlers.set('reaction:added', this.handleReactionAdded.bind(this));
    this.eventHandlers.set('reaction:removed', this.handleReactionRemoved.bind(this));

    // Karma events
    this.eventHandlers.set('karma:earned', this.handleKarmaEarned.bind(this));
    this.eventHandlers.set('karma:deducted', this.handleKarmaDeducted.bind(this));
    this.eventHandlers.set('level:up', this.handleLevelUp.bind(this));
    this.eventHandlers.set('badge:earned', this.handleBadgeEarned.bind(this));

    // Follow events
    this.eventHandlers.set('user:followed', this.handleUserFollowed.bind(this));
    this.eventHandlers.set('user:unfollowed', this.handleUserUnfollowed.bind(this));

    // Poll events
    this.eventHandlers.set('poll:created', this.handlePollCreated.bind(this));
    this.eventHandlers.set('poll:voted', this.handlePollVoted.bind(this));
    this.eventHandlers.set('poll:expired', this.handlePollExpired.bind(this));

    // Prediction events
    this.eventHandlers.set('prediction:created', this.handlePredictionCreated.bind(this));
    this.eventHandlers.set('prediction:staked', this.handlePredictionStaked.bind(this));
    this.eventHandlers.set('prediction:resolved', this.handlePredictionResolved.bind(this));

    // Feed events
    this.eventHandlers.set('feed:updated', this.handleFeedUpdated.bind(this));
    this.eventHandlers.set('trending:updated', this.handleTrendingUpdated.bind(this));
  }

  /**
   * Emit real-time event
   */
  async emitEvent(eventType, data, options = {}) {
    try {
      const handler = this.eventHandlers.get(eventType);
      if (handler) {
        await handler(data, options);
      } else {
        logger.warn(`[RealtimeService] No handler found for event: ${eventType}`);
      }
    } catch (error) {
      logger.error(`[RealtimeService] Error emitting event ${eventType}:`, error);
    }
  }

  // ==================== POST EVENT HANDLERS ====================

  async handlePostCreated(data, options = {}) {
    const { post, author } = data;
    
    // Emit to followers
    await socketService.emitToFollowers(author._id, socketService.eventTypes.POST_CREATED, {
      post,
      author: {
        _id: author._id,
        username: author.username,
        avatar: author.avatar
      }
    });

    // Emit to category room
    if (post.category) {
      await socketService.emitToRoom(`category:${post.category}`, socketService.eventTypes.POST_CREATED, {
        post,
        author: {
          _id: author._id,
          username: author.username,
          avatar: author.avatar
        }
      });
    }

    // Emit to hashtag rooms
    if (post.hashtags && post.hashtags.length > 0) {
      for (const hashtag of post.hashtags) {
        await socketService.emitToRoom(`hashtag:${hashtag}`, socketService.eventTypes.POST_CREATED, {
          post,
          author: {
            _id: author._id,
            username: author.username,
            avatar: author.avatar
          }
        });
      }
    }

    // Cache post for real-time updates
    await redisService.cache(`post:${post._id}:realtime`, {
      post,
      author,
      createdAt: new Date()
    }, 3600); // 1 hour

    logger.debug(`[RealtimeService] Post created event emitted for post ${post._id}`);
  }

  async handlePostUpdated(data, options = {}) {
    const { post, author } = data;
    
    // Emit to post room
    await socketService.emitToRoom(`post:${post._id}`, socketService.eventTypes.POST_UPDATED, {
      post,
      author: {
        _id: author._id,
        username: author.username,
        avatar: author.avatar
      }
    });

    // Update cache
    await redisService.cache(`post:${post._id}:realtime`, {
      post,
      author,
      updatedAt: new Date()
    }, 3600);

    logger.debug(`[RealtimeService] Post updated event emitted for post ${post._id}`);
  }

  async handlePostDeleted(data, options = {}) {
    const { postId, authorId } = data;
    
    // Emit to post room
    await socketService.emitToRoom(`post:${postId}`, socketService.eventTypes.POST_DELETED, {
      postId,
      authorId
    });

    // Remove from cache
    await redisService.invalidate(`post:${postId}:realtime`);

    logger.debug(`[RealtimeService] Post deleted event emitted for post ${postId}`);
  }

  async handlePostLiked(data, options = {}) {
    const { post, user, likeCount } = data;
    
    // Emit to post room
    await socketService.emitToRoom(`post:${post._id}`, socketService.eventTypes.POST_LIKED, {
      postId: post._id,
      userId: user._id,
      username: user.username,
      likeCount
    });

    // Notify post author (if not the same user)
    if (post.userId.toString() !== user._id.toString()) {
      await socketService.emitToUser(post.userId, socketService.eventTypes.NOTIFICATION_RECEIVED, {
        type: 'post_liked',
        message: `${user.username} liked your post`,
        data: {
          postId: post._id,
          userId: user._id,
          username: user.username
        }
      });
    }

    logger.debug(`[RealtimeService] Post liked event emitted for post ${post._id}`);
  }

  async handlePostUnliked(data, options = {}) {
    const { post, user, likeCount } = data;
    
    // Emit to post room
    await socketService.emitToRoom(`post:${post._id}`, socketService.eventTypes.POST_UNLIKED, {
      postId: post._id,
      userId: user._id,
      likeCount
    });

    logger.debug(`[RealtimeService] Post unliked event emitted for post ${post._id}`);
  }

  // ==================== COMMENT EVENT HANDLERS ====================

  async handleCommentCreated(data, options = {}) {
    const { comment, post, author } = data;
    
    // Emit to post room
    await socketService.emitToRoom(`post:${post._id}`, socketService.eventTypes.COMMENT_CREATED, {
      comment,
      postId: post._id,
      author: {
        _id: author._id,
        username: author.username,
        avatar: author.avatar
      }
    });

    // Emit to post comments room
    await socketService.emitToRoom(`post:${post._id}:comments`, socketService.eventTypes.COMMENT_CREATED, {
      comment,
      postId: post._id,
      author: {
        _id: author._id,
        username: author.username,
        avatar: author.avatar
      }
    });

    // Notify post author (if not the same user)
    if (post.userId.toString() !== author._id.toString()) {
      await socketService.emitToUser(post.userId, socketService.eventTypes.NOTIFICATION_RECEIVED, {
        type: 'comment_created',
        message: `${author.username} commented on your post`,
        data: {
          postId: post._id,
          commentId: comment._id,
          userId: author._id,
          username: author.username
        }
      });
    }

    logger.debug(`[RealtimeService] Comment created event emitted for comment ${comment._id}`);
  }

  async handleCommentUpdated(data, options = {}) {
    const { comment, post } = data;
    
    // Emit to post room
    await socketService.emitToRoom(`post:${post._id}`, socketService.eventTypes.COMMENT_UPDATED, {
      comment,
      postId: post._id
    });

    logger.debug(`[RealtimeService] Comment updated event emitted for comment ${comment._id}`);
  }

  async handleCommentDeleted(data, options = {}) {
    const { commentId, postId } = data;
    
    // Emit to post room
    await socketService.emitToRoom(`post:${postId}`, socketService.eventTypes.COMMENT_DELETED, {
      commentId,
      postId
    });

    logger.debug(`[RealtimeService] Comment deleted event emitted for comment ${commentId}`);
  }

  async handleCommentLiked(data, options = {}) {
    const { comment, user, likeCount } = data;
    
    // Emit to post room
    await socketService.emitToRoom(`post:${comment.postId}`, socketService.eventTypes.COMMENT_LIKED, {
      commentId: comment._id,
      userId: user._id,
      username: user.username,
      likeCount
    });

    // Notify comment author (if not the same user)
    if (comment.userId.toString() !== user._id.toString()) {
      await socketService.emitToUser(comment.userId, socketService.eventTypes.NOTIFICATION_RECEIVED, {
        type: 'comment_liked',
        message: `${user.username} liked your comment`,
        data: {
          commentId: comment._id,
          userId: user._id,
          username: user.username
        }
      });
    }

    logger.debug(`[RealtimeService] Comment liked event emitted for comment ${comment._id}`);
  }

  // ==================== REACTION EVENT HANDLERS ====================

  async handleReactionAdded(data, options = {}) {
    const { reaction, user, target } = data;
    
    // Emit to appropriate room based on target type
    const room = target.type === 'post' ? `post:${target.id}` : `post:${target.postId}:comments`;
    
    await socketService.emitToRoom(room, socketService.eventTypes.REACTION_ADDED, {
      reaction,
      userId: user._id,
      username: user.username,
      targetType: target.type,
      targetId: target.id
    });

    // Notify target author (if not the same user)
    if (target.userId.toString() !== user._id.toString()) {
      await socketService.emitToUser(target.userId, socketService.eventTypes.NOTIFICATION_RECEIVED, {
        type: 'reaction_added',
        message: `${user.username} reacted to your ${target.type}`,
        data: {
          reaction: reaction.type,
          targetType: target.type,
          targetId: target.id,
          userId: user._id,
          username: user.username
        }
      });
    }

    logger.debug(`[RealtimeService] Reaction added event emitted for ${target.type} ${target.id}`);
  }

  async handleReactionRemoved(data, options = {}) {
    const { reaction, user, target } = data;
    
    // Emit to appropriate room
    const room = target.type === 'post' ? `post:${target.id}` : `post:${target.postId}:comments`;
    
    await socketService.emitToRoom(room, socketService.eventTypes.REACTION_REMOVED, {
      reaction,
      userId: user._id,
      username: user.username,
      targetType: target.type,
      targetId: target.id
    });

    logger.debug(`[RealtimeService] Reaction removed event emitted for ${target.type} ${target.id}`);
  }

  // ==================== KARMA EVENT HANDLERS ====================

  async handleKarmaEarned(data, options = {}) {
    const { user, amount, reason, totalKarma } = data;
    
    // Emit to user
    await socketService.emitToUser(user._id, socketService.eventTypes.KARMA_EARNED, {
      amount,
      reason,
      totalKarma,
      userId: user._id
    });

    // Cache karma update
    await redisService.cache(`user:${user._id}:karma`, {
      totalKarma,
      lastEarned: new Date(),
      reason
    }, 600); // 10 minutes

    logger.debug(`[RealtimeService] Karma earned event emitted for user ${user._id}`);
  }

  async handleKarmaDeducted(data, options = {}) {
    const { user, amount, reason, totalKarma } = data;
    
    // Emit to user
    await socketService.emitToUser(user._id, socketService.eventTypes.KARMA_DEDUCTED, {
      amount,
      reason,
      totalKarma,
      userId: user._id
    });

    logger.debug(`[RealtimeService] Karma deducted event emitted for user ${user._id}`);
  }

  async handleLevelUp(data, options = {}) {
    const { user, newLevel, previousLevel } = data;
    
    // Emit to user
    await socketService.emitToUser(user._id, socketService.eventTypes.LEVEL_UP, {
      newLevel,
      previousLevel,
      userId: user._id,
      username: user.username
    });

    // Emit to followers
    await socketService.emitToFollowers(user._id, socketService.eventTypes.LEVEL_UP, {
      newLevel,
      previousLevel,
      userId: user._id,
      username: user.username
    });

    logger.debug(`[RealtimeService] Level up event emitted for user ${user._id}`);
  }

  async handleBadgeEarned(data, options = {}) {
    const { user, badge } = data;
    
    // Emit to user
    await socketService.emitToUser(user._id, socketService.eventTypes.BADGE_EARNED, {
      badge,
      userId: user._id,
      username: user.username
    });

    // Emit to followers
    await socketService.emitToFollowers(user._id, socketService.eventTypes.BADGE_EARNED, {
      badge,
      userId: user._id,
      username: user.username
    });

    logger.debug(`[RealtimeService] Badge earned event emitted for user ${user._id}`);
  }

  // ==================== FOLLOW EVENT HANDLERS ====================

  async handleUserFollowed(data, options = {}) {
    const { follower, following } = data;
    
    // Emit to the user being followed
    await socketService.emitToUser(following._id, socketService.eventTypes.USER_FOLLOWED, {
      follower: {
        _id: follower._id,
        username: follower.username,
        avatar: follower.avatar
      },
      followingId: following._id
    });

    // Emit to followers of the follower (for activity feed)
    await socketService.emitToFollowers(follower._id, socketService.eventTypes.USER_FOLLOWED, {
      follower: {
        _id: follower._id,
        username: follower.username,
        avatar: follower.avatar
      },
      following: {
        _id: following._id,
        username: following.username,
        avatar: following.avatar
      }
    });

    logger.debug(`[RealtimeService] User followed event emitted: ${follower._id} -> ${following._id}`);
  }

  async handleUserUnfollowed(data, options = {}) {
    const { follower, following } = data;
    
    // Emit to the user being unfollowed
    await socketService.emitToUser(following._id, socketService.eventTypes.USER_UNFOLLOWED, {
      follower: {
        _id: follower._id,
        username: follower.username
      },
      followingId: following._id
    });

    logger.debug(`[RealtimeService] User unfollowed event emitted: ${follower._id} -> ${following._id}`);
  }

  // ==================== POLL EVENT HANDLERS ====================

  async handlePollCreated(data, options = {}) {
    const { poll, post, author } = data;
    
    // Emit to followers
    await socketService.emitToFollowers(author._id, socketService.eventTypes.POLL_CREATED, {
      poll,
      post,
      author: {
        _id: author._id,
        username: author.username,
        avatar: author.avatar
      }
    });

    // Emit to category room
    if (post.category) {
      await socketService.emitToRoom(`category:${post.category}`, socketService.eventTypes.POLL_CREATED, {
        poll,
        post,
        author: {
          _id: author._id,
          username: author.username,
          avatar: author.avatar
        }
      });
    }

    logger.debug(`[RealtimeService] Poll created event emitted for poll ${poll._id}`);
  }

  async handlePollVoted(data, options = {}) {
    const { poll, user, optionIndex, voteCount } = data;
    
    // Emit to post room
    await socketService.emitToRoom(`post:${poll.postId}`, socketService.eventTypes.POLL_VOTED, {
      pollId: poll._id,
      userId: user._id,
      username: user.username,
      optionIndex,
      voteCount
    });

    logger.debug(`[RealtimeService] Poll voted event emitted for poll ${poll._id}`);
  }

  async handlePollExpired(data, options = {}) {
    const { poll, results } = data;
    
    // Emit to post room
    await socketService.emitToRoom(`post:${poll.postId}`, socketService.eventTypes.POLL_EXPIRED, {
      pollId: poll._id,
      results
    });

    logger.debug(`[RealtimeService] Poll expired event emitted for poll ${poll._id}`);
  }

  // ==================== PREDICTION EVENT HANDLERS ====================

  async handlePredictionCreated(data, options = {}) {
    const { prediction, post, author } = data;
    
    // Emit to followers
    await socketService.emitToFollowers(author._id, socketService.eventTypes.PREDICTION_CREATED, {
      prediction,
      post,
      author: {
        _id: author._id,
        username: author.username,
        avatar: author.avatar
      }
    });

    logger.debug(`[RealtimeService] Prediction created event emitted for prediction ${prediction._id}`);
  }

  async handlePredictionStaked(data, options = {}) {
    const { prediction, user, stake, totalStake } = data;
    
    // Emit to post room
    await socketService.emitToRoom(`post:${prediction.postId}`, socketService.eventTypes.PREDICTION_STAKED, {
      predictionId: prediction._id,
      userId: user._id,
      username: user.username,
      stake,
      totalStake
    });

    logger.debug(`[RealtimeService] Prediction staked event emitted for prediction ${prediction._id}`);
  }

  async handlePredictionResolved(data, options = {}) {
    const { prediction, outcome, winners, losers } = data;
    
    // Emit to post room
    await socketService.emitToRoom(`post:${prediction.postId}`, socketService.eventTypes.PREDICTION_RESOLVED, {
      predictionId: prediction._id,
      outcome,
      winners,
      losers
    });

    // Notify all participants
    const allParticipants = [...winners, ...losers];
    for (const participant of allParticipants) {
      await socketService.emitToUser(participant.userId, socketService.eventTypes.PREDICTION_RESOLVED, {
        predictionId: prediction._id,
        outcome,
        isWinner: winners.some(w => w.userId.toString() === participant.userId.toString()),
        karmaChange: participant.karmaChange
      });
    }

    logger.debug(`[RealtimeService] Prediction resolved event emitted for prediction ${prediction._id}`);
  }

  // ==================== FEED EVENT HANDLERS ====================

  async handleFeedUpdated(data, options = {}) {
    const { userId, feedType, newPosts } = data;
    
    // Emit to user's personal room
    await socketService.emitToRoom(`user:${userId}`, socketService.eventTypes.FEED_UPDATED, {
      feedType,
      newPosts,
      userId
    });

    logger.debug(`[RealtimeService] Feed updated event emitted for user ${userId}`);
  }

  async handleTrendingUpdated(data, options = {}) {
    const { trendingPosts, category } = data;
    
    // Emit to general room
    await socketService.emitToRoom('general', socketService.eventTypes.TRENDING_UPDATED, {
      trendingPosts,
      category
    });

    // Emit to category room if specified
    if (category) {
      await socketService.emitToRoom(`category:${category}`, socketService.eventTypes.TRENDING_UPDATED, {
        trendingPosts,
        category
      });
    }

    logger.debug(`[RealtimeService] Trending updated event emitted`);
  }
}

// Create singleton instance
const realtimeService = new RealtimeService();

module.exports = realtimeService;
