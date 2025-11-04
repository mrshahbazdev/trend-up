const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/prediction.controller');
const { authenticate } = require('../../auth/middleware/auth.middleware');

// All prediction routes require authentication
router.use(authenticate);

// Prediction creation and management
router.post('/', predictionController.createPrediction);
router.get('/:predictionId', predictionController.getPredictionById);
router.put('/:predictionId', predictionController.updatePrediction);
router.post('/:predictionId/cancel', predictionController.cancelPrediction);

// Staking endpoints
router.post('/:predictionId/stake', predictionController.stakeOnPrediction);
router.delete('/:predictionId/stake', predictionController.removeStake);

// Resolution endpoint (moderator/admin only)
router.post('/:predictionId/resolve', predictionController.resolvePrediction);

// Prediction discovery and browsing
router.get('/', predictionController.getActivePredictions);
router.get('/trending', predictionController.getTrendingPredictions);
router.get('/asset/:symbol', predictionController.getPredictionsByAsset);
router.get('/user/:userId', predictionController.getUserPredictions);
router.get('/me/predictions', predictionController.getMyPredictions);
router.get('/me/stakes', predictionController.getMyStakes);
router.get('/user/:userId/stakes', predictionController.getUserStakes);

// Search and statistics
router.get('/search', predictionController.searchPredictions);
router.get('/stats', predictionController.getPredictionStats);

// Admin endpoints
router.post('/admin/process-expired', predictionController.processExpiredPredictions);

module.exports = router;
