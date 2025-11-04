const express = require('express');
const router = express.Router();
const followController = require('../controllers/follow.controller');
const { authenticate } = require('../../auth/middleware/auth.middleware');

// Public routes (no authentication required)
router.get('/trending', followController.getTrendingUsers);
router.get('/search', followController.searchUsers);
router.get('/users/:userId/profile', followController.getUserProfile);
router.get('/users/:userId/followers', followController.getFollowers);
router.get('/users/:userId/following', followController.getFollowing);
router.get('/users/:userId/follower-stats', followController.getFollowerStats);
router.get('/users/:userId/following-stats', followController.getFollowingStats);

// Protected routes (authentication required)
router.use(authenticate);

// Follow/unfollow actions
router.post('/users/:userId/follow', followController.followUser);
router.delete('/users/:userId/follow', followController.unfollowUser);
router.get('/users/:userId/is-following', followController.isFollowing);

// User management
router.post('/users/:userId/mute', followController.muteUser);
router.delete('/users/:userId/mute', followController.unmuteUser);
router.post('/users/:userId/block', followController.blockUser);
router.delete('/users/:userId/block', followController.unblockUser);

// Current user routes
router.get('/me/suggestions', followController.getFollowSuggestions);
router.get('/me/stats', followController.getMyFollowStats);
router.get('/me/feed', followController.getFollowFeed);
router.get('/me/mutual/:userId', followController.getMutualFollows);

module.exports = router;
