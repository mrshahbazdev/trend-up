/**
 * Moderation Controller
 * Handles moderation-related API endpoints
 */

const { sendSuccessResponse, sendErrorResponse } = require('../../../core/utils/response');
const { logger } = require('../../../core/utils/logger');

const moderationService = require('../../../core/services/moderation.service');
const contentFilterService = require('../../../core/services/content-filter.service');
const { Flag, Report, ModerationAction } = require('../models');

class ModerationController {
  /**
   * Create a report
   */
  async createReport(req, res) {
    try {
      const { reportedId, reportedType, reportType, description, evidence } = req.body;
      const reporterId = req.user.id;

      if (!reportedId || !reportedType || !reportType || !description) {
        return sendErrorResponse(res, 'Missing required fields', 400);
      }

      const report = await moderationService.createReport(
        reporterId,
        reportedId,
        reportedType,
        reportType,
        description,
        evidence || []
      );

      sendSuccessResponse(res, report, 'Report created successfully');
    } catch (error) {
      logger.error('[ModerationController] Create report error:', error);
      sendErrorResponse(res, 'Failed to create report', 500, { error: error.message });
    }
  }

  /**
   * Create a flag
   */
  async createFlag(req, res) {
    try {
      const { contentId, contentType, flagType, reason, evidence } = req.body;
      const flaggerId = req.user.id;

      if (!contentId || !contentType || !flagType || !reason) {
        return sendErrorResponse(res, 'Missing required fields', 400);
      }

      const flag = await moderationService.createFlag(
        contentId,
        contentType,
        flaggerId,
        flagType,
        reason,
        evidence || []
      );

      sendSuccessResponse(res, flag, 'Flag created successfully');
    } catch (error) {
      logger.error('[ModerationController] Create flag error:', error);
      sendErrorResponse(res, 'Failed to create flag', 500, { error: error.message });
    }
  }

  /**
   * Get moderation dashboard data
   */
  async getDashboard(req, res) {
    try {
      const dashboardData = await moderationService.getDashboardData();
      sendSuccessResponse(res, dashboardData, 'Dashboard data retrieved successfully');
    } catch (error) {
      logger.error('[ModerationController] Get dashboard error:', error);
      sendErrorResponse(res, 'Failed to get dashboard data', 500, { error: error.message });
    }
  }

  /**
   * Get pending flags
   */
  async getPendingFlags(req, res) {
    try {
      const { limit = 50, page = 1 } = req.query;
      const skip = (page - 1) * limit;

      const flags = await Flag.find({ status: 'pending' })
        .populate('flaggerId', 'username email')
        .populate('contentId')
        .sort({ priority: -1, createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Flag.countDocuments({ status: 'pending' });

      sendSuccessResponse(res, {
        flags,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }, 'Pending flags retrieved successfully');
    } catch (error) {
      logger.error('[ModerationController] Get pending flags error:', error);
      sendErrorResponse(res, 'Failed to get pending flags', 500, { error: error.message });
    }
  }

  /**
   * Get pending reports
   */
  async getPendingReports(req, res) {
    try {
      const { limit = 50, page = 1 } = req.query;
      const skip = (page - 1) * limit;

      const reports = await Report.find({ status: 'pending' })
        .populate('reporterId', 'username email')
        .populate('reportedId')
        .sort({ priority: -1, createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Report.countDocuments({ status: 'pending' });

      sendSuccessResponse(res, {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }, 'Pending reports retrieved successfully');
    } catch (error) {
      logger.error('[ModerationController] Get pending reports error:', error);
      sendErrorResponse(res, 'Failed to get pending reports', 500, { error: error.message });
    }
  }

  /**
   * Resolve a flag
   */
  async resolveFlag(req, res) {
    try {
      const { flagId } = req.params;
      const { action, reason } = req.body;
      const moderatorId = req.user.id;

      if (!action || !reason) {
        return sendErrorResponse(res, 'Action and reason are required', 400);
      }

      const result = await moderationService.resolveFlag(flagId, moderatorId, action, reason);
      sendSuccessResponse(res, result, 'Flag resolved successfully');
    } catch (error) {
      logger.error('[ModerationController] Resolve flag error:', error);
      sendErrorResponse(res, 'Failed to resolve flag', 500, { error: error.message });
    }
  }

  /**
   * Resolve a report
   */
  async resolveReport(req, res) {
    try {
      const { reportId } = req.params;
      const { resolution, reason, notes } = req.body;
      const moderatorId = req.user.id;

      if (!resolution || !reason) {
        return sendErrorResponse(res, 'Resolution and reason are required', 400);
      }

      const result = await moderationService.resolveReport(reportId, moderatorId, resolution, reason, notes);
      sendSuccessResponse(res, result, 'Report resolved successfully');
    } catch (error) {
      logger.error('[ModerationController] Resolve report error:', error);
      sendErrorResponse(res, 'Failed to resolve report', 500, { error: error.message });
    }
  }

  /**
   * Take moderation action
   */
  async takeAction(req, res) {
    try {
      const { actionType, targetId, targetType, reason, details, duration } = req.body;
      const moderatorId = req.user.id;

      if (!actionType || !targetId || !targetType || !reason) {
        return sendErrorResponse(res, 'Missing required fields', 400);
      }

      const action = await moderationService.takeAction(
        actionType,
        targetId,
        targetType,
        moderatorId,
        reason,
        details,
        duration
      );

      sendSuccessResponse(res, action, 'Moderation action taken successfully');
    } catch (error) {
      logger.error('[ModerationController] Take action error:', error);
      sendErrorResponse(res, 'Failed to take moderation action', 500, { error: error.message });
    }
  }

  /**
   * Get user moderation history
   */
  async getUserModerationHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50 } = req.query;

      const history = await moderationService.getUserModerationHistory(userId, parseInt(limit));
      sendSuccessResponse(res, history, 'User moderation history retrieved successfully');
    } catch (error) {
      logger.error('[ModerationController] Get user moderation history error:', error);
      sendErrorResponse(res, 'Failed to get user moderation history', 500, { error: error.message });
    }
  }

  /**
   * Get content moderation status
   */
  async getContentModerationStatus(req, res) {
    try {
      const { contentId, contentType } = req.params;

      const status = await moderationService.getContentModerationStatus(contentId, contentType);
      sendSuccessResponse(res, status, 'Content moderation status retrieved successfully');
    } catch (error) {
      logger.error('[ModerationController] Get content moderation status error:', error);
      sendErrorResponse(res, 'Failed to get content moderation status', 500, { error: error.message });
    }
  }

  /**
   * Analyze content
   */
  async analyzeContent(req, res) {
    try {
      const { content, contentType } = req.body;

      if (!content) {
        return sendErrorResponse(res, 'Content is required', 400);
      }

      const analysis = await contentFilterService.analyzeContent(content, contentType);
      sendSuccessResponse(res, analysis, 'Content analysis completed');
    } catch (error) {
      logger.error('[ModerationController] Analyze content error:', error);
      sendErrorResponse(res, 'Failed to analyze content', 500, { error: error.message });
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(req, res) {
    try {
      const stats = await moderationService.getModerationStats();
      sendSuccessResponse(res, stats, 'Moderation statistics retrieved successfully');
    } catch (error) {
      logger.error('[ModerationController] Get moderation stats error:', error);
      sendErrorResponse(res, 'Failed to get moderation statistics', 500, { error: error.message });
    }
  }

  /**
   * Update auto-moderation settings
   */
  async updateAutoModerationSettings(req, res) {
    try {
      const { enabled, thresholds } = req.body;

      const settings = await moderationService.updateAutoModerationSettings({ enabled, thresholds });
      sendSuccessResponse(res, settings, 'Auto-moderation settings updated successfully');
    } catch (error) {
      logger.error('[ModerationController] Update auto-moderation settings error:', error);
      sendErrorResponse(res, 'Failed to update auto-moderation settings', 500, { error: error.message });
    }
  }

  /**
   * Get recent moderation actions
   */
  async getRecentActions(req, res) {
    try {
      const { limit = 20, page = 1 } = req.query;
      const skip = (page - 1) * limit;

      const actions = await ModerationAction.find()
        .populate('moderatorId', 'username email')
        .populate('targetId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await ModerationAction.countDocuments();

      sendSuccessResponse(res, {
        actions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }, 'Recent moderation actions retrieved successfully');
    } catch (error) {
      logger.error('[ModerationController] Get recent actions error:', error);
      sendErrorResponse(res, 'Failed to get recent actions', 500, { error: error.message });
    }
  }

  /**
   * Reverse moderation action
   */
  async reverseAction(req, res) {
    try {
      const { actionId } = req.params;
      const { reason } = req.body;
      const moderatorId = req.user.id;

      if (!reason) {
        return sendErrorResponse(res, 'Reason is required', 400);
      }

      const action = await ModerationAction.findById(actionId);
      if (!action) {
        return sendErrorResponse(res, 'Action not found', 404);
      }

      await action.reverse(moderatorId, reason);

      sendSuccessResponse(res, action, 'Moderation action reversed successfully');
    } catch (error) {
      logger.error('[ModerationController] Reverse action error:', error);
      sendErrorResponse(res, 'Failed to reverse action', 500, { error: error.message });
    }
  }
}

module.exports = new ModerationController();
