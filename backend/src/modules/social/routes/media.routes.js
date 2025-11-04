const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const { authenticate } = require('../../auth/middleware/auth.middleware');
const { singleUpload, multipleUpload } = require('../../../core/middleware/upload.middleware');

// All media routes require authentication
router.use(authenticate);

// Upload endpoints
router.post('/upload', singleUpload('file'), mediaController.uploadMedia);
router.post('/upload-multiple', multipleUpload('files', 10), mediaController.uploadMultipleMedia);

// Statistics and admin endpoints (must come before parameterized routes)
router.get('/stats', mediaController.getMediaStats);
router.get('/processing/queue', mediaController.getProcessingQueue);
router.post('/processing/process-pending', mediaController.processPendingMedia);
router.post('/cleanup/expired', mediaController.cleanupExpiredMedia);

// Search and discovery endpoints (must come before parameterized routes)
router.get('/search', mediaController.searchMedia);
router.get('/type/:mediaType', mediaController.getMediaByType);
router.get('/category/:category', mediaController.getMediaByCategory);

// Specific media retrieval endpoints (must come before generic :mediaId route)
router.get('/user/:userId', mediaController.getUserMedia);
router.get('/me/media', mediaController.getMyMedia);
router.get('/post/:postId', mediaController.getPostMedia);
router.get('/comment/:commentId', mediaController.getCommentMedia);

// Generic media endpoints (must come last to avoid conflicts)
router.get('/:mediaId', mediaController.getMediaById);
router.put('/:mediaId', mediaController.updateMedia);
router.delete('/:mediaId', mediaController.deleteMedia);

// Media interaction endpoints
router.post('/:mediaId/view', mediaController.incrementViewCount);
router.post('/:mediaId/download', mediaController.incrementDownloadCount);
router.post('/:mediaId/share', mediaController.incrementShareCount);

module.exports = router;
