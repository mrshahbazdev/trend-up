const express = require('express');
const router = express.Router();
const { authenticate } = require('../../auth/middleware/auth.middleware');
const { multipleUpload } = require('../../../core/middleware/upload.middleware');
const {
  createPostValidation,
  createPollValidation,
  createPredictionValidation,
  updatePostValidation,
  getPostsValidation,
  getPostValidation,
  deletePostValidation,
  reactToPostValidation,
  getPostReactionsValidation,
} = require('../validators/post.validators');
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  reactToPost,
  getPostReactions,
  getTrendingPosts,
  getUserPosts,
  getSearchPosts,
  voteOnPostPoll,
  getPostPollResults,
  stakeOnPostPrediction,
  getPostPredictionResults,
} = require('../controllers/post.controller');

// Apply auth middleware to all routes
router.use(authenticate);

// Post CRUD routes
router.post('/', multipleUpload('media', 5), createPostValidation, createPost);
router.get('/', getPostsValidation, getPosts);
router.get('/trending', getTrendingPosts);
router.get('/search', getSearchPosts);
router.get('/user/:userId', getUserPosts);
router.get('/:id', getPostValidation, getPostById);
router.patch('/:id', updatePostValidation, updatePost);
router.delete('/:id', deletePostValidation, deletePost);

// Post interaction routes
router.post('/:id/react', reactToPostValidation, reactToPost);
router.get('/:id/reactions', getPostReactionsValidation, getPostReactions);

// Post-based poll routes
router.post('/:postId/poll/vote', voteOnPostPoll);
router.get('/:postId/poll/results', getPostPollResults);

// Post-based prediction routes
router.post('/:postId/prediction/stake', stakeOnPostPrediction);
router.get('/:postId/prediction/results', getPostPredictionResults);

module.exports = router;
