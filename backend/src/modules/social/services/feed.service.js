const { Feed, Post, User, Follow, Category, Topic, Hashtag, Karma } = require('../models');
const { logger } = require('../../../core/utils/logger');
const mongoose = require('mongoose');

class FeedService {
  constructor() {
    // Feed configuration
    this.feedConfig = {
      maxPostsPerFeed: 100,
      updateInterval: 60 * 60 * 1000, // 1 hour
      cacheExpiry: 30 * 60 * 1000, // 30 minutes
      batchSize: 50,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Scoring weights
    this.scoringWeights = {
      recency: 0.3,        // How recent the post is
      engagement: 0.25,    // Likes, comments, shares
      karma: 0.2,          // Author's karma level
      following: 0.15,     // Following relationship
      category: 0.05,      // Category relevance
      topic: 0.03,         // Topic relevance
      hashtag: 0.02,       // Hashtag relevance
    };

    // Feed types
    this.feedTypes = {
      FOLLOWING: 'following',
      TRENDING: 'trending',
      CATEGORY: 'category',
      TOPIC: 'topic',
      HASHTAG: 'hashtag',
      PERSONALIZED: 'personalized',
      DISCOVER: 'discover',
    };
  }

  // Get user's personalized feed
  async getUserFeed(userId, options = {}) {
    try {
      const {
        feedType = 'personalized',
        page = 1,
        limit = 20,
        categoryId = null,
        topicId = null,
        hashtagId = null,
        forceRefresh = false
      } = options;

      const skip = (page - 1) * limit;

      // Check if we have a cached feed
      let feed = await this.getCachedFeed(userId, feedType, { categoryId, topicId, hashtagId });

      // If no cached feed or force refresh, generate new feed
      if (!feed || forceRefresh || this.shouldUpdateFeed(feed)) {
        feed = await this.generateFeed(userId, feedType, { categoryId, topicId, hashtagId });
      }

      // Get posts for the requested page
      const posts = await this.getFeedPosts(feed, skip, limit);

      return {
        posts,
        feedType,
        pagination: {
          page,
          limit,
          total: feed.posts.length,
          pages: Math.ceil(feed.posts.length / limit),
          hasMore: skip + limit < feed.posts.length
        },
        lastUpdated: feed.lastUpdated,
        nextUpdate: feed.nextUpdate
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get user feed:`, error);
      throw error;
    }
  }

  // Generate a new feed for a user
  async generateFeed(userId, feedType, filters = {}) {
    try {
      logger.info(`[INFO] Generating ${feedType} feed for user ${userId}`);

      let posts = [];
      let feed;

      switch (feedType) {
        case this.feedTypes.FOLLOWING:
          posts = await this.getFollowingFeed(userId);
          break;
        case this.feedTypes.TRENDING:
          posts = await this.getTrendingFeed(userId);
          break;
        case this.feedTypes.CATEGORY:
          posts = await this.getCategoryFeed(userId, filters.categoryId);
          break;
        case this.feedTypes.TOPIC:
          posts = await this.getTopicFeed(userId, filters.topicId);
          break;
        case this.feedTypes.HASHTAG:
          posts = await this.getHashtagFeed(userId, filters.hashtagId);
          break;
        case this.feedTypes.PERSONALIZED:
          posts = await this.getPersonalizedFeed(userId);
          break;
        case this.feedTypes.DISCOVER:
          posts = await this.getDiscoverFeed(userId);
          break;
        default:
          posts = await this.getPersonalizedFeed(userId);
      }

      // Score and rank posts
      const scoredPosts = await this.scorePosts(posts, userId);

      // Create or update feed
      feed = await this.createOrUpdateFeed(userId, feedType, scoredPosts, filters);

      logger.info(`[INFO] Generated ${feedType} feed with ${scoredPosts.length} posts for user ${userId}`);
      return feed;
    } catch (error) {
      logger.error(`[ERROR] Failed to generate feed:`, error);
      throw error;
    }
  }

  // Get following feed (posts from users you follow)
  async getFollowingFeed(userId) {
    try {
      // Get users that the current user follows
      const following = await Follow.find({ 
        followerId: new mongoose.Types.ObjectId(userId),
        status: 'ACTIVE'
      }).select('followingId');

      const followingIds = following.map(f => f.followingId);

      if (followingIds.length === 0) {
        return [];
      }

      // Get posts from followed users
      const posts = await Post.find({
        userId: { $in: followingIds },
        isDeleted: false,
        status: 'published',
        createdAt: { $gte: new Date(Date.now() - this.feedConfig.maxAge) }
      })
        .populate('userId', 'name username avatar karma')
        .populate('categoryId', 'name slug')
        .populate('topicId', 'name slug')
        .sort({ createdAt: -1 })
        .limit(this.feedConfig.maxPostsPerFeed)
        .lean();

      return posts;
    } catch (error) {
      logger.error(`[ERROR] Failed to get following feed:`, error);
      throw error;
    }
  }

  // Get trending feed (most popular posts)
  async getTrendingFeed(userId) {
    try {
      const posts = await Post.find({
        isDeleted: false,
        status: 'published',
        createdAt: { $gte: new Date(Date.now() - this.feedConfig.maxAge) }
      })
        .populate('userId', 'name username avatar karma')
        .populate('categoryId', 'name slug')
        .populate('topicId', 'name slug')
        .sort({ 
          trendingScore: -1,
          reactionsCount: -1,
          commentCount: -1,
          createdAt: -1
        })
        .limit(this.feedConfig.maxPostsPerFeed)
        .lean();

      return posts;
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending feed:`, error);
      throw error;
    }
  }

  // Get category feed (posts from specific category)
  async getCategoryFeed(userId, categoryId) {
    try {
      if (!categoryId) {
        return [];
      }

      const posts = await Post.find({
        categoryId: new mongoose.Types.ObjectId(categoryId),
        isDeleted: false,
        status: 'published',
        createdAt: { $gte: new Date(Date.now() - this.feedConfig.maxAge) }
      })
        .populate('userId', 'name username avatar karma')
        .populate('categoryId', 'name slug')
        .populate('topicId', 'name slug')
        .sort({ createdAt: -1 })
        .limit(this.feedConfig.maxPostsPerFeed)
        .lean();

      return posts;
    } catch (error) {
      logger.error(`[ERROR] Failed to get category feed:`, error);
      throw error;
    }
  }

  // Get topic feed (posts from specific topic)
  async getTopicFeed(userId, topicId) {
    try {
      if (!topicId) {
        return [];
      }

      const posts = await Post.find({
        topicId: new mongoose.Types.ObjectId(topicId),
        isDeleted: false,
        status: 'published',
        createdAt: { $gte: new Date(Date.now() - this.feedConfig.maxAge) }
      })
        .populate('userId', 'name username avatar karma')
        .populate('categoryId', 'name slug')
        .populate('topicId', 'name slug')
        .sort({ createdAt: -1 })
        .limit(this.feedConfig.maxPostsPerFeed)
        .lean();

      return posts;
    } catch (error) {
      logger.error(`[ERROR] Failed to get topic feed:`, error);
      throw error;
    }
  }

  // Get hashtag feed (posts with specific hashtag)
  async getHashtagFeed(userId, hashtagId) {
    try {
      if (!hashtagId) {
        return [];
      }

      const hashtag = await Hashtag.findById(hashtagId);
      if (!hashtag) {
        return [];
      }

      const posts = await Post.find({
        hashtags: hashtag.name,
        isDeleted: false,
        status: 'published',
        createdAt: { $gte: new Date(Date.now() - this.feedConfig.maxAge) }
      })
        .populate('userId', 'name username avatar karma')
        .populate('categoryId', 'name slug')
        .populate('topicId', 'name slug')
        .sort({ createdAt: -1 })
        .limit(this.feedConfig.maxPostsPerFeed)
        .lean();

      return posts;
    } catch (error) {
      logger.error(`[ERROR] Failed to get hashtag feed:`, error);
      throw error;
    }
  }

  // Get personalized feed (algorithmic mix)
  async getPersonalizedFeed(userId) {
    try {
      // Get user's interests and preferences
      const userInterests = await this.getUserInterests(userId);
      
      // Get posts from multiple sources
      const followingPosts = await this.getFollowingFeed(userId);
      const trendingPosts = await this.getTrendingFeed(userId);
      const categoryPosts = await this.getCategoryBasedPosts(userId, userInterests.categories);
      const topicPosts = await this.getTopicBasedPosts(userId, userInterests.topics);

      // Combine and deduplicate posts
      const allPosts = this.combineAndDeduplicatePosts([
        ...followingPosts,
        ...trendingPosts,
        ...categoryPosts,
        ...topicPosts
      ]);

      return allPosts.slice(0, this.feedConfig.maxPostsPerFeed);
    } catch (error) {
      logger.error(`[ERROR] Failed to get personalized feed:`, error);
      throw error;
    }
  }

  // Get discover feed (new content for exploration)
  async getDiscoverFeed(userId) {
    try {
      // Get user's interests to avoid showing similar content
      const userInterests = await this.getUserInterests(userId);
      
      // Get posts from categories/topics user hasn't engaged with much
      const discoverPosts = await Post.find({
        isDeleted: false,
        status: 'published',
        createdAt: { $gte: new Date(Date.now() - this.feedConfig.maxAge) },
        categoryId: { $nin: userInterests.categories },
        topicId: { $nin: userInterests.topics }
      })
        .populate('userId', 'name username avatar karma')
        .populate('categoryId', 'name slug')
        .populate('topicId', 'name slug')
        .sort({ 
          reactionsCount: -1,
          commentCount: -1,
          createdAt: -1
        })
        .limit(this.feedConfig.maxPostsPerFeed)
        .lean();

      return discoverPosts;
    } catch (error) {
      logger.error(`[ERROR] Failed to get discover feed:`, error);
      throw error;
    }
  }

  // Score posts based on various factors
  async scorePosts(posts, userId) {
    try {
      const scoredPosts = [];

      for (const post of posts) {
        const score = await this.calculatePostScore(post, userId);
        scoredPosts.push({
          postId: post._id,
          score,
          reason: this.getScoreReason(post, score)
        });
      }

      // Sort by score (highest first)
      scoredPosts.sort((a, b) => b.score - a.score);

      return scoredPosts;
    } catch (error) {
      logger.error(`[ERROR] Failed to score posts:`, error);
      throw error;
    }
  }

  // Calculate score for a single post
  async calculatePostScore(post, userId) {
    try {
      let score = 0;

      // Recency score (0-1)
      const ageInHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 1 - (ageInHours / (24 * 7))); // Decay over 7 days
      score += recencyScore * this.scoringWeights.recency;

      // Engagement score (0-1)
      const totalEngagement = post.reactionsCount + post.commentCount + post.shareCount;
      const engagementScore = Math.min(1, totalEngagement / 100); // Normalize to 100 engagements
      score += engagementScore * this.scoringWeights.engagement;

      // Karma score (0-1)
      const karmaScore = this.getKarmaScore(post.userId?.karma?.level || 'NEWBIE');
      score += karmaScore * this.scoringWeights.karma;

      // Following score (0-1)
      const followingScore = await this.getFollowingScore(post.userId._id, userId);
      score += followingScore * this.scoringWeights.following;

      // Category relevance score (0-1)
      const categoryScore = await this.getCategoryRelevanceScore(post.categoryId, userId);
      score += categoryScore * this.scoringWeights.category;

      // Topic relevance score (0-1)
      const topicScore = await this.getTopicRelevanceScore(post.topicId, userId);
      score += topicScore * this.scoringWeights.topic;

      // Hashtag relevance score (0-1)
      const hashtagScore = await this.getHashtagRelevanceScore(post.hashtags, userId);
      score += hashtagScore * this.scoringWeights.hashtag;

      return Math.min(1, Math.max(0, score)); // Clamp between 0 and 1
    } catch (error) {
      logger.error(`[ERROR] Failed to calculate post score:`, error);
      return 0;
    }
  }

  // Get karma score based on level
  getKarmaScore(karmaLevel) {
    const karmaScores = {
      'NEWBIE': 0.1,
      'EXPLORER': 0.2,
      'CONTRIBUTOR': 0.4,
      'INFLUENCER': 0.6,
      'EXPERT': 0.8,
      'LEGEND': 0.9,
      'TITAN': 1.0
    };
    return karmaScores[karmaLevel] || 0.1;
  }

  // Get following score
  async getFollowingScore(authorId, userId) {
    try {
      if (authorId.toString() === userId.toString()) {
        return 1.0; // Own posts get highest score
      }

      const follow = await Follow.findOne({
        followerId: new mongoose.Types.ObjectId(userId),
        followingId: new mongoose.Types.ObjectId(authorId),
        status: 'ACTIVE'
      });

      return follow ? 1.0 : 0.0;
    } catch (error) {
      return 0.0;
    }
  }

  // Get category relevance score
  async getCategoryRelevanceScore(categoryId, userId) {
    try {
      if (!categoryId) return 0.0;

      // This would be based on user's interaction history with this category
      // For now, return a base score
      return 0.5;
    } catch (error) {
      return 0.0;
    }
  }

  // Get topic relevance score
  async getTopicRelevanceScore(topicId, userId) {
    try {
      if (!topicId) return 0.0;

      // This would be based on user's interaction history with this topic
      // For now, return a base score
      return 0.5;
    } catch (error) {
      return 0.0;
    }
  }

  // Get hashtag relevance score
  async getHashtagRelevanceScore(hashtags, userId) {
    try {
      if (!hashtags || hashtags.length === 0) return 0.0;

      // This would be based on user's interaction history with these hashtags
      // For now, return a base score
      return 0.3;
    } catch (error) {
      return 0.0;
    }
  }

  // Get score reason
  getScoreReason(post, score) {
    if (score > 0.8) return 'high_engagement';
    if (score > 0.6) return 'trending';
    if (score > 0.4) return 'following';
    if (score > 0.2) return 'category';
    return 'discover';
  }

  // Get user interests
  async getUserInterests(userId) {
    try {
      // Get user's interaction history to determine interests
      const userPosts = await Post.find({ userId: new mongoose.Types.ObjectId(userId) })
        .select('categoryId topicId hashtags')
        .lean();

      const categories = [...new Set(userPosts.map(p => p.categoryId).filter(Boolean))];
      const topics = [...new Set(userPosts.map(p => p.topicId).filter(Boolean))];
      const hashtags = [...new Set(userPosts.flatMap(p => p.hashtags || []))];

      return { categories, topics, hashtags };
    } catch (error) {
      logger.error(`[ERROR] Failed to get user interests:`, error);
      return { categories: [], topics: [], hashtags: [] };
    }
  }

  // Get category-based posts
  async getCategoryBasedPosts(userId, categoryIds) {
    try {
      if (categoryIds.length === 0) return [];

      const posts = await Post.find({
        categoryId: { $in: categoryIds },
        isDeleted: false,
        status: 'published',
        createdAt: { $gte: new Date(Date.now() - this.feedConfig.maxAge) }
      })
        .populate('userId', 'name username avatar karma')
        .populate('categoryId', 'name slug')
        .populate('topicId', 'name slug')
        .sort({ createdAt: -1 })
        .limit(this.feedConfig.maxPostsPerFeed / 2)
        .lean();

      return posts;
    } catch (error) {
      logger.error(`[ERROR] Failed to get category-based posts:`, error);
      return [];
    }
  }

  // Get topic-based posts
  async getTopicBasedPosts(userId, topicIds) {
    try {
      if (topicIds.length === 0) return [];

      const posts = await Post.find({
        topicId: { $in: topicIds },
        isDeleted: false,
        status: 'published',
        createdAt: { $gte: new Date(Date.now() - this.feedConfig.maxAge) }
      })
        .populate('userId', 'name username avatar karma')
        .populate('categoryId', 'name slug')
        .populate('topicId', 'name slug')
        .sort({ createdAt: -1 })
        .limit(this.feedConfig.maxPostsPerFeed / 2)
        .lean();

      return posts;
    } catch (error) {
      logger.error(`[ERROR] Failed to get topic-based posts:`, error);
      return [];
    }
  }

  // Combine and deduplicate posts
  combineAndDeduplicatePosts(postArrays) {
    const postMap = new Map();
    
    postArrays.forEach(posts => {
      posts.forEach(post => {
        if (!postMap.has(post._id.toString())) {
          postMap.set(post._id.toString(), post);
        }
      });
    });

    return Array.from(postMap.values());
  }

  // Get cached feed
  async getCachedFeed(userId, feedType, filters = {}) {
    try {
      const feed = await Feed.getFeedByType(userId, feedType, filters);
      
      if (feed && !this.shouldUpdateFeed(feed)) {
        return feed;
      }
      
      return null;
    } catch (error) {
      logger.error(`[ERROR] Failed to get cached feed:`, error);
      return null;
    }
  }

  // Check if feed should be updated
  shouldUpdateFeed(feed) {
    return feed.nextUpdate <= new Date();
  }

  // Create or update feed
  async createOrUpdateFeed(userId, feedType, scoredPosts, filters = {}) {
    try {
      const feedData = {
        userId: new mongoose.Types.ObjectId(userId),
        feedType,
        categoryId: filters.categoryId ? new mongoose.Types.ObjectId(filters.categoryId) : null,
        topicId: filters.topicId ? new mongoose.Types.ObjectId(filters.topicId) : null,
        hashtagId: filters.hashtagId ? new mongoose.Types.ObjectId(filters.hashtagId) : null,
        posts: scoredPosts,
        lastUpdated: new Date(),
        nextUpdate: new Date(Date.now() + this.feedConfig.updateInterval)
      };

      const feed = await Feed.findOneAndUpdate(
        {
          userId: new mongoose.Types.ObjectId(userId),
          feedType,
          categoryId: filters.categoryId ? new mongoose.Types.ObjectId(filters.categoryId) : null,
          topicId: filters.topicId ? new mongoose.Types.ObjectId(filters.topicId) : null,
          hashtagId: filters.hashtagId ? new mongoose.Types.ObjectId(filters.hashtagId) : null
        },
        feedData,
        { upsert: true, new: true }
      );

      return feed;
    } catch (error) {
      logger.error(`[ERROR] Failed to create/update feed:`, error);
      throw error;
    }
  }

  // Get feed posts
  async getFeedPosts(feed, skip, limit) {
    try {
      const postIds = feed.posts.slice(skip, skip + limit).map(p => p.postId);
      
      const posts = await Post.find({ _id: { $in: postIds } })
        .populate('userId', 'name username avatar karma')
        .populate('categoryId', 'name slug')
        .populate('topicId', 'name slug')
        .lean();

      // Sort posts according to feed order
      const sortedPosts = postIds.map(id => 
        posts.find(post => post._id.toString() === id.toString())
      ).filter(Boolean);

      return sortedPosts;
    } catch (error) {
      logger.error(`[ERROR] Failed to get feed posts:`, error);
      throw error;
    }
  }

  // Update feed when new post is created
  async updateFeedOnNewPost(postId, userId, postData) {
    try {
      // Get all users who should see this post
      const targetUsers = await this.getTargetUsersForPost(postData);

      // Update feeds for each user
      for (const targetUserId of targetUsers) {
        await this.addPostToFeed(targetUserId, postId, postData);
      }

      logger.info(`[INFO] Updated feeds for ${targetUsers.length} users with new post ${postId}`);
    } catch (error) {
      logger.error(`[ERROR] Failed to update feed on new post:`, error);
    }
  }

  // Get target users for a post
  async getTargetUsersForPost(postData) {
    try {
      const targetUsers = new Set();

      // Add followers of the post author
      const followers = await Follow.find({
        followingId: new mongoose.Types.ObjectId(postData.userId),
        status: 'ACTIVE'
      }).select('followerId');

      followers.forEach(f => targetUsers.add(f.followerId.toString()));

      // Add users interested in the category
      if (postData.categoryId) {
        const categoryFollowers = await this.getCategoryFollowers(postData.categoryId);
        categoryFollowers.forEach(id => targetUsers.add(id.toString()));
      }

      // Add users interested in the topic
      if (postData.topicId) {
        const topicFollowers = await this.getTopicFollowers(postData.topicId);
        topicFollowers.forEach(id => targetUsers.add(id.toString()));
      }

      return Array.from(targetUsers);
    } catch (error) {
      logger.error(`[ERROR] Failed to get target users for post:`, error);
      return [];
    }
  }

  // Add post to user's feed
  async addPostToFeed(userId, postId, postData) {
    try {
      const score = await this.calculatePostScore(postData, userId);
      const reason = this.getScoreReason(postData, score);

      // Update personalized feed
      const personalizedFeed = await Feed.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        feedType: 'personalized'
      });

      if (personalizedFeed) {
        personalizedFeed.addPost(postId, score, reason);
        await personalizedFeed.save();
      }

      // Update following feed if user follows the author
      const isFollowing = await Follow.findOne({
        followerId: new mongoose.Types.ObjectId(userId),
        followingId: new mongoose.Types.ObjectId(postData.userId),
        status: 'ACTIVE'
      });

      if (isFollowing) {
        const followingFeed = await Feed.findOne({
          userId: new mongoose.Types.ObjectId(userId),
          feedType: 'following'
        });

        if (followingFeed) {
          followingFeed.addPost(postId, score, 'following');
          await followingFeed.save();
        }
      }
    } catch (error) {
      logger.error(`[ERROR] Failed to add post to feed:`, error);
    }
  }

  // Get category followers
  async getCategoryFollowers(categoryId) {
    try {
      // This would be implemented with a CategoryFollow model
      // For now, return empty array
      return [];
    } catch (error) {
      return [];
    }
  }

  // Get topic followers
  async getTopicFollowers(topicId) {
    try {
      // This would be implemented with a TopicFollow model
      // For now, return empty array
      return [];
    } catch (error) {
      return [];
    }
  }

  // Get feed statistics
  async getFeedStats() {
    try {
      const stats = await Feed.getFeedStats();
      return stats[0] || {
        totalFeeds: 0,
        activeFeeds: 0,
        avgPostsPerFeed: 0,
        avgScore: 0,
        avgDiversityScore: 0
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get feed stats:`, error);
      throw error;
    }
  }

  // Update feeds that need refreshing
  async updateStaleFeeds() {
    try {
      const staleFeeds = await Feed.getFeedsToUpdate(this.feedConfig.batchSize);
      
      for (const feed of staleFeeds) {
        try {
          await this.generateFeed(feed.userId, feed.feedType, {
            categoryId: feed.categoryId,
            topicId: feed.topicId,
            hashtagId: feed.hashtagId
          });
        } catch (error) {
          logger.error(`[ERROR] Failed to update feed ${feed._id}:`, error);
        }
      }

      logger.info(`[INFO] Updated ${staleFeeds.length} stale feeds`);
      return { updated: staleFeeds.length };
    } catch (error) {
      logger.error(`[ERROR] Failed to update stale feeds:`, error);
      throw error;
    }
  }
}

module.exports = new FeedService();
