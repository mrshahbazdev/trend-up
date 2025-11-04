const Joi = require('joi');

// Poll creation validation
const createPollSchema = Joi.object({
  title: Joi.string()
    .required()
    .trim()
    .min(1)
    .max(200)
    .messages({
      'string.empty': 'Poll title is required',
      'string.min': 'Poll title cannot be empty',
      'string.max': 'Poll title cannot exceed 200 characters',
      'any.required': 'Poll title is required'
    }),

  description: Joi.string()
    .optional()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Poll description cannot exceed 1000 characters'
    }),

  options: Joi.array()
    .items(
      Joi.string()
        .required()
        .trim()
        .min(1)
        .max(100)
        .messages({
          'string.empty': 'Poll option cannot be empty',
          'string.min': 'Poll option cannot be empty',
          'string.max': 'Poll option cannot exceed 100 characters',
          'any.required': 'Poll option is required'
        })
    )
    .min(2)
    .max(10)
    .required()
    .messages({
      'array.min': 'Poll must have at least 2 options',
      'array.max': 'Poll cannot have more than 10 options',
      'any.required': 'Poll options are required'
    }),

  allowMultipleVotes: Joi.boolean()
    .optional()
    .default(false),

  isAnonymous: Joi.boolean()
    .optional()
    .default(false),

  isPublic: Joi.boolean()
    .optional()
    .default(true),

  expiresAt: Joi.date()
    .required()
    .greater('now')
    .messages({
      'date.greater': 'Poll expiration date must be in the future',
      'any.required': 'Poll expiration date is required'
    }),

  category: Joi.string()
    .optional()
    .valid(
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
      'general'
    )
    .default('general'),

  tags: Joi.array()
    .items(
      Joi.string()
        .trim()
        .lowercase()
        .min(1)
        .max(50)
        .messages({
          'string.min': 'Tag cannot be empty',
          'string.max': 'Tag cannot exceed 50 characters'
        })
    )
    .optional()
    .max(10)
    .messages({
      'array.max': 'Cannot have more than 10 tags'
    })
});

// Vote validation
const voteSchema = Joi.object({
  optionId: Joi.string()
    .required()
    .messages({
      'string.empty': 'Option ID is required',
      'any.required': 'Option ID is required'
    }),

  voteReason: Joi.string()
    .optional()
    .trim()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Vote reason cannot exceed 500 characters'
    })
});

// Poll update validation
const updatePollSchema = Joi.object({
  title: Joi.string()
    .optional()
    .trim()
    .min(1)
    .max(200)
    .messages({
      'string.min': 'Poll title cannot be empty',
      'string.max': 'Poll title cannot exceed 200 characters'
    }),

  description: Joi.string()
    .optional()
    .trim()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Poll description cannot exceed 1000 characters'
    }),

  isPublic: Joi.boolean()
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Poll search validation
const searchPollsSchema = Joi.object({
  q: Joi.string()
    .required()
    .trim()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Search query must be at least 2 characters long',
      'string.max': 'Search query cannot exceed 100 characters',
      'any.required': 'Search query is required'
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20),

  category: Joi.string()
    .optional()
    .valid(
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
      'general'
    ),

  status: Joi.string()
    .optional()
    .valid('active', 'expired', 'closed', 'cancelled', 'all')
    .default('active'),

  sortBy: Joi.string()
    .optional()
    .valid('createdAt', 'expiresAt', 'totalVotes', 'trendingScore', 'engagementScore')
    .default('createdAt'),

  sortOrder: Joi.string()
    .optional()
    .valid('asc', 'desc')
    .default('desc')
});

// Poll list validation
const listPollsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20),

  category: Joi.string()
    .optional()
    .valid(
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
      'general'
    ),

  status: Joi.string()
    .optional()
    .valid('active', 'expired', 'closed', 'cancelled', 'all')
    .default('active'),

  sortBy: Joi.string()
    .optional()
    .valid('createdAt', 'expiresAt', 'totalVotes', 'trendingScore', 'engagementScore')
    .default('createdAt'),

  sortOrder: Joi.string()
    .optional()
    .valid('asc', 'desc')
    .default('desc')
});

// User polls validation
const userPollsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20),

  status: Joi.string()
    .optional()
    .valid('active', 'expired', 'closed', 'cancelled', 'all')
    .default('all'),

  sortBy: Joi.string()
    .optional()
    .valid('createdAt', 'expiresAt', 'totalVotes', 'trendingScore', 'engagementScore')
    .default('createdAt'),

  sortOrder: Joi.string()
    .optional()
    .valid('asc', 'desc')
    .default('desc')
});

// Trending polls validation
const trendingPollsSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20)
});

// Category polls validation
const categoryPollsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20),

  sortBy: Joi.string()
    .optional()
    .valid('createdAt', 'expiresAt', 'totalVotes', 'trendingScore', 'engagementScore')
    .default('createdAt'),

  sortOrder: Joi.string()
    .optional()
    .valid('asc', 'desc')
    .default('desc')
});

module.exports = {
  createPollSchema,
  voteSchema,
  updatePollSchema,
  searchPollsSchema,
  listPollsSchema,
  userPollsSchema,
  trendingPollsSchema,
  categoryPollsSchema
};
