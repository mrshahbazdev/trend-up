const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    // File identification
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileExtension: {
      type: String,
      required: true,
      trim: true,
    },
    // File metadata
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    dimensions: {
      width: {
        type: Number,
        min: 0,
      },
      height: {
        type: Number,
        min: 0,
      },
    },
    duration: {
      type: Number, // in seconds for videos
      min: 0,
    },
    // Storage information
    storageProvider: {
      type: String,
      enum: ['s3', 'local', 'cloudinary'],
      default: 's3',
    },
    storagePath: {
      type: String,
      required: true,
      trim: true,
    },
    storageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    // Thumbnails and variants
    thumbnails: [{
      size: {
        type: String,
        enum: ['small', 'medium', 'large', 'original'],
        required: true,
      },
      width: {
        type: Number,
        required: true,
      },
      height: {
        type: Number,
        required: true,
      },
      storagePath: {
        type: String,
        required: true,
      },
      storageUrl: {
        type: String,
        required: true,
      },
      fileSize: {
        type: Number,
        required: true,
      },
    }],
    // Video-specific fields
    videoMetadata: {
      codec: {
        type: String,
        trim: true,
      },
      bitrate: {
        type: Number,
        min: 0,
      },
      framerate: {
        type: Number,
        min: 0,
      },
      resolution: {
        type: String,
        trim: true,
      },
      aspectRatio: {
        type: String,
        trim: true,
      },
    },
    // Processing status
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processingProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    processingError: {
      type: String,
      trim: true,
    },
    // Media categorization
    mediaType: {
      type: String,
      enum: ['image', 'video', 'gif', 'audio', 'document'],
      required: true,
    },
    category: {
      type: String,
      enum: ['profile', 'post', 'comment', 'banner', 'avatar', 'attachment'],
      default: 'post',
    },
    // Content association
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    // Content moderation
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'flagged', 'rejected'],
      default: 'pending',
    },
    moderationScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    moderationTags: [{
      type: String,
      trim: true,
    }],
    moderationNotes: {
      type: String,
      trim: true,
    },
    // Usage statistics
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Privacy and access control
    isPublic: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // Expiration (for temporary files)
    expiresAt: {
      type: Date,
      default: null,
    },
    // Tags and metadata
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    altText: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // Technical metadata
    checksum: {
      type: String,
      trim: true,
    },
    encoding: {
      type: String,
      trim: true,
    },
    // Processing metadata
    processingStartedAt: {
      type: Date,
      default: null,
    },
    processingCompletedAt: {
      type: Date,
      default: null,
    },
    processingDuration: {
      type: Number, // in milliseconds
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
mediaSchema.index({ userId: 1, createdAt: -1 });
mediaSchema.index({ postId: 1 });
mediaSchema.index({ commentId: 1 });
mediaSchema.index({ mediaType: 1, category: 1 });
mediaSchema.index({ processingStatus: 1 });
mediaSchema.index({ moderationStatus: 1 });
mediaSchema.index({ isPublic: 1, isDeleted: 1 });
mediaSchema.index({ expiresAt: 1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ filename: 1 });
mediaSchema.index({ storagePath: 1 });

// Virtual for user
mediaSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for post
mediaSchema.virtual('post', {
  ref: 'Post',
  localField: 'postId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for comment
mediaSchema.virtual('comment', {
  ref: 'Comment',
  localField: 'commentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for file size in human readable format
mediaSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for duration in human readable format
mediaSchema.virtual('durationFormatted').get(function() {
  if (!this.duration) return null;
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = Math.floor(this.duration % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
});

// Virtual for aspect ratio
mediaSchema.virtual('aspectRatio').get(function() {
  if (!this.dimensions || !this.dimensions.width || !this.dimensions.height) {
    return null;
  }
  
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(this.dimensions.width, this.dimensions.height);
  return `${this.dimensions.width / divisor}:${this.dimensions.height / divisor}`;
});

// Method to add thumbnail
mediaSchema.methods.addThumbnail = function(thumbnailData) {
  this.thumbnails.push(thumbnailData);
  return this.save();
};

// Method to get thumbnail by size
mediaSchema.methods.getThumbnail = function(size) {
  return this.thumbnails.find(thumb => thumb.size === size);
};

// Method to increment view count
mediaSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  await this.save();
};

// Method to increment download count
mediaSchema.methods.incrementDownloadCount = async function() {
  this.downloadCount += 1;
  await this.save();
};

// Method to increment share count
mediaSchema.methods.incrementShareCount = async function() {
  this.shareCount += 1;
  await this.save();
};

// Method to mark as processing
mediaSchema.methods.markAsProcessing = async function() {
  this.processingStatus = 'processing';
  this.processingStartedAt = new Date();
  this.processingProgress = 0;
  await this.save();
};

// Method to mark as completed
mediaSchema.methods.markAsCompleted = async function() {
  this.processingStatus = 'completed';
  this.processingCompletedAt = new Date();
  this.processingProgress = 100;
  if (this.processingStartedAt) {
    this.processingDuration = Date.now() - this.processingStartedAt.getTime();
  }
  await this.save();
};

// Method to mark as failed
mediaSchema.methods.markAsFailed = async function(error) {
  this.processingStatus = 'failed';
  this.processingError = error;
  this.processingCompletedAt = new Date();
  if (this.processingStartedAt) {
    this.processingDuration = Date.now() - this.processingStartedAt.getTime();
  }
  await this.save();
};

// Method to soft delete
mediaSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

// Static method to get media by user
mediaSchema.statics.getUserMedia = function(userId, options = {}) {
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

  return this.find(query)
    .populate('postId', 'title content')
    .populate('commentId', 'content')
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

// Static method to get media by post
mediaSchema.statics.getPostMedia = function(postId) {
  return this.find({
    postId: new mongoose.Types.ObjectId(postId),
    isDeleted: false,
    isPublic: true
  })
    .populate('userId', 'name username avatar')
    .sort({ createdAt: 1 });
};

// Static method to get media by comment
mediaSchema.statics.getCommentMedia = function(commentId) {
  return this.find({
    commentId: new mongoose.Types.ObjectId(commentId),
    isDeleted: false,
    isPublic: true
  })
    .populate('userId', 'name username avatar')
    .sort({ createdAt: 1 });
};

// Static method to get processing queue
mediaSchema.statics.getProcessingQueue = function(limit = 50) {
  return this.find({
    processingStatus: { $in: ['pending', 'processing'] },
    isDeleted: false
  })
    .sort({ createdAt: 1 })
    .limit(limit);
};

// Static method to get expired media
mediaSchema.statics.getExpiredMedia = function() {
  return this.find({
    expiresAt: { $lte: new Date() },
    isDeleted: false
  });
};

// Static method to get media statistics
mediaSchema.statics.getMediaStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalMedia: { $sum: 1 },
        totalSize: { $sum: '$fileSize' },
        imageCount: { $sum: { $cond: [{ $eq: ['$mediaType', 'image'] }, 1, 0] } },
        videoCount: { $sum: { $cond: [{ $eq: ['$mediaType', 'video'] }, 1, 0] } },
        gifCount: { $sum: { $cond: [{ $eq: ['$mediaType', 'gif'] }, 1, 0] } },
        audioCount: { $sum: { $cond: [{ $eq: ['$mediaType', 'audio'] }, 1, 0] } },
        documentCount: { $sum: { $cond: [{ $eq: ['$mediaType', 'document'] }, 1, 0] } },
        pendingProcessing: { $sum: { $cond: [{ $eq: ['$processingStatus', 'pending'] }, 1, 0] } },
        processing: { $sum: { $cond: [{ $eq: ['$processingStatus', 'processing'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$processingStatus', 'completed'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$processingStatus', 'failed'] }, 1, 0] } },
        totalViews: { $sum: '$viewCount' },
        totalDownloads: { $sum: '$downloadCount' },
        totalShares: { $sum: '$shareCount' }
      }
    }
  ]);
};

// Static method to search media
mediaSchema.statics.searchMedia = function(query, options = {}) {
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

  return this.find(searchQuery)
    .populate('userId', 'name username avatar')
    .populate('postId', 'title content')
    .sort(sort)
    .limit(limit)
    .skip(skip);
};

// Pre-save middleware to set file extension
mediaSchema.pre('save', function(next) {
  if (this.isModified('originalName') && !this.fileExtension) {
    this.fileExtension = this.originalName.split('.').pop().toLowerCase();
  }
  next();
});

// Pre-save middleware to set media type based on mime type
mediaSchema.pre('save', function(next) {
  if (this.isModified('mimeType') && !this.mediaType) {
    if (this.mimeType.startsWith('image/')) {
      this.mediaType = this.mimeType === 'image/gif' ? 'gif' : 'image';
    } else if (this.mimeType.startsWith('video/')) {
      this.mediaType = 'video';
    } else if (this.mimeType.startsWith('audio/')) {
      this.mediaType = 'audio';
    } else {
      this.mediaType = 'document';
    }
  }
  next();
});

const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
