const { Media, Post, Comment } = require('../models');
const { logger } = require('../../../core/utils/logger');
const mongoose = require('mongoose');
// const AWS = require('aws-sdk');
// const sharp = require('sharp');
// const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class MediaService {
  constructor() {
    // Media configuration
    this.mediaConfig = {
      maxFileSize: {
        image: 10 * 1024 * 1024, // 10MB
        video: 100 * 1024 * 1024, // 100MB
        audio: 50 * 1024 * 1024, // 50MB
        document: 25 * 1024 * 1024, // 25MB
      },
      allowedMimeTypes: {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
        audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
        document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      },
      thumbnailSizes: {
        small: { width: 150, height: 150 },
        medium: { width: 400, height: 400 },
        large: { width: 800, height: 800 },
      },
      videoQualities: ['360p', '720p', '1080p'],
    };

    // Initialize AWS S3 (commented out for testing)
    // this.s3 = new AWS.S3({
    //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    //   region: process.env.AWS_REGION || 'us-east-1',
    // });

    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'trendup-media';
  }

  // Upload media file
  async uploadMedia(file, userId, options = {}) {
    try {
      const {
        category = 'post',
        postId = null,
        commentId = null,
        altText = null,
        description = null,
        tags = [],
        isPublic = true
      } = options;

      // Validate file
      await this.validateFile(file);

      // Generate unique filename
      const filename = this.generateFilename(file.originalname);
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const mimeType = file.mimetype;

      // Determine media type
      const mediaType = this.getMediaType(mimeType);

      // Get file metadata
      const metadata = await this.getFileMetadata(file, mediaType);

      // Upload to S3
      const uploadResult = await this.uploadToS3(file, filename);

      // Create media record
      const media = new Media({
        filename,
        originalName: file.originalname,
        mimeType,
        fileExtension,
        fileSize: file.size,
        dimensions: metadata.dimensions,
        duration: metadata.duration,
        storageProvider: 's3',
        storagePath: uploadResult.key,
        storageUrl: uploadResult.location,
        mediaType,
        category,
        userId: new mongoose.Types.ObjectId(userId),
        postId: postId ? new mongoose.Types.ObjectId(postId) : null,
        commentId: commentId ? new mongoose.Types.ObjectId(commentId) : null,
        altText,
        description,
        tags,
        isPublic,
        processingStatus: 'pending',
        checksum: await this.calculateChecksum(file.buffer)
      });

      await media.save();

      // Start processing if needed
      if (mediaType === 'image' || mediaType === 'video') {
        await this.processMedia(media._id);
      } else {
        await media.markAsCompleted();
      }

      logger.info(`[INFO] Media uploaded successfully: ${filename} by user ${userId}`);
      return media;
    } catch (error) {
      logger.error(`[ERROR] Failed to upload media:`, error);
      throw error;
    }
  }

  // Validate file
  async validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    const mimeType = file.mimetype;
    const fileSize = file.size;
    const mediaType = this.getMediaType(mimeType);

    // Check file size
    if (fileSize > this.mediaConfig.maxFileSize[mediaType]) {
      throw new Error(`File size exceeds maximum allowed size for ${mediaType}`);
    }

    // Check mime type
    if (!this.mediaConfig.allowedMimeTypes[mediaType].includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed for ${mediaType}`);
    }

    // Additional validation for images
    if (mediaType === 'image') {
      await this.validateImage(file);
    }

    // Additional validation for videos
    if (mediaType === 'video') {
      await this.validateVideo(file);
    }
  }

  // Validate image file
  async validateImage(file) {
    try {
      const image = sharp(file.buffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image file');
      }

      // Check dimensions
      if (metadata.width > 4096 || metadata.height > 4096) {
        throw new Error('Image dimensions too large (max 4096x4096)');
      }
    } catch (error) {
      throw new Error(`Invalid image file: ${error.message}`);
    }
  }

  // Validate video file
  async validateVideo(file) {
    // Basic validation - in production, you might want to use ffprobe
    if (file.size > this.mediaConfig.maxFileSize.video) {
      throw new Error('Video file too large');
    }
  }

  // Get file metadata
  async getFileMetadata(file, mediaType) {
    const metadata = {};

    if (mediaType === 'image') {
      const image = sharp(file.buffer);
      const imageMetadata = await image.metadata();
      metadata.dimensions = {
        width: imageMetadata.width,
        height: imageMetadata.height
      };
    } else if (mediaType === 'video') {
      // For videos, you would typically use ffprobe
      // For now, we'll set default values
      metadata.dimensions = {
        width: 1920,
        height: 1080
      };
      metadata.duration = 0; // Would be extracted from video
    }

    return metadata;
  }

  // Generate unique filename
  generateFilename(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    return `${timestamp}_${randomString}${extension}`;
  }

  // Upload to S3
  async uploadToS3(file, filename) {
    try {
      const key = `media/${filename}`;
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        }
      };

      const result = await this.s3.upload(uploadParams).promise();
      
      return {
        key: result.Key,
        location: result.Location,
        etag: result.ETag
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to upload to S3:`, error);
      throw new Error('Failed to upload file to cloud storage');
    }
  }

  // Process media (generate thumbnails, optimize, etc.)
  async processMedia(mediaId) {
    try {
      const media = await Media.findById(mediaId);
      if (!media) {
        throw new Error('Media not found');
      }

      await media.markAsProcessing();

      if (media.mediaType === 'image') {
        await this.processImage(media);
      } else if (media.mediaType === 'video') {
        await this.processVideo(media);
      }

      await media.markAsCompleted();
      logger.info(`[INFO] Media processing completed: ${media.filename}`);
    } catch (error) {
      const media = await Media.findById(mediaId);
      if (media) {
        await media.markAsFailed(error.message);
      }
      logger.error(`[ERROR] Failed to process media:`, error);
      throw error;
    }
  }

  // Process image (generate thumbnails)
  async processImage(media) {
    try {
      // Download original image from S3
      const originalImage = await this.downloadFromS3(media.storagePath);
      
      // Generate thumbnails
      for (const [size, dimensions] of Object.entries(this.mediaConfig.thumbnailSizes)) {
        const thumbnailBuffer = await sharp(originalImage)
          .resize(dimensions.width, dimensions.height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        // Upload thumbnail to S3
        const thumbnailKey = `thumbnails/${size}/${media.filename}`;
        const thumbnailUrl = await this.uploadThumbnailToS3(thumbnailBuffer, thumbnailKey, 'image/jpeg');

        // Add thumbnail to media record
        await media.addThumbnail({
          size,
          width: dimensions.width,
          height: dimensions.height,
          storagePath: thumbnailKey,
          storageUrl: thumbnailUrl,
          fileSize: thumbnailBuffer.length
        });
      }

      logger.info(`[INFO] Generated thumbnails for image: ${media.filename}`);
    } catch (error) {
      logger.error(`[ERROR] Failed to process image:`, error);
      throw error;
    }
  }

  // Process video (generate thumbnails and optimize)
  async processVideo(media) {
    try {
      // For video processing, you would typically:
      // 1. Generate video thumbnails at different timestamps
      // 2. Create different quality versions
      // 3. Extract metadata (duration, resolution, etc.)
      
      // For now, we'll create a simple thumbnail
      const thumbnailBuffer = await this.generateVideoThumbnail(media);
      
      if (thumbnailBuffer) {
        const thumbnailKey = `thumbnails/medium/${media.filename}.jpg`;
        const thumbnailUrl = await this.uploadThumbnailToS3(thumbnailBuffer, thumbnailKey, 'image/jpeg');

        await media.addThumbnail({
          size: 'medium',
          width: 400,
          height: 400,
          storagePath: thumbnailKey,
          storageUrl: thumbnailUrl,
          fileSize: thumbnailBuffer.length
        });
      }

      logger.info(`[INFO] Generated thumbnail for video: ${media.filename}`);
    } catch (error) {
      logger.error(`[ERROR] Failed to process video:`, error);
      throw error;
    }
  }

  // Generate video thumbnail
  async generateVideoThumbnail(media) {
    try {
      // This is a simplified version - in production, you'd use ffmpeg
      // For now, return null to skip thumbnail generation
      return null;
    } catch (error) {
      logger.error(`[ERROR] Failed to generate video thumbnail:`, error);
      return null;
    }
  }

  // Download from S3
  async downloadFromS3(key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      const result = await this.s3.getObject(params).promise();
      return result.Body;
    } catch (error) {
      logger.error(`[ERROR] Failed to download from S3:`, error);
      throw error;
    }
  }

  // Upload thumbnail to S3
  async uploadThumbnailToS3(buffer, key, contentType) {
    try {
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read'
      };

      const result = await this.s3.upload(uploadParams).promise();
      return result.Location;
    } catch (error) {
      logger.error(`[ERROR] Failed to upload thumbnail to S3:`, error);
      throw error;
    }
  }

  // Calculate file checksum
  async calculateChecksum(buffer) {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  // Get media by ID
  async getMediaById(mediaId) {
    try {
      const media = await Media.findById(mediaId)
        .populate('userId', 'name username avatar')
        .populate('postId', 'title content')
        .populate('commentId', 'content');

      if (!media) {
        throw new Error('Media not found');
      }

      if (media.isDeleted) {
        throw new Error('Media has been deleted');
      }

      return media;
    } catch (error) {
      logger.error(`[ERROR] Failed to get media by ID:`, error);
      throw error;
    }
  }

  // Get user's media
  async getUserMedia(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        mediaType = null,
        category = null,
        isPublic = null,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const query = {
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false
      };

      if (mediaType) query.mediaType = mediaType;
      if (category) query.category = category;
      if (isPublic !== null) query.isPublic = isPublic;

      const media = await Media.find(query)
        .populate('postId', 'title content')
        .populate('commentId', 'content')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await Media.countDocuments(query);

      return {
        media,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get user media:`, error);
      throw error;
    }
  }

  // Get media by post
  async getPostMedia(postId) {
    try {
      const media = await Media.getPostMedia(postId);
      return media;
    } catch (error) {
      logger.error(`[ERROR] Failed to get post media:`, error);
      throw error;
    }
  }

  // Get media by comment
  async getCommentMedia(commentId) {
    try {
      const media = await Media.getCommentMedia(commentId);
      return media;
    } catch (error) {
      logger.error(`[ERROR] Failed to get comment media:`, error);
      throw error;
    }
  }

  // Update media
  async updateMedia(mediaId, updateData, userId, isModerator = false) {
    try {
      const media = await Media.findById(mediaId);
      
      if (!media) {
        throw new Error('Media not found');
      }

      // Check authorization
      if (!isModerator && media.userId.toString() !== userId) {
        throw new Error('Not authorized to update this media');
      }

      // Update allowed fields
      const allowedFields = ['altText', 'description', 'tags', 'isPublic'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          media[field] = updateData[field];
        }
      });

      await media.save();
      await media.populate('userId', 'name username avatar');

      logger.info(`[INFO] Media ${mediaId} updated by user ${userId}`);
      return media;
    } catch (error) {
      logger.error(`[ERROR] Failed to update media:`, error);
      throw error;
    }
  }

  // Delete media
  async deleteMedia(mediaId, userId, isModerator = false) {
    try {
      const media = await Media.findById(mediaId);
      
      if (!media) {
        throw new Error('Media not found');
      }

      // Check authorization
      if (!isModerator && media.userId.toString() !== userId) {
        throw new Error('Not authorized to delete this media');
      }

      // Soft delete
      await media.softDelete();

      // TODO: Schedule actual file deletion from S3
      // This would be handled by a background job

      logger.info(`[INFO] Media ${mediaId} deleted by user ${userId}`);
      return { message: 'Media deleted successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to delete media:`, error);
      throw error;
    }
  }

  // Search media
  async searchMedia(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        mediaType = null,
        category = null,
        userId = null,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const searchQuery = {
        isDeleted: false,
        isPublic: true,
        $or: [
          { originalName: { $regex: query, $options: 'i' } },
          { altText: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      };

      if (mediaType) searchQuery.mediaType = mediaType;
      if (category) searchQuery.category = category;
      if (userId) searchQuery.userId = new mongoose.Types.ObjectId(userId);

      const media = await Media.find(searchQuery)
        .populate('userId', 'name username avatar')
        .populate('postId', 'title content')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await Media.countDocuments(searchQuery);

      return {
        media,
        query,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to search media:`, error);
      throw error;
    }
  }

  // Get media statistics
  async getMediaStats() {
    try {
      const stats = await Media.getMediaStats();
      return stats[0] || {
        totalMedia: 0,
        totalSize: 0,
        imageCount: 0,
        videoCount: 0,
        gifCount: 0,
        audioCount: 0,
        documentCount: 0,
        pendingProcessing: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalViews: 0,
        totalDownloads: 0,
        totalShares: 0
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get media stats:`, error);
      throw error;
    }
  }

  // Get processing queue
  async getProcessingQueue(limit = 50) {
    try {
      const queue = await Media.getProcessingQueue(limit);
      return queue;
    } catch (error) {
      logger.error(`[ERROR] Failed to get processing queue:`, error);
      throw error;
    }
  }

  // Process pending media
  async processPendingMedia() {
    try {
      const pendingMedia = await this.getProcessingQueue(10);
      
      for (const media of pendingMedia) {
        try {
          await this.processMedia(media._id);
        } catch (error) {
          logger.error(`[ERROR] Failed to process media ${media._id}:`, error);
        }
      }

      logger.info(`[INFO] Processed ${pendingMedia.length} pending media files`);
      return { processed: pendingMedia.length };
    } catch (error) {
      logger.error(`[ERROR] Failed to process pending media:`, error);
      throw error;
    }
  }

  // Clean up expired media
  async cleanupExpiredMedia() {
    try {
      const expiredMedia = await Media.getExpiredMedia();
      
      for (const media of expiredMedia) {
        await media.softDelete();
        // TODO: Delete from S3
      }

      logger.info(`[INFO] Cleaned up ${expiredMedia.length} expired media files`);
      return { cleaned: expiredMedia.length };
    } catch (error) {
      logger.error(`[ERROR] Failed to cleanup expired media:`, error);
      throw error;
    }
  }

  // Get media type from mime type
  getMediaType(mimeType) {
    if (mimeType.startsWith('image/')) {
      return mimeType === 'image/gif' ? 'gif' : 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else {
      return 'document';
    }
  }
}

module.exports = new MediaService();
