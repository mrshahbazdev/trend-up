/**
 * ModerationAction Model
 * Tracks all moderation actions taken by moderators or automated systems
 */

const mongoose = require('mongoose');


const moderationActionSchema = new mongoose.Schema({
  // Action details
  actionType: {
    type: String,
    required: true,
    enum: [
      'content_hidden', 'content_removed', 'content_restored',
      'user_warned', 'user_suspended', 'user_banned', 'user_unbanned',
      'comment_hidden', 'comment_removed', 'comment_restored',
      'post_hidden', 'post_removed', 'post_restored',
      'media_hidden', 'media_removed', 'media_restored',
      'poll_hidden', 'poll_removed', 'poll_restored',
      'prediction_hidden', 'prediction_removed', 'prediction_restored',
      'flag_resolved', 'flag_dismissed', 'flag_escalated',
      'report_resolved', 'report_dismissed', 'report_escalated',
      'automated_action', 'bulk_action'
    ]
  },
  
  // Target of the action
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  targetType: {
    type: String,
    required: true,
    enum: ['post', 'comment', 'user', 'media', 'poll', 'prediction', 'flag', 'report']
  },
  
  // Moderator information
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderatorRole: {
    type: String,
    enum: ['admin', 'moderator', 'automated', 'system'],
    required: true,
    index: true
  },
  
  // Action details
  reason: {
    type: String,
    required: true,
    maxlength: 1000
  },
  details: {
    type: String,
    maxlength: 2000
  },
  
  // Duration for temporary actions
  duration: {
    type: Number, // in seconds
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Related items
  relatedFlagId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flag'
  },
  relatedReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },
  
  // Action status
  status: {
    type: String,
    enum: ['active', 'expired', 'reversed', 'escalated'],
    default: 'active'
  },
  
  // Reversal information
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reversedAt: Date,
  reversalReason: String,
  
  // Impact tracking
  impact: {
    contentHidden: { type: Boolean, default: false },
    userAffected: { type: Boolean, default: false },
    karmaDeducted: { type: Number, default: 0 },
    notificationsSent: { type: Number, default: 0 }
  },
  
  // Automated action details
  isAutomated: {
    type: Boolean,
    default: false
  },
  automationRule: {
    type: String,
    default: null
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 1.0
  },
  
  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    location: {
      country: String,
      region: String,
      city: String
    },
    sessionId: String,
    requestId: String
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
moderationActionSchema.index({ targetId: 1, targetType: 1 });
moderationActionSchema.index({ moderatorId: 1, createdAt: -1 });
moderationActionSchema.index({ actionType: 1, status: 1 });
moderationActionSchema.index({ status: 1, createdAt: -1 });
moderationActionSchema.index({ expiresAt: 1, status: 1 });
moderationActionSchema.index({ isAutomated: 1, automationRule: 1 });

// Virtual for action age
moderationActionSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for is expired
moderationActionSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Pre-save middleware
moderationActionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set expiration date if duration is provided
  if (this.duration && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + (this.duration * 1000));
  }
  
  // Check if action has expired
  if (this.isExpired && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

// Static methods
moderationActionSchema.statics.getActionStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$actionType',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

moderationActionSchema.statics.getModeratorStats = function(moderatorId) {
  return this.aggregate([
    { $match: { moderatorId: mongoose.Types.ObjectId(moderatorId) } },
    {
      $group: {
        _id: '$actionType',
        count: { $sum: 1 },
        lastAction: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

moderationActionSchema.statics.getActiveActions = function(targetId, targetType) {
  return this.find({
    targetId: targetId,
    targetType: targetType,
    status: 'active'
  }).sort({ createdAt: -1 });
};

moderationActionSchema.statics.getExpiredActions = function() {
  return this.find({
    expiresAt: { $lt: new Date() },
    status: 'active'
  });
};

moderationActionSchema.statics.getActionsByUser = function(userId, limit = 50) {
  return this.find({
    $or: [
      { moderatorId: userId },
      { targetId: userId, targetType: 'user' }
    ]
  })
    .populate('moderatorId', 'username email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Instance methods
moderationActionSchema.methods.reverse = function(reverserId, reason) {
  this.status = 'reversed';
  this.reversedBy = reverserId;
  this.reversedAt = new Date();
  this.reversalReason = reason;
  return this.save();
};

moderationActionSchema.methods.escalate = function(escalatorId, reason) {
  this.status = 'escalated';
  this.reversedBy = escalatorId;
  this.reversedAt = new Date();
  this.reversalReason = reason;
  return this.save();
};

moderationActionSchema.methods.extend = function(additionalDuration) {
  if (this.expiresAt) {
    this.expiresAt = new Date(this.expiresAt.getTime() + (additionalDuration * 1000));
    this.duration += additionalDuration;
  }
  return this.save();
};

moderationActionSchema.methods.getImpactSummary = function() {
  const impacts = [];
  
  if (this.impact.contentHidden) impacts.push('Content hidden');
  if (this.impact.userAffected) impacts.push('User affected');
  if (this.impact.karmaDeducted > 0) impacts.push(`${this.impact.karmaDeducted} karma deducted`);
  if (this.impact.notificationsSent > 0) impacts.push(`${this.impact.notificationsSent} notifications sent`);
  
  return impacts.join(', ') || 'No direct impact';
};

const ModerationAction = mongoose.model('ModerationAction', moderationActionSchema);
module.exports = ModerationAction;
