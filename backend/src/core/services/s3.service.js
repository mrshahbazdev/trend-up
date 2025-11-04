const AWS = require('aws-sdk');
const { BadRequestError } = require('../errors/AppError');
const { logger } = require('../utils/logger');
const path = require('path');

class S3Service {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.bucket = process.env.AWS_S3_BUCKET;
    
    if (!this.bucket) {
      logger.warn('AWS_S3_BUCKET not configured - file uploads will fail');
    }
  }

  /**
   * Upload file to S3
   * @param {Buffer} fileBuffer - File buffer from multer
   * @param {String} folder - Folder name (avatars, covers)
   * @param {String} filename - Unique filename
   * @param {String} mimetype - File mimetype
   */
  async uploadFile(fileBuffer, folder, filename, mimetype) {
    if (!this.bucket) {
      throw new BadRequestError('S3 storage not configured');
    }

    const key = `${folder}/${filename}`;
    
    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype,
      // ACL removed - bucket policy handles public access
    };

    try {
      const result = await this.s3.upload(params).promise();
      logger.info(`File uploaded to S3: ${key}`);
      
      return {
        url: result.Location, // Full S3 URL
        key: result.Key,
        bucket: result.Bucket
      };
    } catch (error) {
      logger.error('S3 upload failed:', {
        error: error.message,
        stack: error.stack,
        key
      });
      throw new BadRequestError('File upload failed');
    }
  }

  /**
   * Delete file from S3
   * @param {String} fileUrl - Full S3 URL or key
   */
  async deleteFile(fileUrl) {
    if (!fileUrl || !this.bucket) return false;

    try {
      // Extract key from URL if it's a full URL
      let key = fileUrl;
      if (fileUrl.includes('s3.amazonaws.com') || fileUrl.includes('amazonaws.com')) {
        const url = new URL(fileUrl);
        key = url.pathname.substring(1); // Remove leading slash
      } else if (fileUrl.startsWith('/uploads/')) {
        // Handle old local paths - skip deletion
        return true;
      }

      const params = {
        Bucket: this.bucket,
        Key: key
      };

      await this.s3.deleteObject(params).promise();
      logger.info(`File deleted from S3: ${key}`);
      
      return true;
    } catch (error) {
      logger.error('S3 delete failed:', {
        error: error.message,
        stack: error.stack,
        fileUrl
      });
      // Don't throw - deletion failure shouldn't break the app
      return false;
    }
  }

  /**
   * Generate unique filename
   */
  generateFilename(userId, originalname, prefix = 'file') {
    const ext = path.extname(originalname);
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    return `${prefix}-${userId}-${timestamp}-${random}${ext}`;
  }

  /**
   * Check if S3 is configured
   */
  isConfigured() {
    return !!(this.bucket && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  }
}

const s3Service = new S3Service();

module.exports = s3Service;

