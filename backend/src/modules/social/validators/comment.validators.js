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

// Create comment validation
const createCommentValidator = [
  param('postId').isMongoId().withMessage('Invalid post ID'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters'),

  body('parentCommentId')
    .optional({ nullable: true })
    .custom((value) => value === null || mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid parent comment ID'),

  validate,
];

// Update comment validation
const updateCommentValidator = [
  param('commentId').isMongoId().withMessage('Invalid comment ID'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters'),

  validate,
];

// Get post comments validation
const getPostCommentsValidator = [
  param('postId').isMongoId().withMessage('Invalid post ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'reactionsCount', 'replyCount' , 'likesCount'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  query('includeReplies')
    .optional()
    .isBoolean()
    .withMessage('includeReplies must be a boolean'),

  query('level')
    .optional()
    .isInt({ min: 0, max: 2 })
    .withMessage('Level must be between 0 and 2'),

  validate,
];

// Get comment by ID validation
const getCommentByIdValidator = [
  param('commentId').isMongoId().withMessage('Invalid comment ID'),

  validate,
];

// Delete comment validation
const deleteCommentValidator = [
  param('commentId').isMongoId().withMessage('Invalid comment ID'),

  validate,
];

// Get comment replies validation
const getCommentRepliesValidator = [
  param('commentId').isMongoId().withMessage('Invalid comment ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'reactionsCount'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  validate,
];

// Get user comments validation
const getUserCommentsValidator = [
  param('userId').isMongoId().withMessage('Invalid user ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'reactionsCount', 'replyCount'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  validate,
];

// Flag comment validation
const flagCommentValidator = [
  param('commentId').isMongoId().withMessage('Invalid comment ID'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Flag reason is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters'),

  validate,
];

// Get comment stats validation
const getCommentStatsValidator = [
  query('postId').optional().isMongoId().withMessage('Invalid post ID'),

  query('userId').optional().isMongoId().withMessage('Invalid user ID'),

  validate,
];

// Get trending comments validation
const getTrendingCommentsValidator = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  query('timeframe')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Timeframe must be between 1 and 30 days'),

  validate,
];

// Search comments validation
const searchCommentsValidator = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),

  query('postId').optional().isMongoId().withMessage('Invalid post ID'),

  query('userId').optional().isMongoId().withMessage('Invalid user ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  validate,
];

// Get comment thread validation
const getCommentThreadValidator = [
  param('commentId').isMongoId().withMessage('Invalid comment ID'),

  query('includeReplies')
    .optional()
    .isBoolean()
    .withMessage('includeReplies must be a boolean'),

  validate,
];

// Get recent comments validation
const getRecentCommentsValidator = [
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

module.exports = {
  createCommentValidator,
  updateCommentValidator,
  getPostCommentsValidator,
  getCommentByIdValidator,
  deleteCommentValidator,
  getCommentRepliesValidator,
  getUserCommentsValidator,
  flagCommentValidator,
  getCommentStatsValidator,
  getTrendingCommentsValidator,
  searchCommentsValidator,
  getCommentThreadValidator,
  getRecentCommentsValidator,
};
