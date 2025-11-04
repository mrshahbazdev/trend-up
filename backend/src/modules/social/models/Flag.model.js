/**
 * Flag Model
 * Represents content flags from users or automated systems
 */

const mongoose = require('mongoose');


const flagSchema = new mongoose.Schema({
  // Content being flagged
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  contentType: {
    type: String,
    required: true,
    enum: ['post', 'comment', 'user', 'media']
  },
  
  // Flagging information
  flaggerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flagType: {
    type: String,
    required: true,
    enum: [
      'spam', 'harassment', 'hate_speech', 'inappropriate_content',
      'violence', 'nudity', 'fake_news', 'copyright_violation',
      'impersonation', 'doxxing', 'self_harm', 'terrorism',
      'automated_spam', 'automated_inappropriate', 'automated_hate'
    ]
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  evidence: [{
    type: String, // URLs or text evidence
    description: String
  }],
  
  // Flag status and processing
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed', 'escalated'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Moderation actions
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  action: {
    type: String,
    enum: ['no_action', 'content_hidden', 'content_removed', 'user_warned', 'user_suspended', 'user_banned', 'escalated']
  },
  actionReason: String,
  
  // Automated flagging
  isAutomated: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  
  // Appeal information
  appealable: {
    type: Boolean,
    default: true
  },
  appealedAt: Date,
  appealStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  
  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    location: {
      country: String,
      region: String,
      city: String
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
flagSchema.index({ contentId: 1, contentType: 1 });
flagSchema.index({ flaggerId: 1, createdAt: -1 });
flagSchema.index({ status: 1, priority: 1, createdAt: -1 });
flagSchema.index({ flagType: 1, status: 1 });
flagSchema.index({ isAutomated: 1, confidence: -1 });
flagSchema.index({ reviewedBy: 1, reviewedAt: -1 });

// Virtual for flag age
flagSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for is urgent (high priority and old)
flagSchema.virtual('isUrgent').get(function() {
  return this.priority === 'critical' && this.age > 3600000; // 1 hour
});

// Pre-save middleware
flagSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-set priority based on flag type
  if (this.isNew) {
    const criticalFlags = ['terrorism', 'self_harm', 'doxxing'];
    const highFlags = ['hate_speech', 'harassment', 'violence', 'nudity'];
    
    if (criticalFlags.includes(this.flagType)) {
      this.priority = 'critical';
    } else if (highFlags.includes(this.flagType)) {
      this.priority = 'high';
    } else if (this.isAutomated && this.confidence > 0.8) {
      this.priority = 'high';
    }
  }
  
  next();
});

// Static methods
flagSchema.statics.getFlagStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

flagSchema.statics.getFlagTypesStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$flagType',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

flagSchema.statics.getPendingFlags = function(limit = 50) {
  return this.find({ status: 'pending' })
    .populate('flaggerId', 'username email')
    .populate('contentId')
    .sort({ priority: -1, createdAt: 1 })
    .limit(limit);
};

// Instance methods
flagSchema.methods.resolve = function(reviewerId, action, reason) {
  this.status = 'resolved';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.action = action;
  this.actionReason = reason;
  return this.save();
};

flagSchema.methods.escalate = function(reviewerId, reason) {
  this.status = 'escalated';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.action = 'escalated';
  this.actionReason = reason;
  return this.save();
};

flagSchema.methods.dismiss = function(reviewerId, reason) {
  this.status = 'dismissed';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.action = 'no_action';
  this.actionReason = reason;
  return this.save();
};

const Flag = mongoose.model('Flag', flagSchema);
module.exports = Flag;
