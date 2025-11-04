/**
 * Report Model
 * Represents user reports for content or users
 */

const mongoose = require('mongoose');


const reportSchema = new mongoose.Schema({
  // Reporter information
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Reported content/user
  reportedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  reportedType: {
    type: String,
    required: true,
    enum: ['post', 'comment', 'user', 'media', 'poll', 'prediction']
  },
  
  // Report details
  reportType: {
    type: String,
    required: true,
    enum: [
      'spam', 'harassment', 'hate_speech', 'inappropriate_content',
      'violence', 'nudity', 'fake_news', 'copyright_violation',
      'impersonation', 'doxxing', 'self_harm', 'terrorism',
      'scam', 'phishing', 'malware', 'other'
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  evidence: [{
    type: String, // URLs or text evidence
    description: String
  }],
  
  // Report status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed', 'escalated'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Moderation response
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  resolution: {
    type: String,
    enum: ['no_action', 'content_hidden', 'content_removed', 'user_warned', 'user_suspended', 'user_banned', 'escalated']
  },
  resolutionReason: String,
  resolutionNotes: String,
  
  // Follow-up
  reporterNotified: {
    type: Boolean,
    default: false
  },
  notificationSentAt: Date,
  
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
    },
    deviceInfo: {
      type: String,
      os: String,
      browser: String
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
reportSchema.index({ reportedId: 1, reportedType: 1 });
reportSchema.index({ reporterId: 1, createdAt: -1 });
reportSchema.index({ status: 1, priority: 1, createdAt: -1 });
reportSchema.index({ reportType: 1, status: 1 });
reportSchema.index({ assignedTo: 1, status: 1 });
reportSchema.index({ reviewedBy: 1, reviewedAt: -1 });

// Virtual for report age
reportSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for is urgent
reportSchema.virtual('isUrgent').get(function() {
  return this.priority === 'critical' && this.age > 1800000; // 30 minutes
});

// Pre-save middleware
reportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-set priority based on report type
  if (this.isNew) {
    const criticalReports = ['terrorism', 'self_harm', 'doxxing'];
    const highReports = ['hate_speech', 'harassment', 'violence', 'nudity'];
    
    if (criticalReports.includes(this.reportType)) {
      this.priority = 'critical';
    } else if (highReports.includes(this.reportType)) {
      this.priority = 'high';
    }
  }
  
  next();
});

// Static methods
reportSchema.statics.getReportStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

reportSchema.statics.getReportTypesStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$reportType',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

reportSchema.statics.getPendingReports = function(limit = 50) {
  return this.find({ status: 'pending' })
    .populate('reporterId', 'username email')
    .populate('reportedId')
    .sort({ priority: -1, createdAt: 1 })
    .limit(limit);
};

reportSchema.statics.getReportsByUser = function(userId, limit = 20) {
  return this.find({ reporterId: userId })
    .populate('reportedId')
    .sort({ createdAt: -1 })
    .limit(limit);
};

reportSchema.statics.getReportsAgainstUser = function(userId, limit = 20) {
  return this.find({ 
    reportedId: userId, 
    reportedType: 'user' 
  })
    .populate('reporterId', 'username email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Instance methods
reportSchema.methods.assign = function(moderatorId) {
  this.assignedTo = moderatorId;
  this.status = 'under_review';
  return this.save();
};

reportSchema.methods.resolve = function(reviewerId, resolution, reason, notes) {
  this.status = 'resolved';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.resolution = resolution;
  this.resolutionReason = reason;
  this.resolutionNotes = notes;
  return this.save();
};

reportSchema.methods.escalate = function(reviewerId, reason) {
  this.status = 'escalated';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.resolution = 'escalated';
  this.resolutionReason = reason;
  return this.save();
};

reportSchema.methods.dismiss = function(reviewerId, reason) {
  this.status = 'dismissed';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.resolution = 'no_action';
  this.resolutionReason = reason;
  return this.save();
};

reportSchema.methods.notifyReporter = function() {
  this.reporterNotified = true;
  this.notificationSentAt = new Date();
  return this.save();
};

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
