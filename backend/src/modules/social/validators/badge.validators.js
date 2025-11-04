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

// Get all badges validation
const getAllBadgesValidator = [
  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  
  validate,
];

// Get badges by category validation
const getBadgesByCategoryValidator = [
  param('category')
    .isIn(['POSTING', 'ENGAGEMENT', 'PREDICTION', 'MODERATION', 'SPECIAL'])
    .withMessage('Invalid category'),
  
  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  
  validate,
];

// Get badges by rarity validation
const getBadgesByRarityValidator = [
  param('rarity')
    .isIn(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'])
    .withMessage('Invalid rarity'),
  
  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  
  validate,
];

// Get available badges for user validation
const getAvailableBadgesForUserValidator = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  validate,
];

// Get badge by ID validation
const getBadgeByIdValidator = [
  param('badgeId')
    .notEmpty()
    .withMessage('Badge ID is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Badge ID must be between 1 and 50 characters'),
  
  validate,
];

// Get user badge progress validation
const getUserBadgeProgressValidator = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  validate,
];

// Create badge validation (admin only)
const createBadgeValidator = [
  body('badgeId')
    .notEmpty()
    .withMessage('Badge ID is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Badge ID must be between 1 and 50 characters')
    .matches(/^[A-Z_]+$/)
    .withMessage('Badge ID must contain only uppercase letters and underscores'),
  
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  
  body('icon')
    .notEmpty()
    .withMessage('Icon is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Icon must be between 1 and 10 characters'),
  
  body('color')
    .notEmpty()
    .withMessage('Color is required')
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['POSTING', 'ENGAGEMENT', 'PREDICTION', 'MODERATION', 'SPECIAL'])
    .withMessage('Invalid category'),
  
  body('requirements')
    .isObject()
    .withMessage('Requirements must be an object'),
  
  body('requirements.type')
    .notEmpty()
    .withMessage('Requirement type is required')
    .isIn(['KARMA', 'POSTS', 'COMMENTS', 'REACTIONS', 'PREDICTIONS', 'POLLS', 'MODERATION', 'STREAK', 'CUSTOM'])
    .withMessage('Invalid requirement type'),
  
  body('requirements.value')
    .isInt({ min: 1 })
    .withMessage('Requirement value must be a positive integer'),
  
  body('requirements.timeframe')
    .optional()
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'])
    .withMessage('Invalid timeframe'),
  
  body('rarity')
    .optional()
    .isIn(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'])
    .withMessage('Invalid rarity'),
  
  body('karmaReward')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Karma reward must be between 0 and 10000'),
  
  body('repeatable')
    .optional()
    .isBoolean()
    .withMessage('Repeatable must be a boolean'),
  
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  
  body('requiredLevel')
    .optional()
    .isIn(['NEWBIE', 'EXPLORER', 'CONTRIBUTOR', 'INFLUENCER', 'EXPERT', 'LEGEND', 'TITAN'])
    .withMessage('Invalid required level'),
  
  validate,
];

// Update badge validation (admin only)
const updateBadgeValidator = [
  param('badgeId')
    .notEmpty()
    .withMessage('Badge ID is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Badge ID must be between 1 and 50 characters'),
  
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  
  body('icon')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Icon must be between 1 and 10 characters'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color'),
  
  body('category')
    .optional()
    .isIn(['POSTING', 'ENGAGEMENT', 'PREDICTION', 'MODERATION', 'SPECIAL'])
    .withMessage('Invalid category'),
  
  body('requirements')
    .optional()
    .isObject()
    .withMessage('Requirements must be an object'),
  
  body('requirements.type')
    .optional()
    .isIn(['KARMA', 'POSTS', 'COMMENTS', 'REACTIONS', 'PREDICTIONS', 'POLLS', 'MODERATION', 'STREAK', 'CUSTOM'])
    .withMessage('Invalid requirement type'),
  
  body('requirements.value')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Requirement value must be a positive integer'),
  
  body('requirements.timeframe')
    .optional()
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME'])
    .withMessage('Invalid timeframe'),
  
  body('rarity')
    .optional()
    .isIn(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'])
    .withMessage('Invalid rarity'),
  
  body('karmaReward')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Karma reward must be between 0 and 10000'),
  
  body('repeatable')
    .optional()
    .isBoolean()
    .withMessage('Repeatable must be a boolean'),
  
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  
  body('requiredLevel')
    .optional()
    .isIn(['NEWBIE', 'EXPLORER', 'CONTRIBUTOR', 'INFLUENCER', 'EXPERT', 'LEGEND', 'TITAN'])
    .withMessage('Invalid required level'),
  
  validate,
];

// Delete badge validation (admin only)
const deleteBadgeValidator = [
  param('badgeId')
    .notEmpty()
    .withMessage('Badge ID is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Badge ID must be between 1 and 50 characters'),
  
  validate,
];

module.exports = {
  getAllBadgesValidator,
  getBadgesByCategoryValidator,
  getBadgesByRarityValidator,
  getAvailableBadgesForUserValidator,
  getBadgeByIdValidator,
  getUserBadgeProgressValidator,
  createBadgeValidator,
  updateBadgeValidator,
  deleteBadgeValidator,
};
