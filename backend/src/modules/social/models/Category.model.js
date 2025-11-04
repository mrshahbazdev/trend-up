const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    icon: {
      type: String,
      default: null, // URL to category icon
    },
    color: {
      type: String,
      default: '#3B82F6', // Default blue color
      match: /^#[0-9A-F]{6}$/i,
    },
    // Category hierarchy
    parentCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 2, // Maximum 3 levels deep
    },
    // Category settings
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    // Moderation settings
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    allowUserPosts: {
      type: Boolean,
      default: true,
    },
    // Statistics
    postCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    followerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Category rules and guidelines
    rules: [{
      title: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        required: true,
        trim: true,
      },
    }],
    // Category tags for better organization
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    // SEO and discovery
    keywords: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    // Category metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
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
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategoryId: 1, level: 1 });
categorySchema.index({ isActive: 1, isPublic: 1 });
categorySchema.index({ postCount: -1 });
categorySchema.index({ followerCount: -1 });
categorySchema.index({ lastActivityAt: -1 });
categorySchema.index({ tags: 1 });
categorySchema.index({ keywords: 1 });

// Virtual for parent category
categorySchema.virtual('parentCategory', {
  ref: 'Category',
  localField: 'parentCategoryId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategoryId',
});

// Virtual for creator
categorySchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim('-'); // Remove leading/trailing hyphens
  }
  next();
});

// Pre-save middleware to set level based on parent
categorySchema.pre('save', function(next) {
  if (this.parentCategoryId) {
    // This will be set when we populate the parent category
    // For now, we'll handle this in the service layer
  } else {
    this.level = 0;
  }
  next();
});

// Method to increment post count
categorySchema.methods.incrementPostCount = async function(count = 1) {
  this.postCount += count;
  this.lastActivityAt = new Date();
  await this.save();
};

// Method to decrement post count
categorySchema.methods.decrementPostCount = async function(count = 1) {
  this.postCount = Math.max(0, this.postCount - count);
  await this.save();
};

// Method to increment follower count
categorySchema.methods.incrementFollowerCount = async function(count = 1) {
  this.followerCount += count;
  await this.save();
};

// Method to decrement follower count
categorySchema.methods.decrementFollowerCount = async function(count = 1) {
  this.followerCount = Math.max(0, this.followerCount - count);
  await this.save();
};

// Static method to get categories with hierarchy
categorySchema.statics.getCategoryHierarchy = function(filter = {}) {
  return this.find({ ...filter, isActive: true })
    .populate('parentCategory', 'name slug')
    .populate('subcategories', 'name slug postCount')
    .sort({ level: 1, name: 1 });
};

// Static method to get popular categories
categorySchema.statics.getPopularCategories = function(limit = 20) {
  return this.find({ isActive: true, isPublic: true })
    .sort({ postCount: -1, followerCount: -1 })
    .limit(limit)
    .populate('createdBy', 'name username avatar');
};

// Static method to search categories
categorySchema.statics.searchCategories = function(query, options = {}) {
  const { limit = 20, offset = 0 } = options;
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } },
      { keywords: { $in: [searchRegex] } }
    ],
    isActive: true,
    isPublic: true
  })
    .sort({ postCount: -1, name: 1 })
    .skip(offset)
    .limit(limit)
    .populate('createdBy', 'name username avatar');
};

// Static method to get category statistics
categorySchema.statics.getCategoryStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalCategories: { $sum: 1 },
        activeCategories: { $sum: { $cond: ['$isActive', 1, 0] } },
        publicCategories: { $sum: { $cond: ['$isPublic', 1, 0] } },
        totalPosts: { $sum: '$postCount' },
        totalFollowers: { $sum: '$followerCount' },
        averagePostsPerCategory: { $avg: '$postCount' }
      }
    }
  ]);
};

// Static method to get trending categories
categorySchema.statics.getTrendingCategories = function(timeframe = 7, limit = 10) {
  const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
  
  return this.find({
    isActive: true,
    isPublic: true,
    lastActivityAt: { $gte: startDate },
    postCount: { $gt: 0 }
  })
    .sort({ postCount: -1, lastActivityAt: -1 })
    .limit(limit)
    .populate('createdBy', 'name username avatar');
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
