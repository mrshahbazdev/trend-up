const express = require('express');
const router = express.Router();
const pollController = require('../controllers/poll.controller');
const { authenticate } = require('../../auth/middleware/auth.middleware');

// All poll routes require authentication
router.use(authenticate);

// Poll creation and management
router.post('/', pollController.createPoll);
router.get('/:pollId', pollController.getPollById);
router.put('/:pollId', pollController.updatePoll);
router.post('/:pollId/close', pollController.closePoll);
router.post('/:pollId/cancel', pollController.cancelPoll);

// Voting endpoints
router.post('/:pollId/vote', pollController.voteOnPoll);
router.delete('/:pollId/vote', pollController.removeVote);
router.get('/:pollId/results', pollController.getPollResults);

// Poll discovery and browsing
router.get('/', pollController.getActivePolls);
router.get('/trending', pollController.getTrendingPolls);
router.get('/category/:category', pollController.getPollsByCategory);
router.get('/user/:userId', pollController.getUserPolls);
router.get('/me/polls', pollController.getMyPolls);

// Search and statistics
router.get('/search', pollController.searchPolls);
router.get('/stats', pollController.getPollStats);

// Admin endpoints
router.post('/admin/process-expired', pollController.processExpiredPolls);

module.exports = router;
