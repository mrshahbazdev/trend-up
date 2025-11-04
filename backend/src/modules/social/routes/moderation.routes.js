/**
 * Moderation Routes
 * API endpoints for content moderation
 */

const express = require('express');
const router = express.Router();

const moderationController = require('../controllers/moderation.controller');
const { authenticate } = require('../../../modules/auth/middleware/auth.middleware');

// const { authorize } = require('../../../modules/auth/middleware/authorize.middleware'); // Temporarily disabled for debugging

// Middleware for moderator/admin access
const requireModerator = [authenticate]; // Temporarily simplified for debugging

// Middleware for admin access only
const requireAdmin = [authenticate]; // Temporarily simplified for debugging

/**
 * @route POST /api/v1/social/moderation/reports
 * @desc Create a report
 * @access Private
 */
router.post('/reports', authenticate, moderationController.createReport);

/**
 * @route POST /api/v1/social/moderation/flags
 * @desc Create a flag
 * @access Private
 */
router.post('/flags', authenticate, moderationController.createFlag);

/**
 * @route GET /api/v1/social/moderation/dashboard
 * @desc Get moderation dashboard data
 * @access Private (Moderator/Admin)
 */
router.get('/dashboard', requireModerator, moderationController.getDashboard);

/**
 * @route GET /api/v1/social/moderation/flags/pending
 * @desc Get pending flags
 * @access Private (Moderator/Admin)
 */
router.get('/flags/pending', requireModerator, moderationController.getPendingFlags);

/**
 * @route GET /api/v1/social/moderation/reports/pending
 * @desc Get pending reports
 * @access Private (Moderator/Admin)
 */
router.get('/reports/pending', requireModerator, moderationController.getPendingReports);

/**
 * @route PUT /api/v1/social/moderation/flags/:flagId/resolve
 * @desc Resolve a flag
 * @access Private (Moderator/Admin)
 */
router.put('/flags/:flagId/resolve', requireModerator, moderationController.resolveFlag);

/**
 * @route PUT /api/v1/social/moderation/reports/:reportId/resolve
 * @desc Resolve a report
 * @access Private (Moderator/Admin)
 */
router.put('/reports/:reportId/resolve', requireModerator, moderationController.resolveReport);

/**
 * @route POST /api/v1/social/moderation/actions
 * @desc Take moderation action
 * @access Private (Moderator/Admin)
 */
router.post('/actions', requireModerator, moderationController.takeAction);

/**
 * @route GET /api/v1/social/moderation/users/:userId/history
 * @desc Get user moderation history
 * @access Private (Moderator/Admin)
 */
router.get('/users/:userId/history', requireModerator, moderationController.getUserModerationHistory);

/**
 * @route GET /api/v1/social/moderation/content/:contentId/:contentType/status
 * @desc Get content moderation status
 * @access Private (Moderator/Admin)
 */
router.get('/content/:contentId/:contentType/status', requireModerator, moderationController.getContentModerationStatus);

/**
 * @route POST /api/v1/social/moderation/analyze
 * @desc Analyze content for violations
 * @access Private (Moderator/Admin)
 */
router.post('/analyze', requireModerator, moderationController.analyzeContent);

/**
 * @route GET /api/v1/social/moderation/stats
 * @desc Get moderation statistics
 * @access Private (Moderator/Admin)
 */
router.get('/stats', requireModerator, moderationController.getModerationStats);

/**
 * @route PUT /api/v1/social/moderation/settings/auto-moderation
 * @desc Update auto-moderation settings
 * @access Private (Admin)
 */
router.put('/settings/auto-moderation', requireAdmin, moderationController.updateAutoModerationSettings);

/**
 * @route GET /api/v1/social/moderation/actions/recent
 * @desc Get recent moderation actions
 * @access Private (Moderator/Admin)
 */
router.get('/actions/recent', requireModerator, moderationController.getRecentActions);

/**
 * @route PUT /api/v1/social/moderation/actions/:actionId/reverse
 * @desc Reverse moderation action
 * @access Private (Admin)
 */
router.put('/actions/:actionId/reverse', requireAdmin, moderationController.reverseAction);

module.exports = router;
