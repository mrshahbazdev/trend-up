const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const commentValidators = require('../validators/comment.validators');
const { authenticate } = require('../../auth/middleware/auth.middleware');

// Public routes (no authentication required)
router.get('/trending', commentValidators.getTrendingCommentsValidator, commentController.getTrendingComments);
router.get('/recent', commentValidators.getRecentCommentsValidator, commentController.getRecentComments);
router.get('/search', commentValidators.searchCommentsValidator, commentController.searchComments);
router.get('/stats', commentValidators.getCommentStatsValidator, commentController.getCommentStats);
router.get('/posts/:postId', commentValidators.getPostCommentsValidator, commentController.getPostComments);
router.get('/users/:userId', commentValidators.getUserCommentsValidator, commentController.getUserComments);
router.get('/:commentId', commentValidators.getCommentByIdValidator, commentController.getCommentById);
router.get('/:commentId/thread', commentValidators.getCommentThreadValidator, commentController.getCommentThread);
router.get('/:commentId/replies', commentValidators.getCommentRepliesValidator, commentController.getCommentReplies);

// Protected routes (authentication required)
router.use(authenticate);

// Comment CRUD operations
router.post('/posts/:postId', commentValidators.createCommentValidator, commentController.createComment);
router.put('/:commentId', commentValidators.updateCommentValidator, commentController.updateComment);
router.delete('/:commentId', commentValidators.deleteCommentValidator, commentController.deleteComment);

// Comment interactions
router.post('/:commentId/flag', commentValidators.flagCommentValidator, commentController.flagComment);
router.post('/:commentId/react', commentController.reactToComment);
router.get('/:commentId/reactions', commentController.getCommentReactions);

// Current user routes
router.get('/me/comments', commentValidators.getUserCommentsValidator, commentController.getMyComments);

module.exports = router;
