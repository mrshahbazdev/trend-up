const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feed.controller');
const { authenticate } = require('../../auth/middleware/auth.middleware');

// All feed routes require authentication
router.use(authenticate);

// Main feed endpoints
router.get('/', feedController.getUserFeed);
router.get('/following', feedController.getFollowingFeed);
router.get('/trending', feedController.getTrendingFeed);
router.get('/discover', feedController.getDiscoverFeed);

// Category, topic, and hashtag feeds
router.get('/category/:categoryId', feedController.getCategoryFeed);
router.get('/topic/:topicId', feedController.getTopicFeed);
router.get('/hashtag/:hashtagId', feedController.getHashtagFeed);

// Feed management
router.post('/refresh', feedController.refreshFeed);
router.get('/preferences', feedController.getFeedPreferences);
router.put('/preferences', feedController.updateFeedPreferences);
router.get('/recommendations', feedController.getFeedRecommendations);

// Statistics and performance (admin/moderator only)
router.get('/stats', feedController.getFeedStats);
router.get('/performance', feedController.getFeedPerformance);
router.post('/update-stale', feedController.updateStaleFeeds);

module.exports = router;
