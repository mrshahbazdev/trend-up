/**
 * Content Filter Service
 * AI-powered content filtering and moderation
 */

const { logger } = require('../utils/logger');

const { Flag, ModerationAction } = require('../../modules/social/models');

class ContentFilterService {
  constructor() {
    this.rules = {
      spam: {
        keywords: [
          'buy now', 'click here', 'free money', 'make money fast',
          'work from home', 'get rich quick', 'crypto investment',
          'bitcoin investment', 'forex trading', 'binary options'
        ],
        patterns: [
          /(.)\1{4,}/g, // Repeated characters
          /[A-Z]{10,}/g, // Excessive caps
          /https?:\/\/[^\s]+/g, // Multiple URLs
          /\$\d+/g, // Money amounts
          /(.)\1{3,}/g // Repeated words
        ],
        thresholds: {
          keywordMatches: 3,
          patternMatches: 2,
          urlCount: 3,
          capsRatio: 0.7
        }
      },
      hate_speech: {
        keywords: [
          'hate', 'kill', 'destroy', 'eliminate', 'exterminate',
          'inferior', 'superior race', 'white power', 'black power'
        ],
        patterns: [
          /kill\s+all\s+\w+/gi,
          /exterminate\s+\w+/gi,
          /\w+\s+should\s+die/gi,
          /\w+\s+are\s+inferior/gi
        ],
        thresholds: {
          keywordMatches: 2,
          patternMatches: 1
        }
      },
      harassment: {
        keywords: [
          'stupid', 'idiot', 'moron', 'retard', 'faggot',
          'bitch', 'whore', 'slut', 'ugly', 'fat'
        ],
        patterns: [
          /you\s+are\s+\w+/gi,
          /go\s+die/gi,
          /kill\s+yourself/gi,
          /fuck\s+you/gi
        ],
        thresholds: {
          keywordMatches: 2,
          patternMatches: 1
        }
      },
      inappropriate_content: {
        keywords: [
          'sex', 'porn', 'nude', 'naked', 'fuck', 'shit',
          'damn', 'hell', 'bitch', 'ass', 'dick', 'pussy'
        ],
        patterns: [
          /fuck\s+\w+/gi,
          /shit\s+\w+/gi,
          /damn\s+\w+/gi
        ],
        thresholds: {
          keywordMatches: 3,
          patternMatches: 2
        }
      },
      violence: {
        keywords: [
          'kill', 'murder', 'violence', 'fight', 'attack',
          'bomb', 'gun', 'weapon', 'blood', 'death'
        ],
        patterns: [
          /kill\s+\w+/gi,
          /murder\s+\w+/gi,
          /attack\s+\w+/gi,
          /bomb\s+\w+/gi
        ],
        thresholds: {
          keywordMatches: 2,
          patternMatches: 1
        }
      }
    };
    
    this.weights = {
      spam: 0.8,
      hate_speech: 0.9,
      harassment: 0.85,
      inappropriate_content: 0.7,
      violence: 0.95
    };
  }

  /**
   * Analyze content for violations
   */
  async analyzeContent(content, contentType = 'post', userId = null) {
    try {
      const analysis = {
        violations: [],
        confidence: 0,
        riskLevel: 'low',
        recommendations: []
      };

      // Check each rule type
      for (const [ruleType, rule] of Object.entries(this.rules)) {
        const violation = await this.checkRule(content, ruleType, rule);
        if (violation.detected) {
          analysis.violations.push(violation);
        }
      }

      // Calculate overall confidence and risk level
      if (analysis.violations.length > 0) {
        analysis.confidence = Math.max(...analysis.violations.map(v => v.confidence));
        analysis.riskLevel = this.calculateRiskLevel(analysis.violations);
        analysis.recommendations = this.generateRecommendations(analysis.violations);
      }

      // Log analysis
      logger.info(`[ContentFilter] Content analyzed: ${analysis.violations.length} violations, risk: ${analysis.riskLevel}`);

      return analysis;
    } catch (error) {
      logger.error('[ContentFilter] Error analyzing content:', error);
      throw error;
    }
  }

  /**
   * Check specific rule against content
   */
  async checkRule(content, ruleType, rule) {
    const violation = {
      type: ruleType,
      detected: false,
      confidence: 0,
      matches: [],
      details: {}
    };

    const text = content.toLowerCase();
    let keywordMatches = 0;
    let patternMatches = 0;
    let urlCount = 0;
    let capsCount = 0;
    let totalChars = content.length;

    // Check keywords
    for (const keyword of rule.keywords) {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = text.match(regex);
      if (matches) {
        keywordMatches += matches.length;
        violation.matches.push({
          type: 'keyword',
          value: keyword,
          count: matches.length
        });
      }
    }

    // Check patterns
    for (const pattern of rule.patterns) {
      const matches = text.match(pattern);
      if (matches) {
        patternMatches += matches.length;
        violation.matches.push({
          type: 'pattern',
          value: pattern.toString(),
          count: matches.length
        });
      }
    }

    // Check URLs
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlPattern);
    if (urls) {
      urlCount = urls.length;
      violation.details.urlCount = urlCount;
    }

    // Check caps ratio
    const capsPattern = /[A-Z]/g;
    const caps = content.match(capsPattern);
    if (caps) {
      capsCount = caps.length;
      violation.details.capsRatio = capsCount / totalChars;
    }

    // Determine if violation is detected
    const thresholds = rule.thresholds;
    let detected = false;

    if (ruleType === 'spam') {
      detected = keywordMatches >= thresholds.keywordMatches ||
                patternMatches >= thresholds.patternMatches ||
                urlCount >= thresholds.urlCount ||
                (capsCount / totalChars) >= thresholds.capsRatio;
    } else {
      detected = keywordMatches >= thresholds.keywordMatches ||
                patternMatches >= thresholds.patternMatches;
    }

    if (detected) {
      violation.detected = true;
      violation.confidence = this.calculateConfidence(ruleType, {
        keywordMatches,
        patternMatches,
        urlCount,
        capsRatio: capsCount / totalChars
      });
      violation.details = {
        keywordMatches,
        patternMatches,
        urlCount,
        capsRatio: capsCount / totalChars
      };
    }

    return violation;
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(ruleType, metrics) {
    const weight = this.weights[ruleType] || 0.5;
    let confidence = 0;

    switch (ruleType) {
      case 'spam':
        confidence = Math.min(0.9, 
          (metrics.keywordMatches * 0.2) +
          (metrics.patternMatches * 0.3) +
          (metrics.urlCount * 0.2) +
          (metrics.capsRatio * 0.3)
        );
        break;
      case 'hate_speech':
      case 'violence':
        confidence = Math.min(0.95, 
          (metrics.keywordMatches * 0.4) +
          (metrics.patternMatches * 0.6)
        );
        break;
      case 'harassment':
      case 'inappropriate_content':
        confidence = Math.min(0.9, 
          (metrics.keywordMatches * 0.3) +
          (metrics.patternMatches * 0.7)
        );
        break;
    }

    return Math.round(confidence * weight * 100) / 100;
  }

  /**
   * Calculate overall risk level
   */
  calculateRiskLevel(violations) {
    if (violations.length === 0) return 'low';
    
    const maxConfidence = Math.max(...violations.map(v => v.confidence));
    const criticalTypes = ['hate_speech', 'violence'];
    const hasCritical = violations.some(v => criticalTypes.includes(v.type));

    if (hasCritical && maxConfidence > 0.8) return 'critical';
    if (maxConfidence > 0.7) return 'high';
    if (maxConfidence > 0.5) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(violations) {
    const recommendations = [];

    for (const violation of violations) {
      switch (violation.type) {
        case 'spam':
          recommendations.push('Consider hiding content due to spam indicators');
          break;
        case 'hate_speech':
          recommendations.push('Immediate review required - potential hate speech');
          break;
        case 'harassment':
          recommendations.push('Review for harassment - consider warning user');
          break;
        case 'inappropriate_content':
          recommendations.push('Content may be inappropriate for general audience');
          break;
        case 'violence':
          recommendations.push('Urgent review - potential violence promotion');
          break;
      }
    }

    return recommendations;
  }

  /**
   * Create automated flag
   */
  async createAutomatedFlag(contentId, contentType, violation, userId = null) {
    try {
      const flag = new Flag({
        contentId,
        contentType,
        flaggerId: userId || 'system',
        flagType: violation.type,
        reason: `Automated detection: ${violation.type}`,
        evidence: violation.matches.map(m => ({
          type: m.type,
          description: `${m.type}: ${m.value} (${m.count} matches)`
        })),
        status: 'pending',
        priority: violation.confidence > 0.8 ? 'high' : 'medium',
        isAutomated: true,
        confidence: violation.confidence,
        metadata: {
          userAgent: 'ContentFilterService',
          ipAddress: '127.0.0.1'
        }
      });

      await flag.save();
      logger.info(`[ContentFilter] Automated flag created: ${flag._id}`);
      return flag;
    } catch (error) {
      logger.error('[ContentFilter] Error creating automated flag:', error);
      throw error;
    }
  }

  /**
   * Take automated action
   */
  async takeAutomatedAction(contentId, contentType, violation, userId = null) {
    try {
      let actionType = 'content_hidden';
      
      // Determine action based on violation type and confidence
      if (violation.type === 'spam' && violation.confidence > 0.8) {
        actionType = 'content_removed';
      } else if (['hate_speech', 'violence'].includes(violation.type) && violation.confidence > 0.7) {
        actionType = 'content_removed';
      } else if (violation.type === 'harassment' && violation.confidence > 0.6) {
        actionType = 'content_hidden';
      }

      const action = new ModerationAction({
        actionType,
        targetId: contentId,
        targetType: contentType,
        moderatorId: userId || 'system',
        moderatorRole: 'automated',
        reason: `Automated action: ${violation.type} detected`,
        details: `Confidence: ${violation.confidence}, Matches: ${violation.matches.length}`,
        isAutomated: true,
        automationRule: `content_filter_${violation.type}`,
        confidence: violation.confidence,
        impact: {
          contentHidden: actionType.includes('hidden'),
          userAffected: actionType.includes('user')
        }
      });

      await action.save();
      logger.info(`[ContentFilter] Automated action taken: ${actionType}`);
      return action;
    } catch (error) {
      logger.error('[ContentFilter] Error taking automated action:', error);
      throw error;
    }
  }

  /**
   * Process content for moderation
   */
  async processContent(content, contentType = 'post', contentId = null, userId = null) {
    try {
      const analysis = await this.analyzeContent(content, contentType, userId);
      
      if (analysis.violations.length > 0) {
        // Create flags for each violation
        for (const violation of analysis.violations) {
          if (contentId) {
            await this.createAutomatedFlag(contentId, contentType, violation, userId);
          }
        }

        // Take automated action if risk is high
        if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
          const primaryViolation = analysis.violations.reduce((prev, current) => 
            prev.confidence > current.confidence ? prev : current
          );
          
          if (contentId) {
            await this.takeAutomatedAction(contentId, contentType, primaryViolation, userId);
          }
        }
      }

      return analysis;
    } catch (error) {
      logger.error('[ContentFilter] Error processing content:', error);
      throw error;
    }
  }

  /**
   * Get filter statistics
   */
  async getFilterStats() {
    try {
      const stats = await Flag.aggregate([
        { $match: { isAutomated: true } },
        {
          $group: {
            _id: '$flagType',
            count: { $sum: 1 },
            avgConfidence: { $avg: '$confidence' },
            highConfidence: {
              $sum: { $cond: [{ $gte: ['$confidence', 0.8] }, 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return stats;
    } catch (error) {
      logger.error('[ContentFilter] Error getting filter stats:', error);
      throw error;
    }
  }

  /**
   * Close the content filter service
   */
  async close() {
    try {
      logger.info('[ContentFilter] Closed successfully');
    } catch (error) {
      logger.error('[ContentFilter] Close error:', error);
    }
  }
}

module.exports = new ContentFilterService();
