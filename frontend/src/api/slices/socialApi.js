import { baseApi } from "../baseApi";

export const socialApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==========================================
    // POST ENDPOINTS
    // ==========================================
    
    // Get posts (feed)
    getPosts: builder.query({
      query: ({ page = 1, limit = 10, category, hashtag, userId } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (category) params.append('category', category);
        if (hashtag) params.append('hashtag', hashtag);
        if (userId) params.append('userId', userId);
        
        return `/social/posts?${params.toString()}`;
      },
      providesTags: (result) => [
        'Posts',
        ...(result?.data?.posts?.map(({ _id }) => ({ type: 'Posts', id: _id })) || [])
      ],
    }),

    // Get single post
    getPost: builder.query({
      query: (id) => `/social/posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Posts', id }],
    }),

    // Create post
    createPost: builder.mutation({
      query: (data) => {
        // If data contains files, use FormData
        if (data.mediaFiles && data.mediaFiles.length > 0) {
          const formData = new FormData();
          
          // Add post data
          Object.keys(data).forEach(key => {
            if (key !== 'mediaFiles') {
              if (Array.isArray(data[key])) {
                formData.append(key, JSON.stringify(data[key]));
              } else {
                formData.append(key, data[key]);
              }
            }
          });
          
          // Add media files
          data.mediaFiles.forEach((file, index) => {
            formData.append('media', file);
          });
          
          return {
            url: '/social/posts',
            method: 'POST',
            body: formData,
          };
        } else {
          // Regular JSON post
          return {
            url: '/social/posts',
            method: 'POST',
            body: data,
          };
        }
      },
      invalidatesTags: ['Posts', 'Feed'],
    }),

    // Update post
    updatePost: builder.mutation({
      query: ({ id, ...postData }) => ({
        url: `/social/posts/${id}`,
        method: 'PATCH',
        body: postData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Posts', id }],
    }),

    // Delete post
    deletePost: builder.mutation({
      query: (id) => ({
        url: `/social/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Posts', id }],
    }),

    // Get trending posts
    getTrendingPosts: builder.query({
      query: ({ timeframe = '24h', limit = 20 } = {}) => 
        `/social/posts/trending?timeframe=${timeframe}&limit=${limit}`,
      providesTags: ['Posts', 'Trending'],
    }),

    // Get user posts
    getUserPosts: builder.query({
      query: ({ userId, page = 1, limit = 10 } = {}) => 
        `/social/posts/user/${userId}?page=${page}&limit=${limit}`,
      providesTags: (result, error, { userId }) => [
        { type: 'Posts', id: `user-${userId}` }
      ],
    }),

    // Search posts
    searchPosts: builder.query({
      query: ({ q, page = 1, limit = 10 } = {}) => 
        `/social/posts/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
    }),

    // ==========================================
    // REACTION ENDPOINTS
    // ==========================================

    // React to post
    reactToPost: builder.mutation({
      query: ({ postId, reactionType }) => ({
        url: `/social/posts/${postId}/react`,
        method: 'POST',
        body: { reactionType },
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: 'Posts', id: postId },
        { type: 'Reactions', id: postId } // Only invalidate THIS post's reactions
      ],
    }),

    // Get post reactions
    getPostReactions: builder.query({
      query: (postId) => `/social/posts/${postId}/reactions`,
      providesTags: (result, error, postId) => [
        { type: 'Reactions', id: postId }
      ],
    }),

    // ==========================================
    // COMMENT ENDPOINTS
    // ==========================================

    // Get post comments
    getPostComments: builder.query({
      query: ({ postId, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = {}) => 
        `/social/comments/posts/${postId}?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      providesTags: (result, error, { postId }) => [
        { type: 'Comments', id: postId }
      ],
    }),

    // Create comment
    createComment: builder.mutation({
      query: ({ postId, content, parentCommentId }) => ({
        url: `/social/comments/posts/${postId}`,
        method: 'POST',
        body: { content, parentCommentId },
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: 'Comments', id: postId },
        { type: 'Posts', id: postId },
        'Posts' // Invalidate all posts to update feed
      ],
    }),

    // Update comment
    updateComment: builder.mutation({
      query: ({ commentId, content }) => ({
        url: `/social/comments/${commentId}`,
        method: 'PUT',
        body: { content },
      }),
      invalidatesTags: (result, error, { commentId }) => [
        { type: 'Comments', id: commentId }
      ],
    }),

    // Delete comment
    deleteComment: builder.mutation({
      query: (commentId) => ({
        url: `/social/comments/${commentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, commentId) => [
        { type: 'Comments', id: commentId }
      ],
    }),

    // React to comment
    reactToComment: builder.mutation({
      query: ({ commentId, reactionType }) => ({
        url: `/social/comments/${commentId}/react`,
        method: 'POST',
        body: { reactionType },
      }),
      invalidatesTags: (result, error, { commentId }) => [
        { type: 'Comments', id: commentId }
      ],
    }),

    // ==========================================
    // FEED ENDPOINTS
    // ==========================================

    // Get personalized feed (For You)
    getForYouFeed: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => 
        `/social/feed?page=${page}&limit=${limit}`,
      providesTags: ['Feed'],
    }),

    // Get following feed
    getFollowingFeed: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => 
        `/social/feed/following?page=${page}&limit=${limit}`,
      providesTags: ['Feed', 'Following'],
    }),

    // Get trending feed
    getTrendingFeed: builder.query({
      query: ({ page = 1, limit = 10, timeframe = '24h' } = {}) => 
        `/social/feed/trending?page=${page}&limit=${limit}&timeframe=${timeframe}`,
      providesTags: ['Feed', 'Trending'],
    }),

    // Get discover feed
    getDiscoverFeed: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => 
        `/social/feed/discover?page=${page}&limit=${limit}`,
      providesTags: ['Feed', 'Discover'],
    }),

    // Get category feed
    getCategoryFeed: builder.query({
      query: ({ categoryId, page = 1, limit = 10 } = {}) => 
        `/social/feed/category/${categoryId}?page=${page}&limit=${limit}`,
      providesTags: (result, error, { categoryId }) => [
        { type: 'Feed', id: `category-${categoryId}` }
      ],
    }),

    // Get hashtag feed
    getHashtagFeed: builder.query({
      query: ({ hashtagId, page = 1, limit = 10 } = {}) => 
        `/social/feed/hashtag/${hashtagId}?page=${page}&limit=${limit}`,
      providesTags: (result, error, { hashtagId }) => [
        { type: 'Feed', id: `hashtag-${hashtagId}` }
      ],
    }),

    // ==========================================
    // FOLLOW ENDPOINTS
    // ==========================================

    // Follow user
    followUser: builder.mutation({
      query: (userId) => ({
        url: `/social/follow/users/${userId}/follow`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'UserProfile', id: userId },
        { type: 'Followers', id: userId },
        'Following',
        'FollowSuggestions'
      ],
    }),

    // Unfollow user
    unfollowUser: builder.mutation({
      query: (userId) => ({
        url: `/social/follow/users/${userId}/follow`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, userId) => [
        { type: 'UserProfile', id: userId },
        { type: 'Followers', id: userId },
        'Following',
        'FollowSuggestions'
      ],
    }),

    // Check if following
    isFollowing: builder.query({
      query: (userId) => `/social/follow/users/${userId}/is-following`,
      providesTags: (result, error, userId) => [
        { type: 'Following', id: userId }
      ],
    }),

    // Get followers
    getFollowers: builder.query({
      query: ({ userId, limit = 20, offset = 0 } = {}) => 
        `/social/follow/users/${userId}/followers?limit=${limit}&offset=${offset}`,
      providesTags: (result, error, { userId }) => [
        { type: 'Followers', id: userId }
      ],
    }),

    // Get following
    getFollowing: builder.query({
      query: ({ userId, limit = 20, offset = 0 } = {}) => 
        `/social/follow/users/${userId}/following?limit=${limit}&offset=${offset}`,
      providesTags: (result, error, { userId }) => [
        { type: 'Following', id: userId }
      ],
    }),

    // Get follow suggestions
    getFollowSuggestions: builder.query({
      query: ({ limit = 10 } = {}) => `/social/follow/me/suggestions?limit=${limit}`,
      providesTags: ['FollowSuggestions'],
    }),

    // Search users
    searchUsers: builder.query({
      query: ({ q, limit = 20, offset = 0 } = {}) => 
        `/social/follow/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`,
      providesTags: ['UserSearch'],
    }),

    // Get user profile
    getUserProfile: builder.query({
      query: (userId) => `/social/follow/users/${userId}/profile`,
      providesTags: (result, error, userId) => [
        { type: 'UserProfile', id: userId }
      ],
    }),

    // Get follower stats
    getFollowerStats: builder.query({
      query: (userId) => `/social/follow/users/${userId}/follower-stats`,
      providesTags: (result, error, userId) => [
        { type: 'FollowerStats', id: userId }
      ],
    }),

    // Get following stats
    getFollowingStats: builder.query({
      query: (userId) => `/social/follow/users/${userId}/following-stats`,
      providesTags: (result, error, userId) => [
        { type: 'FollowingStats', id: userId }
      ],
    }),

    // ==========================================
    // KARMA ENDPOINTS
    // ==========================================

    // Get user karma
    getUserKarma: builder.query({
      query: (userId) => `/social/karma/users/${userId}`,
      providesTags: (result, error, userId) => [
        { type: 'Karma', id: userId }
      ],
    }),

    // Get karma leaderboard
    getKarmaLeaderboard: builder.query({
      query: ({ timeframe = 'all', limit = 50 } = {}) => 
        `/social/karma/leaderboard?timeframe=${timeframe}&limit=${limit}`,
      providesTags: ['KarmaLeaderboard'],
    }),

    // Get user badges
    getUserBadges: builder.query({
      query: (userId) => `/social/karma/users/${userId}/badges`,
      providesTags: (result, error, userId) => [
        { type: 'Badges', id: userId }
      ],
    }),

    // Get karma stats
    getKarmaStats: builder.query({
      query: () => '/social/karma/stats',
      providesTags: ['KarmaStats'],
    }),

    // Get users by level
    getUsersByLevel: builder.query({
      query: ({ level, limit = 50, offset = 0 } = {}) => 
        `/social/karma/users/level/${level}?limit=${limit}&offset=${offset}`,
      providesTags: (result, error, { level }) => [
        { type: 'UsersByLevel', id: level }
      ],
    }),

    // Get user karma history
    getUserKarmaHistory: builder.query({
      query: ({ userId, limit = 50, offset = 0 } = {}) => 
        `/social/karma/users/${userId}/history?limit=${limit}&offset=${offset}`,
      providesTags: (result, error, { userId }) => [
        { type: 'UserKarmaHistory', id: userId }
      ],
    }),

    // Get user unlocked reactions
    getUserUnlockedReactions: builder.query({
      query: (userId) => `/social/karma/users/${userId}/reactions`,
      providesTags: (result, error, userId) => [
        { type: 'UserReactions', id: userId }
      ],
    }),

    // Check if user can use reaction
    canUseReaction: builder.query({
      query: ({ userId, reactionType }) => 
        `/social/karma/users/${userId}/can-use-reaction?reactionType=${reactionType}`,
      providesTags: (result, error, { userId, reactionType }) => [
        { type: 'ReactionPermission', id: `${userId}-${reactionType}` }
      ],
    }),

    // Get user reaction weight
    getUserReactionWeight: builder.query({
      query: (userId) => `/social/karma/users/${userId}/reaction-weight`,
      providesTags: (result, error, userId) => [
        { type: 'UserReactionWeight', id: userId }
      ],
    }),

    // Get current user karma
    getMyKarma: builder.query({
      query: () => `/social/karma/me`,
      providesTags: ['MyKarma'],
    }),

    // Get current user badges
    getMyBadges: builder.query({
      query: () => `/social/karma/me/badges`,
      providesTags: ['MyBadges'],
    }),

    // Get current user unlocked reactions
    getMyUnlockedReactions: builder.query({
      query: () => `/social/karma/me/reactions`,
      providesTags: ['MyReactions'],
    }),

    // Get current user karma history
    getMyKarmaHistory: builder.query({
      query: ({ limit = 50, offset = 0 } = {}) => 
        `/social/karma/me/history?limit=${limit}&offset=${offset}`,
      providesTags: ['MyKarmaHistory'],
    }),

    // ==========================================
    // BADGE ENDPOINTS
    // ==========================================

    // Get all badges
    getAllBadges: builder.query({
      query: ({ active = true } = {}) => `/social/badges?active=${active}`,
      providesTags: ['Badges'],
    }),

    // Get badge stats
    getBadgeStats: builder.query({
      query: () => `/social/badges/stats`,
      providesTags: ['BadgeStats'],
    }),

    // Get badges by category
    getBadgesByCategory: builder.query({
      query: ({ category, active = true } = {}) => 
        `/social/badges/category/${category}?active=${active}`,
      providesTags: (result, error, { category }) => [
        { type: 'BadgesByCategory', id: category }
      ],
    }),

    // Get badges by rarity
    getBadgesByRarity: builder.query({
      query: ({ rarity, active = true } = {}) => 
        `/social/badges/rarity/${rarity}?active=${active}`,
      providesTags: (result, error, { rarity }) => [
        { type: 'BadgesByRarity', id: rarity }
      ],
    }),

    // Get badge by ID
    getBadgeById: builder.query({
      query: (badgeId) => `/social/badges/${badgeId}`,
      providesTags: (result, error, badgeId) => [
        { type: 'Badge', id: badgeId }
      ],
    }),

    // Get available badges for user
    getAvailableBadgesForUser: builder.query({
      query: (userId) => `/social/badges/users/${userId}/available`,
      providesTags: (result, error, userId) => [
        { type: 'AvailableBadges', id: userId }
      ],
    }),

    // Get user badge progress
    getUserBadgeProgress: builder.query({
      query: (userId) => `/social/badges/users/${userId}/progress`,
      providesTags: (result, error, userId) => [
        { type: 'UserBadgeProgress', id: userId }
      ],
    }),

    // Get current user available badges
    getMyAvailableBadges: builder.query({
      query: () => `/social/badges/me/available`,
      providesTags: ['MyAvailableBadges'],
    }),

    // Get current user badge progress
    getMyBadgeProgress: builder.query({
      query: () => `/social/badges/me/progress`,
      providesTags: ['MyBadgeProgress'],
    }),

    // ==========================================
    // MEDIA ENDPOINTS
    // ==========================================

    // Upload media
    uploadMedia: builder.mutation({
      query: (formData) => ({
        url: '/social/media/upload',
        method: 'POST',
        body: formData,
      }),
    }),

    // ==========================================
    // POLL ENDPOINTS
    // ==========================================

    // Vote on poll (post-based)
    voteOnPoll: builder.mutation({
      query: ({ postId, optionIndex }) => ({
        url: `/social/posts/${postId}/poll/vote`,
        method: 'POST',
        body: { optionIndex },
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: 'Posts', id: postId }
      ],
    }),

    // Get poll results (post-based)
    getPollResults: builder.query({
      query: (postId) => `/social/posts/${postId}/poll/results`,
      providesTags: (result, error, postId) => [
        { type: 'Posts', id: postId }
      ],
    }),

    // Remove vote from poll
    removeVoteFromPoll: builder.mutation({
      query: (pollId) => ({
        url: `/social/polls/${pollId}/vote`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, pollId) => [
        { type: 'Polls', id: pollId }
      ],
    }),

    // ==========================================
    // PREDICTION ENDPOINTS
    // ==========================================

    // Stake on prediction (post-based)
    stakeOnPrediction: builder.mutation({
      query: ({ postId, stake, agree }) => ({
        url: `/social/posts/${postId}/prediction/stake`,
        method: 'POST',
        body: { stake, agree },
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: 'Posts', id: postId }
      ],
    }),

    // Remove stake from prediction
    removeStakeFromPrediction: builder.mutation({
      query: (predictionId) => ({
        url: `/social/predictions/${predictionId}/stake`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, predictionId) => [
        { type: 'Predictions', id: predictionId }
      ],
    }),

    // Get prediction results (post-based)
    getPredictionResults: builder.query({
      query: (postId) => `/social/posts/${postId}/prediction/results`,
      providesTags: (result, error, postId) => [
        { type: 'Posts', id: postId }
      ],
    }),

    // ==========================================
    // CATEGORY & HASHTAG ENDPOINTS
    // ==========================================

    // Get all categories
    getCategories: builder.query({
      query: () => '/social/categories',
      providesTags: ['Categories'],
    }),

    // Get trending hashtags
    getTrendingHashtags: builder.query({
      query: ({ limit = 20 } = {}) => `/social/hashtags/trending?limit=${limit}`,
      providesTags: ['Hashtags'],
    }),

    // Get popular hashtags
    getPopularHashtags: builder.query({
      query: ({ limit = 20 } = {}) => `/social/hashtags/popular?limit=${limit}`,
      providesTags: ['Hashtags'],
    }),

    // ==========================================
    // NOTIFICATION ENDPOINTS
    // ==========================================

    // Get user notifications
    getNotifications: builder.query({
      query: ({ limit = 50, offset = 0, unreadOnly = false } = {}) => 
        `/social/notifications?limit=${limit}&offset=${offset}&unreadOnly=${unreadOnly}`,
      providesTags: ['Notifications'],
    }),

    // Get unread count
    getUnreadCount: builder.query({
      query: () => '/social/notifications/unread-count',
      providesTags: ['NotificationCount'],
    }),

    // Mark notification as read
    markNotificationAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `/social/notifications/${notificationId}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Notifications', 'NotificationCount'],
    }),

    // Mark all as read
    markAllNotificationsAsRead: builder.mutation({
      query: () => ({
        url: '/social/notifications/mark-all-read',
        method: 'POST',
      }),
      invalidatesTags: ['Notifications', 'NotificationCount'],
    }),

    // Delete notification
    deleteNotification: builder.mutation({
      query: (notificationId) => ({
        url: `/social/notifications/${notificationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications', 'NotificationCount'],
    }),
  }),
});

export const {
  // Post hooks
  useGetPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetTrendingPostsQuery,
  useGetUserPostsQuery,
  useSearchPostsQuery,

  // Reaction hooks
  useReactToPostMutation,
  useGetPostReactionsQuery,

  // Comment hooks
  useGetPostCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useReactToCommentMutation,

  // Feed hooks
  useGetForYouFeedQuery,
  useGetFollowingFeedQuery,
  useGetTrendingFeedQuery,
  useGetDiscoverFeedQuery,
  useGetCategoryFeedQuery,
  useGetHashtagFeedQuery,

  // Follow hooks
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetFollowSuggestionsQuery,

  // Karma hooks
  useGetUserKarmaQuery,
  useGetKarmaLeaderboardQuery,
  useGetUserBadgesQuery,
  useGetKarmaStatsQuery,
  useGetUsersByLevelQuery,
  useGetUserKarmaHistoryQuery,
  useGetUserUnlockedReactionsQuery,
  useCanUseReactionQuery,
  useGetUserReactionWeightQuery,
  useGetMyKarmaQuery,
  useGetMyBadgesQuery,
  useGetMyUnlockedReactionsQuery,
  useGetMyKarmaHistoryQuery,

  // Badge hooks
  useGetAllBadgesQuery,
  useGetBadgeStatsQuery,
  useGetBadgesByCategoryQuery,
  useGetBadgesByRarityQuery,
  useGetBadgeByIdQuery,
  useGetAvailableBadgesForUserQuery,
  useGetUserBadgeProgressQuery,
  useGetMyAvailableBadgesQuery,
  useGetMyBadgeProgressQuery,

  // Media hooks
  useUploadMediaMutation,

  // Poll hooks
  useVoteOnPollMutation,
  useGetPollResultsQuery,
  useRemoveVoteFromPollMutation,

  // Prediction hooks
  useStakeOnPredictionMutation,
  useRemoveStakeFromPredictionMutation,
  useGetPredictionResultsQuery,

  // Category & Hashtag hooks
  useGetCategoriesQuery,
  useGetTrendingHashtagsQuery,
  useGetPopularHashtagsQuery,

  // Notification hooks
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,

  // Follow/User hooks
  useIsFollowingQuery,
  useSearchUsersQuery,
  useGetUserProfileQuery,
  useGetFollowerStatsQuery,
  useGetFollowingStatsQuery,
} = socialApi;
