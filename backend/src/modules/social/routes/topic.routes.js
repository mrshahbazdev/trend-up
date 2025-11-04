const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topic.controller');
const { authenticate } = require('../../auth/middleware/auth.middleware');

// Public routes (no authentication required)
router.get('/', topicController.getAllTopics);
router.get('/hierarchy', topicController.getTopicHierarchy);
router.get('/popular', topicController.getPopularTopics);
router.get('/trending', topicController.getTrendingTopics);
router.get('/communities', topicController.getCommunityTopics);
router.get('/search', topicController.searchTopics);
router.get('/stats', topicController.getTopicStats);
router.get('/:topicId', topicController.getTopicById);
router.get('/slug/:slug', topicController.getTopicBySlug);
router.get('/:topicId/subtopics', topicController.getSubtopics);
router.get('/:topicId/posts', topicController.getTopicPosts);

// Protected routes (authentication required)
router.use(authenticate);

// Topic CRUD operations
router.post('/', topicController.createTopic);
router.put('/:topicId', topicController.updateTopic);
router.delete('/:topicId', topicController.deleteTopic);

// Topic interactions
router.post('/:topicId/join', topicController.joinTopic);
router.delete('/:topicId/join', topicController.leaveTopic);
router.post('/:topicId/follow', topicController.followTopic);
router.delete('/:topicId/follow', topicController.unfollowTopic);

// Topic moderation
router.post('/:topicId/moderators', topicController.addModerator);
router.delete('/:topicId/moderators', topicController.removeModerator);

// Admin routes
router.post('/update-engagement-scores', topicController.updateEngagementScores);

module.exports = router;
