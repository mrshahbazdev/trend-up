/**
 * Moderation Service
 * Centralized moderation management and coordination
 */

const { logger } = require('../utils/logger');

const { Flag, Report, ModerationAction } = require('../../modules/social/models');
const contentFilterService = require('./content-filter.service');
const realtimeService = require('./realtime.service.simple');

class ModerationService {
  constructor() {
    this.autoModerationEnabled = true;
    this.autoActionThresholds = {
      spam: 0.8,
      hate_speech: 0.7,
      harassment: 0.6,
      inappropriate_content: 0.7,
      violence: 0.7
    };
  }

  /**
   * Initialize moderation service
   */
  async initialize() {
    try {
      logger.info('[ModerationService] Initialized successfully');
    } catch (error) {
      logger.error('[ModerationService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a user report
   */
  async createReport(reporterId, reportedId, reportedType, reportType, description, evidence = []) {
    try {
      const report = new Report({
        reporterId,
        reportedId,
        reportedType,
        reportType,
        description,
        evidence,
        metadata: {
          userAgent: 'ModerationService',
          ipAddress: '127.0.0.1'
        }
      });

      await report.save();
      
      // Emit real-time event
      await realtimeService.emitEvent('report:created', {
        reportId: report._id,
        reporterId,
        reportedId,
        reportedType,
        reportType
      });

      logger.info(`[ModerationService] Report created: ${report._id}`);
      return report;
    } catch (error) {
      logger.error('[ModerationService] Error creating report:', error);
      throw error;
    }
  }

  /**
   * Create a flag
   */
  async createFlag(contentId, contentType, flaggerId, flagType, reason, evidence = []) {
    try {
      const flag = new Flag({
        contentId,
        contentType,
        flaggerId,
        flagType,
        reason,
        evidence,
        metadata: {
          userAgent: 'ModerationService',
          ipAddress: '127.0.0.1'
        }
      });

      await flag.save();
      
      // Emit real-time event
      await realtimeService.emitEvent('flag:created', {
        flagId: flag._id,
        contentId,
        contentType,
        flaggerId,
        flagType
      });

      logger.info(`[ModerationService] Flag created: ${flag._id}`);
      return flag;
    } catch (error) {
      logger.error('[ModerationService] Error creating flag:', error);
      throw error;
    }
  }

  /**
   * Process content for moderation
   */
  async processContent(content, contentType, contentId, userId) {
    try {
      if (!this.autoModerationEnabled) {
        return { processed: false, reason: 'Auto-moderation disabled' };
      }

      const analysis = await contentFilterService.processContent(content, contentType, contentId, userId);
      
      if (analysis.violations.length > 0) {
        // Emit real-time event for moderation team
        await realtimeService.emitEvent('content:flagged', {
          contentId,
          contentType,
          violations: analysis.violations,
          riskLevel: analysis.riskLevel
        });

        logger.info(`[ModerationService] Content processed: ${analysis.violations.length} violations detected`);
      }

      return analysis;
    } catch (error) {
      logger.error('[ModerationService] Error processing content:', error);
      throw error;
    }
  }

  /**
   * Resolve a flag
   */
  async resolveFlag(flagId, moderatorId, action, reason) {
    try {
      const flag = await Flag.findById(flagId);
      if (!flag) {
        throw new Error('Flag not found');
      }

      await flag.resolve(moderatorId, action, reason);

      // Create moderation action record
      const moderationAction = new ModerationAction({
        actionType: `flag_${action}`,
        targetId: flag.contentId,
        targetType: flag.contentType,
        moderatorId,
        moderatorRole: 'moderator',
        reason: `Flag resolved: ${reason}`,
        relatedFlagId: flagId,
        impact: {
          contentHidden: action === 'content_hidden',
          userAffected: action.includes('user')
        }
      });

      await moderationAction.save();

      // Emit real-time event
      await realtimeService.emitEvent('flag:resolved', {
        flagId,
        moderatorId,
        action,
        reason
      });

      logger.info(`[ModerationService] Flag resolved: ${flagId}`);
      return { flag, action: moderationAction };
    } catch (error) {
      logger.error('[ModerationService] Error resolving flag:', error);
      throw error;
    }
  }

  /**
   * Resolve a report
   */
  async resolveReport(reportId, moderatorId, resolution, reason, notes = '') {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      await report.resolve(moderatorId, resolution, reason, notes);

      // Create moderation action record
      const moderationAction = new ModerationAction({
        actionType: `report_${resolution}`,
        targetId: report.reportedId,
        targetType: report.reportedType,
        moderatorId,
        moderatorRole: 'moderator',
        reason: `Report resolved: ${reason}`,
        details: notes,
        relatedReportId: reportId,
        impact: {
          contentHidden: resolution === 'content_hidden',
          userAffected: resolution.includes('user')
        }
      });

      await moderationAction.save();

      // Emit real-time event
      await realtimeService.emitEvent('report:resolved', {
        reportId,
        moderatorId,
        resolution,
        reason
      });

      logger.info(`[ModerationService] Report resolved: ${reportId}`);
      return { report, action: moderationAction };
    } catch (error) {
      logger.error('[ModerationService] Error resolving report:', error);
      throw error;
    }
  }

  /**
   * Take moderation action
   */
  async takeAction(actionType, targetId, targetType, moderatorId, reason, details = '', duration = null) {
    try {
      const action = new ModerationAction({
        actionType,
        targetId,
        targetType,
        moderatorId,
        moderatorRole: 'moderator',
        reason,
        details,
        duration,
        impact: {
          contentHidden: actionType.includes('hidden'),
          userAffected: actionType.includes('user')
        }
      });

      await action.save();

      // Emit real-time event
      await realtimeService.emitEvent('moderation:action', {
        actionId: action._id,
        actionType,
        targetId,
        targetType,
        moderatorId
      });

      logger.info(`[ModerationService] Action taken: ${actionType} on ${targetType}:${targetId}`);
      return action;
    } catch (error) {
      logger.error('[ModerationService] Error taking action:', error);
      throw error;
    }
  }

  /**
   * Get moderation dashboard data
   */
  async getDashboardData() {
    try {
      const [
        flagStats,
        reportStats,
        actionStats,
        pendingFlags,
        pendingReports,
        recentActions
      ] = await Promise.all([
        Flag.getFlagStats().catch(err => {
          logger.error('[ModerationService] Error getting flag stats:', err);
          return [];
        }),
        Report.getReportStats().catch(err => {
          logger.error('[ModerationService] Error getting report stats:', err);
          return [];
        }),
        ModerationAction.getActionStats().catch(err => {
          logger.error('[ModerationService] Error getting action stats:', err);
          return [];
        }),
        Flag.getPendingFlags(10).catch(err => {
          logger.error('[ModerationService] Error getting pending flags:', err);
          return [];
        }),
        Report.getPendingReports(10).catch(err => {
          logger.error('[ModerationService] Error getting pending reports:', err);
          return [];
        }),
        ModerationAction.find()
          .populate('moderatorId', 'username email')
          .sort({ createdAt: -1 })
          .limit(20)
          .catch(err => {
            logger.error('[ModerationService] Error getting recent actions:', err);
            return [];
          })
      ]);

      return {
        flags: {
          stats: flagStats,
          pending: pendingFlags
        },
        reports: {
          stats: reportStats,
          pending: pendingReports
        },
        actions: {
          stats: actionStats,
          recent: recentActions
        },
        summary: {
          totalPending: pendingFlags.length + pendingReports.length,
          criticalPending: pendingFlags.filter(f => f.priority === 'critical').length +
                          pendingReports.filter(r => r.priority === 'critical').length
        }
      };
    } catch (error) {
      logger.error('[ModerationService] Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get user moderation history
   */
  async getUserModerationHistory(userId, limit = 50) {
    try {
      const [flags, reports, actions] = await Promise.all([
        Flag.find({ flaggerId: userId }).sort({ createdAt: -1 }).limit(limit),
        Report.find({ reporterId: userId }).sort({ createdAt: -1 }).limit(limit),
        ModerationAction.getActionsByUser(userId, limit)
      ]);

      return {
        flags,
        reports,
        actions
      };
    } catch (error) {
      logger.error('[ModerationService] Error getting user moderation history:', error);
      throw error;
    }
  }

  /**
   * Get content moderation status
   */
  async getContentModerationStatus(contentId, contentType) {
    try {
      const [flags, reports, actions] = await Promise.all([
        Flag.find({ contentId, contentType }),
        Report.find({ reportedId: contentId, reportedType: contentType }),
        ModerationAction.getActiveActions(contentId, contentType)
      ]);

      return {
        flags,
        reports,
        actions,
        status: actions.length > 0 ? 'moderated' : 'active',
        riskLevel: flags.length > 0 ? 'flagged' : 'clean'
      };
    } catch (error) {
      logger.error('[ModerationService] Error getting content moderation status:', error);
      throw error;
    }
  }

  /**
   * Update auto-moderation settings
   */
  async updateAutoModerationSettings(settings) {
    try {
      this.autoModerationEnabled = settings.enabled !== undefined ? settings.enabled : this.autoModerationEnabled;
      
      if (settings.thresholds) {
        this.autoActionThresholds = { ...this.autoActionThresholds, ...settings.thresholds };
      }

      logger.info('[ModerationService] Auto-moderation settings updated');
      return {
        enabled: this.autoModerationEnabled,
        thresholds: this.autoActionThresholds
      };
    } catch (error) {
      logger.error('[ModerationService] Error updating auto-moderation settings:', error);
      throw error;
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats() {
    try {
      const [
        flagStats,
        reportStats,
        actionStats,
        filterStats
      ] = await Promise.all([
        Flag.getFlagTypesStats(),
        Report.getReportTypesStats(),
        ModerationAction.getActionStats(),
        contentFilterService.getFilterStats()
      ]);

      return {
        flags: flagStats,
        reports: reportStats,
        actions: actionStats,
        filters: filterStats,
        autoModeration: {
          enabled: this.autoModerationEnabled,
          thresholds: this.autoActionThresholds
        }
      };
    } catch (error) {
      logger.error('[ModerationService] Error getting moderation stats:', error);
      throw error;
    }
  }

  /**
   * Close the moderation service
   */
  async close() {
    try {
      logger.info('[ModerationService] Closed successfully');
    } catch (error) {
      logger.error('[ModerationService] Close error:', error);
    }
  }
}

module.exports = new ModerationService();
