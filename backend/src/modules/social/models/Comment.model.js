const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'Post ID is required'],
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      trim: true,
    },
    // Engagement metrics
    reactionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    replyCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Threading level (max 3 levels deep)
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 2,
    },
    // Status and moderation
    status: {
      type: String,
      enum: ['approved', 'flagged', 'removed'],
      default: 'approved',
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    // Metadata
    editedAt: Date,
    isEdited: {
      type: Boolean,
      default: false,
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
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1, createdAt: 1 });
commentSchema.index({ level: 1, postId: 1 });
commentSchema.index({ status: 1, isDeleted: 1 });

// Virtual for author
commentSchema.virtual('author', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for post
commentSchema.virtual('post', {
  ref: 'Post',
  localField: 'postId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for parent comment
commentSchema.virtual('parentComment', {
  ref: 'Comment',
  localField: 'parentCommentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentCommentId',
});

// Virtual for reactions
commentSchema.virtual('reactions', {
  ref: 'Reaction',
  localField: '_id',
  foreignField: 'commentId',
});

// Method to increment reaction count
commentSchema.methods.incrementReactions = async function(count = 1) {
  this.reactionsCount += count;
  await this.save();
};

// Method to increment reply count
commentSchema.methods.incrementReplies = async function(count = 1) {
  this.replyCount += count;
  await this.save();
};

// Method to mark as edited
commentSchema.methods.markAsEdited = async function() {
  this.isEdited = true;
  this.editedAt = new Date();
  await this.save();
};

// Static method to get comments for a post with pagination and nesting
commentSchema.statics.getPostComments = function(postId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeReplies = true,
    maxLevel = 2,
  } = options;

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  let query = {
    postId: new mongoose.Types.ObjectId(postId),
    isDeleted: false,
    status: 'approved',
  };

  // If not including replies, only get top-level comments
  if (!includeReplies) {
    query.parentCommentId = null;
  } else {
    // Limit nesting level
    query.level = { $lte: maxLevel };
  }

  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('author', 'name username avatar karmaScore karmaLevel badges')
    .populate({
      path: 'replies',
      match: { isDeleted: false, status: 'approved' },
      options: { sort: { createdAt: 1 }, limit: 5 }, // Limit replies per comment
      populate: {
        path: 'author',
        select: 'name username avatar karmaScore karmaLevel badges',
      },
    });
};

// Static method to get comment thread (all replies to a specific comment)
commentSchema.statics.getCommentThread = function(commentId, options = {}) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  return this.find({
    $or: [
      { _id: new mongoose.Types.ObjectId(commentId) },
      { parentCommentId: new mongoose.Types.ObjectId(commentId) },
    ],
    isDeleted: false,
    status: 'approved',
  })
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name username avatar karmaScore karmaLevel badges');
};

// Static method to get user's comments
commentSchema.statics.getUserComments = function(userId, options = {}) {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  return this.find({
    userId: new mongoose.Types.ObjectId(userId),
    isDeleted: false,
    status: 'approved',
  })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('postId', 'content postType category')
    .populate('author', 'name username avatar karmaScore karmaLevel badges');
};

// Pre-save middleware to calculate level based on parent (Reddit-style)
commentSchema.pre('save', async function(next) {
  if (this.isNew && this.parentCommentId) {
    const parentComment = await this.constructor.findById(this.parentCommentId);
    if (parentComment) {
      this.level = parentComment.level + 1;
      
      // Reddit-style flattening: after level 2, make new replies siblings
      if (this.level > 2) {
        // Find the level 2 parent and make this a sibling
        let currentParent = parentComment;
        while (currentParent && currentParent.level > 2) {
          currentParent = await this.constructor.findById(currentParent.parentCommentId);
        }
        
        if (currentParent && currentParent.level === 2) {
          // Make this comment a sibling of the level 2 comment
          this.parentCommentId = currentParent.parentCommentId;
          this.level = 2; // Keep at level 2
        } else if (currentParent && currentParent.level === 1) {
          // If we can't find a level 2 parent, make it a sibling of level 1
          this.parentCommentId = currentParent.parentCommentId;
          this.level = 1;
        }
      }
    }
  }
  next();
});

// Post-save middleware to update parent comment's reply count
commentSchema.post('save', async function(doc, next) {
  if (doc.isNew && doc.parentCommentId) {
    await this.constructor.findByIdAndUpdate(
      doc.parentCommentId,
      { $inc: { replyCount: 1 } }
    );
  }
  next();
});

// Post-remove middleware to update parent comment's reply count
commentSchema.post('remove', async function(doc, next) {
  if (doc.parentCommentId) {
    await this.constructor.findByIdAndUpdate(
      doc.parentCommentId,
      { $inc: { replyCount: -1 } }
    );
  }
  next();
});

// Pre-find middleware to exclude deleted comments
commentSchema.pre(/^find/, function(next) {
  this.where({ isDeleted: false });
  next();
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
