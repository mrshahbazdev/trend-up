const express = require('express');
const router = express.Router();
const karmaController = require('../controllers/karma.controller');
const { authenticate } = require('../../auth/middleware/auth.middleware');
const {
  getUserKarmaValidator,
  getLeaderboardValidator,
  getUsersByLevelValidator,
  getUserKarmaHistoryValidator,
  getUserBadgesValidator,
  getUserUnlockedReactionsValidator,
  canUseReactionValidator,
  getUserReactionWeightValidator,
  addKarmaValidator,
  deductKarmaValidator,
} = require('../validators/karma.validators');

// Public routes (no authentication required)
router.get('/leaderboard', getLeaderboardValidator, karmaController.getLeaderboard);
router.get('/stats', karmaController.getKarmaStats);
router.get('/users/level/:level', getUsersByLevelValidator, karmaController.getUsersByLevel);
router.get('/users/:userId', getUserKarmaValidator, karmaController.getUserKarma);
router.get('/users/:userId/history', getUserKarmaHistoryValidator, karmaController.getUserKarmaHistory);
router.get('/users/:userId/badges', getUserBadgesValidator, karmaController.getUserBadges);
router.get('/users/:userId/reactions', getUserUnlockedReactionsValidator, karmaController.getUserUnlockedReactions);
router.get('/users/:userId/can-use-reaction', canUseReactionValidator, karmaController.canUseReaction);
router.get('/users/:userId/reaction-weight', getUserReactionWeightValidator, karmaController.getUserReactionWeight);

// Protected routes (authentication required)
router.use(authenticate);

// Current user routes
router.get('/me', karmaController.getMyKarma);
router.get('/me/badges', karmaController.getMyBadges);
router.get('/me/reactions', karmaController.getMyUnlockedReactions);
router.get('/me/history', karmaController.getMyKarmaHistory);

// Admin routes (would need admin middleware in production)
router.post('/add', addKarmaValidator, karmaController.addKarma);
router.post('/deduct', deductKarmaValidator, karmaController.deductKarma);

module.exports = router;
