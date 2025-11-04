const express = require('express');
const router = express.Router();
const hashtagController = require('../controllers/hashtag.controller');
const { authenticate } = require('../../auth/middleware/auth.middleware');

// Public routes (no authentication required)
router.get('/', hashtagController.getAllHashtags);
router.get('/trending', hashtagController.getTrendingHashtags);
router.get('/popular', hashtagController.getPopularHashtags);
router.get('/search', hashtagController.searchHashtags);
router.get('/stats', hashtagController.getHashtagStats);
router.get('/:hashtagId', hashtagController.getHashtagById);
router.get('/name/:name', hashtagController.getHashtagByName);
router.get('/:hashtagId/related', hashtagController.getRelatedHashtags);
router.get('/:hashtagId/usage-history', hashtagController.getHashtagUsageHistory);
router.get('/name/:name/posts', hashtagController.getHashtagPosts);

// Protected routes (authentication required)
router.use(authenticate);

// Hashtag interactions
router.post('/extract', hashtagController.extractHashtags);

// Moderator/Admin routes
router.put('/:hashtagId', hashtagController.updateHashtag);
router.post('/:hashtagId/ban', hashtagController.banHashtag);
router.delete('/:hashtagId/ban', hashtagController.unbanHashtag);

// Admin routes
router.post('/update-trending-scores', hashtagController.updateTrendingScores);
router.post('/cleanup-unused', hashtagController.cleanupUnusedHashtags);

module.exports = router;
