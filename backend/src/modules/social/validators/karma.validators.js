const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Get user karma validation
const getUserKarmaValidator = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  validate,
];

// Get karma leaderboard validation
const getLeaderboardValidator = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  validate,
];

// Get users by level validation
const getUsersByLevelValidator = [
  param('level')
    .isIn(['NEWBIE', 'EXPLORER', 'CONTRIBUTOR', 'INFLUENCER', 'EXPERT', 'LEGEND', 'TITAN'])
    .withMessage('Invalid level'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  validate,
];

// Get user karma history validation
const getUserKarmaHistoryValidator = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  validate,
];

// Get user badges validation
const getUserBadgesValidator = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  validate,
];

// Get user unlocked reactions validation
const getUserUnlockedReactionsValidator = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  validate,
];

// Check reaction permission validation
const canUseReactionValidator = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  query('reactionType')
    .notEmpty()
    .withMessage('Reaction type is required')
    .isIn(['LIKE', 'DISLIKE', 'HEART', 'FIRE', 'BULLISH', 'BEARISH', 'ROCKET', 'DIAMOND', 'CROWN', 'STAR', 'GEM', 'TROPHY', 'MEDAL', 'CROWN_GOLD', 'DIAMOND_BLUE', 'LEGENDARY', 'MYTHIC', 'TITAN', 'ULTIMATE'])
    .withMessage('Invalid reaction type'),
  
  validate,
];

// Get user reaction weight validation
const getUserReactionWeightValidator = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  validate,
];

// Add karma validation (admin only)
const addKarmaValidator = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('amount')
    .isInt({ min: -1000, max: 1000 })
    .withMessage('Amount must be between -1000 and 1000'),
  
  body('source')
    .notEmpty()
    .withMessage('Source is required')
    .isIn(['POST', 'COMMENT', 'REACTION', 'PREDICTION', 'POLL', 'MODERATION', 'BADGE', 'BONUS', 'PENALTY'])
    .withMessage('Invalid source'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  
  body('sourceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid source ID'),
  
  validate,
];

// Deduct karma validation (admin only)
const deductKarmaValidator = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('amount')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Amount must be between 1 and 1000'),
  
  body('source')
    .notEmpty()
    .withMessage('Source is required')
    .isIn(['POST', 'COMMENT', 'REACTION', 'PREDICTION', 'POLL', 'MODERATION', 'BADGE', 'BONUS', 'PENALTY'])
    .withMessage('Invalid source'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  
  body('sourceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid source ID'),
  
  validate,
];

module.exports = {
  getUserKarmaValidator,
  getLeaderboardValidator,
  getUsersByLevelValidator,
  getUserKarmaHistoryValidator,
  getUserBadgesValidator,
  getUserUnlockedReactionsValidator,
  canUseReactionValidator,
  getUserReactionWeightValidator,
  addKarmaValidator,
  deductKarmaValidator,
};
