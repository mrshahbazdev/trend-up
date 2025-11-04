const { body, param, query } = require('express-validator');

// Create post validation
const createPostValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters'),
  
  body('postType')
    .isIn(['text', 'image', 'video', 'poll', 'prediction'])
    .withMessage('Invalid post type'),
  
  body('category')
    .optional()
    .isIn([
      'general',
      'technology',
      'business',
      'entertainment',
      'sports',
      'science',
      'crypto_news',
      'defi',
      'nfts',
      'trading_signals',
      'market_analysis',
      'memes',
      'tutorials',
      'ama',
      'events',
    ])
    .withMessage('Invalid category'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'private'])
    .withMessage('Invalid visibility setting'),
  
  body('mediaUrls')
    .optional()
    .isArray()
    .withMessage('Media URLs must be an array'),
  
  body('mediaUrls.*')
    .optional()
    .isURL()
    .withMessage('Invalid media URL format'),
  
  body('hashtags')
    .optional()
    .isArray()
    .withMessage('Hashtags must be an array'),
  
  body('hashtags.*')
    .optional()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Hashtags can only contain letters, numbers, and underscores'),
  
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid scheduled date format'),
  
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date format'),
];

// Poll-specific validation
const createPollValidation = [
  ...createPostValidation,
  
  body('pollOptions')
    .isArray({ min: 2, max: 6 })
    .withMessage('Poll must have between 2 and 6 options'),
  
  body('pollOptions.*.text')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Poll option text must be between 1 and 200 characters'),
  
  body('pollSettings.allowMultipleVotes')
    .optional()
    .isBoolean()
    .withMessage('Allow multiple votes must be a boolean'),
  
  body('pollSettings.expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid poll expiry date format'),
];

// Prediction-specific validation
const createPredictionValidation = [
  ...createPostValidation,
  
  body('predictionData.predictionText')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Prediction text must be between 1 and 500 characters'),
  
  body('predictionData.targetDate')
    .isISO8601()
    .withMessage('Invalid target date format')
    .custom((value) => {
      const targetDate = new Date(value);
      const now = new Date();
      if (targetDate <= now) {
        throw new Error('Target date must be in the future');
      }
      return true;
    }),
];

// Update post validation
const updatePostValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid post ID'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters'),
  
  body('category')
    .optional()
    .isIn([
      'general',
      'technology',
      'business',
      'entertainment',
      'sports',
      'science',
      'crypto_news',
      'defi',
      'nfts',
      'trading_signals',
      'market_analysis',
      'memes',
      'tutorials',
      'ama',
      'events',
    ])
    .withMessage('Invalid category'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'private'])
    .withMessage('Invalid visibility setting'),
  
  body('hashtags')
    .optional()
    .isArray()
    .withMessage('Hashtags must be an array'),
  
  body('hashtags.*')
    .optional()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Hashtags can only contain letters, numbers, and underscores'),
];

// Get posts validation
const getPostsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('category')
    .optional()
    .isIn([
      'crypto_news',
      'defi',
      'nfts',
      'trading_signals',
      'market_analysis',
      'memes',
      'technology',
      'tutorials',
      'ama',
      'events',
      'general',
    ])
    .withMessage('Invalid category'),
  
  query('postType')
    .optional()
    .isIn(['text', 'image', 'video', 'poll', 'prediction'])
    .withMessage('Invalid post type'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'engagementScore', 'reactionsCount', 'commentsCount'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('hashtag')
    .optional()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Invalid hashtag format'),
  
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),
];

// Get single post validation
const getPostValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid post ID'),
];

// Delete post validation
const deletePostValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid post ID'),
];

// React to post validation
const reactToPostValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid post ID'),
  
  body('reactionType')
    .isIn([
      'BULLISH',
      'BEARISH',
      'FIRE',
      'GEM',
      'MOON',
      'RUGGED',
      'WAGMI',
      'NGMI',
      'ROCKET',
      'DIAMOND',
      'THINKING',
      'HEART',
      'LIKE',
      'LAUGH',
      'SURPRISED',
      'ANGRY',
      'SAD',
      'CELEBRATE',
      'CLAP',
      'HANDS',
    ])
    .withMessage('Invalid reaction type'),
];

// Get post reactions validation
const getPostReactionsValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid post ID'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

module.exports = {
  createPostValidation,
  createPollValidation,
  createPredictionValidation,
  updatePostValidation,
  getPostsValidation,
  getPostValidation,
  deletePostValidation,
  reactToPostValidation,
  getPostReactionsValidation,
};
