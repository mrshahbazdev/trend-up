const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badge.controller');
const { authenticate } = require('../../auth/middleware/auth.middleware');
const {
  getAllBadgesValidator,
  getBadgesByCategoryValidator,
  getBadgesByRarityValidator,
  getAvailableBadgesForUserValidator,
  getBadgeByIdValidator,
  getUserBadgeProgressValidator,
  createBadgeValidator,
  updateBadgeValidator,
  deleteBadgeValidator,
} = require('../validators/badge.validators');

// Public routes (no authentication required)
router.get('/', getAllBadgesValidator, badgeController.getAllBadges);
router.get('/stats', badgeController.getBadgeStats);
router.get('/category/:category', getBadgesByCategoryValidator, badgeController.getBadgesByCategory);
router.get('/rarity/:rarity', getBadgesByRarityValidator, badgeController.getBadgesByRarity);
router.get('/:badgeId', getBadgeByIdValidator, badgeController.getBadgeById);
router.get('/users/:userId/available', getAvailableBadgesForUserValidator, badgeController.getAvailableBadgesForUser);
router.get('/users/:userId/progress', getUserBadgeProgressValidator, badgeController.getUserBadgeProgress);

// Protected routes (authentication required)
router.use(authenticate);

// Current user routes
router.get('/me/available', badgeController.getMyAvailableBadges);
router.get('/me/progress', badgeController.getMyBadgeProgress);

// Admin routes (would need admin middleware in production)
router.post('/initialize', badgeController.initializeBadges);
router.post('/', createBadgeValidator, badgeController.createBadge);
router.put('/:badgeId', updateBadgeValidator, badgeController.updateBadge);
router.delete('/:badgeId', deleteBadgeValidator, badgeController.deleteBadge);

module.exports = router;
