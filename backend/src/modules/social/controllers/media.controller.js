const mediaService = require('../services/media.service');
const { logger } = require('../../../core/utils/logger');
const { ResponseHandler } = require('../../../core/utils/response');

class MediaController {
  // Upload media file
  async uploadMedia(req, res, next) {
    try {
      const userId = req.user.userId;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      const {
        category = 'post',
        postId = null,
        commentId = null,
        altText = null,
        description = null,
        tags = [],
        isPublic = true
      } = req.body;

      // Parse tags if they're a string
      const parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;

      const media = await mediaService.uploadMedia(file, userId, {
        category,
        postId,
        commentId,
        altText,
        description,
        tags: parsedTags,
        isPublic: isPublic === 'true'
      });

      return ResponseHandler.success(res, {
        media,
        message: 'Media uploaded successfully'
      }, 201);
    } catch (error) {
      logger.error(`[ERROR] Failed to upload media:`, error);
      next(error);
    }
  }

  // Upload multiple media files
  async uploadMultipleMedia(req, res, next) {
    try {
      const userId = req.user.userId;
      const files = req.files;
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      const {
        category = 'post',
        postId = null,
        commentId = null,
        isPublic = true
      } = req.body;

      const uploadedMedia = [];
      const errors = [];

      for (const file of files) {
        try {
          const media = await mediaService.uploadMedia(file, userId, {
            category,
            postId,
            commentId,
            isPublic: isPublic === 'true'
          });
          uploadedMedia.push(media);
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }

      return ResponseHandler.success(res, {
        media: uploadedMedia,
        errors,
        message: `Uploaded ${uploadedMedia.length} files successfully`
      }, 201);
    } catch (error) {
      logger.error(`[ERROR] Failed to upload multiple media:`, error);
      next(error);
    }
  }

  // Get media by ID
  async getMediaById(req, res, next) {
    try {
      const { mediaId } = req.params;
      const media = await mediaService.getMediaById(mediaId);

      return ResponseHandler.success(res, {
        media,
        message: 'Media retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get media by ID:`, error);
      next(error);
    }
  }

  // Get user's media
  async getUserMedia(req, res, next) {
    try {
      const { userId } = req.params;
      const {
        page = 1,
        limit = 20,
        mediaType = null,
        category = null,
        isPublic = null,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await mediaService.getUserMedia(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        mediaType,
        category,
        isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : null,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        media: result.media,
        pagination: result.pagination,
        message: 'User media retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get user media:`, error);
      next(error);
    }
  }

  // Get current user's media
  async getMyMedia(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        page = 1,
        limit = 20,
        mediaType = null,
        category = null,
        isPublic = null,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await mediaService.getUserMedia(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        mediaType,
        category,
        isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : null,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        media: result.media,
        pagination: result.pagination,
        message: 'Your media retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get current user media:`, error);
      next(error);
    }
  }

  // Get media by post
  async getPostMedia(req, res, next) {
    try {
      const { postId } = req.params;
      const media = await mediaService.getPostMedia(postId);

      return ResponseHandler.success(res, {
        media,
        message: 'Post media retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get post media:`, error);
      next(error);
    }
  }

  // Get media by comment
  async getCommentMedia(req, res, next) {
    try {
      const { commentId } = req.params;
      const media = await mediaService.getCommentMedia(commentId);

      return ResponseHandler.success(res, {
        media,
        message: 'Comment media retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get comment media:`, error);
      next(error);
    }
  }

  // Update media
  async updateMedia(req, res, next) {
    try {
      const { mediaId } = req.params;
      const userId = req.user.userId;
      const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

      const media = await mediaService.updateMedia(mediaId, req.body, userId, isModerator);

      return ResponseHandler.success(res, {
        media,
        message: 'Media updated successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to update media:`, error);
      next(error);
    }
  }

  // Delete media
  async deleteMedia(req, res, next) {
    try {
      const { mediaId } = req.params;
      const userId = req.user.userId;
      const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

      const result = await mediaService.deleteMedia(mediaId, userId, isModerator);

      return ResponseHandler.success(res, {
        result,
        message: 'Media deleted successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to delete media:`, error);
      next(error);
    }
  }

  // Search media
  async searchMedia(req, res, next) {
    try {
      const { q, page = 1, limit = 20, mediaType = null, category = null, userId = null, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const result = await mediaService.searchMedia(q.trim(), {
        page: parseInt(page),
        limit: parseInt(limit),
        mediaType,
        category,
        userId,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        media: result.media,
        query: result.query,
        pagination: result.pagination,
        message: 'Media search completed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to search media:`, error);
      next(error);
    }
  }

  // Get media statistics
  async getMediaStats(req, res, next) {
    try {
      const stats = await mediaService.getMediaStats();

      return ResponseHandler.success(res, {
        stats,
        message: 'Media statistics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get media stats:`, error);
      next(error);
    }
  }

  // Get processing queue
  async getProcessingQueue(req, res, next) {
    try {
      const { limit = 50 } = req.query;
      const queue = await mediaService.getProcessingQueue(parseInt(limit));

      return ResponseHandler.success(res, {
        queue,
        message: 'Processing queue retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get processing queue:`, error);
      next(error);
    }
  }

  // Process pending media
  async processPendingMedia(req, res, next) {
    try {
      const result = await mediaService.processPendingMedia();

      return ResponseHandler.success(res, {
        result,
        message: 'Pending media processed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to process pending media:`, error);
      next(error);
    }
  }

  // Cleanup expired media
  async cleanupExpiredMedia(req, res, next) {
    try {
      const result = await mediaService.cleanupExpiredMedia();

      return ResponseHandler.success(res, {
        result,
        message: 'Expired media cleaned up successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to cleanup expired media:`, error);
      next(error);
    }
  }

  // Get media by type
  async getMediaByType(req, res, next) {
    try {
      const { mediaType } = req.params;
      const {
        page = 1,
        limit = 20,
        category = null,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await mediaService.searchMedia('', {
        page: parseInt(page),
        limit: parseInt(limit),
        mediaType,
        category,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        media: result.media,
        mediaType,
        pagination: result.pagination,
        message: `${mediaType} media retrieved successfully`
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get media by type:`, error);
      next(error);
    }
  }

  // Get media by category
  async getMediaByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const {
        page = 1,
        limit = 20,
        mediaType = null,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await mediaService.searchMedia('', {
        page: parseInt(page),
        limit: parseInt(limit),
        mediaType,
        category,
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        media: result.media,
        category,
        pagination: result.pagination,
        message: `${category} media retrieved successfully`
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get media by category:`, error);
      next(error);
    }
  }

  // Increment view count
  async incrementViewCount(req, res, next) {
    try {
      const { mediaId } = req.params;
      const media = await mediaService.getMediaById(mediaId);
      
      await media.incrementViewCount();

      return ResponseHandler.success(res, {
        viewCount: media.viewCount,
        message: 'View count incremented successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to increment view count:`, error);
      next(error);
    }
  }

  // Increment download count
  async incrementDownloadCount(req, res, next) {
    try {
      const { mediaId } = req.params;
      const media = await mediaService.getMediaById(mediaId);
      
      await media.incrementDownloadCount();

      return ResponseHandler.success(res, {
        downloadCount: media.downloadCount,
        message: 'Download count incremented successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to increment download count:`, error);
      next(error);
    }
  }

  // Increment share count
  async incrementShareCount(req, res, next) {
    try {
      const { mediaId } = req.params;
      const media = await mediaService.getMediaById(mediaId);
      
      await media.incrementShareCount();

      return ResponseHandler.success(res, {
        shareCount: media.shareCount,
        message: 'Share count incremented successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to increment share count:`, error);
      next(error);
    }
  }
}

module.exports = new MediaController();
