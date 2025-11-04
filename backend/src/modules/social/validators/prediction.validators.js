const Joi = require('joi');

// Prediction creation validation
const createPredictionSchema = Joi.object({
  title: Joi.string()
    .required()
    .trim()
    .min(1)
    .max(200)
    .messages({
      'string.empty': 'Prediction title is required',
      'string.min': 'Prediction title cannot be empty',
      'string.max': 'Prediction title cannot exceed 200 characters',
      'any.required': 'Prediction title is required'
    }),

  description: Joi.string()
    .required()
    .trim()
    .min(1)
    .max(2000)
    .messages({
      'string.empty': 'Prediction description is required',
      'string.min': 'Prediction description cannot be empty',
      'string.max': 'Prediction description cannot exceed 2000 characters',
      'any.required': 'Prediction description is required'
    }),

  predictionType: Joi.string()
    .optional()
    .valid('price', 'event', 'market', 'other')
    .default('price'),

  asset: Joi.object({
    symbol: Joi.string()
      .when('predictionType', {
        is: 'price',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .trim()
      .uppercase()
      .min(1)
      .max(20)
      .messages({
        'string.empty': 'Asset symbol is required for price predictions',
        'string.min': 'Asset symbol cannot be empty',
        'string.max': 'Asset symbol cannot exceed 20 characters',
        'any.required': 'Asset symbol is required for price predictions'
      }),

    name: Joi.string()
      .optional()
      .trim()
      .max(100)
      .messages({
        'string.max': 'Asset name cannot exceed 100 characters'
      }),

    currentPrice: Joi.number()
      .optional()
      .min(0)
      .messages({
        'number.min': 'Current price must be non-negative'
      })
  }).when('predictionType', {
    is: 'price',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),

  targetPrice: Joi.number()
    .when('predictionType', {
      is: 'price',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .min(0.000001)
    .messages({
      'number.min': 'Target price must be positive',
      'any.required': 'Target price is required for price predictions'
    }),

  targetDate: Joi.date()
    .required()
    .greater('now')
    .messages({
      'date.greater': 'Target date must be in the future',
      'any.required': 'Target date is required'
    }),

  minStake: Joi.number()
    .optional()
    .integer()
    .min(1)
    .max(1000)
    .default(10)
    .messages({
      'number.min': 'Minimum stake must be at least 1',
      'number.max': 'Minimum stake cannot exceed 1000'
    }),

  maxStake: Joi.number()
    .optional()
    .integer()
    .min(1)
    .max(10000)
    .default(1000)
    .messages({
      'number.min': 'Maximum stake must be at least 1',
      'number.max': 'Maximum stake cannot exceed 10000'
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
    .default('market_analysis'),

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
}).custom((value, helpers) => {
  // Custom validation for min/max stake relationship
  if (value.minStake && value.maxStake && value.minStake > value.maxStake) {
    return helpers.error('custom.minMaxStake');
  }
  return value;
}).messages({
  'custom.minMaxStake': 'Minimum stake cannot be greater than maximum stake'
});

// Stake validation
const stakeSchema = Joi.object({
  stake: Joi.number()
    .required()
    .integer()
    .min(1)
    .max(10000)
    .messages({
      'number.min': 'Stake must be at least 1',
      'number.max': 'Stake cannot exceed 10000',
      'any.required': 'Stake amount is required'
    }),

  position: Joi.string()
    .required()
    .valid('agree', 'disagree')
    .messages({
      'any.only': 'Position must be either "agree" or "disagree"',
      'any.required': 'Position is required'
    })
});

// Prediction resolution validation
const resolvePredictionSchema = Joi.object({
  outcome: Joi.string()
    .required()
    .valid('agree', 'disagree', 'inconclusive')
    .messages({
      'any.only': 'Outcome must be either "agree", "disagree", or "inconclusive"',
      'any.required': 'Outcome is required'
    }),

  resolutionNote: Joi.string()
    .optional()
    .trim()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Resolution note cannot exceed 500 characters'
    }),

  finalPrice: Joi.number()
    .optional()
    .min(0.000001)
    .messages({
      'number.min': 'Final price must be positive'
    })
});

// Prediction update validation
const updatePredictionSchema = Joi.object({
  title: Joi.string()
    .optional()
    .trim()
    .min(1)
    .max(200)
    .messages({
      'string.min': 'Prediction title cannot be empty',
      'string.max': 'Prediction title cannot exceed 200 characters'
    }),

  description: Joi.string()
    .optional()
    .trim()
    .min(1)
    .max(2000)
    .messages({
      'string.min': 'Prediction description cannot be empty',
      'string.max': 'Prediction description cannot exceed 2000 characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Prediction search validation
const searchPredictionsSchema = Joi.object({
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

  predictionType: Joi.string()
    .optional()
    .valid('price', 'event', 'market', 'other'),

  status: Joi.string()
    .optional()
    .valid('active', 'expired', 'resolved', 'cancelled', 'all')
    .default('active'),

  sortBy: Joi.string()
    .optional()
    .valid('createdAt', 'targetDate', 'totalStake', 'trendingScore', 'engagementScore')
    .default('createdAt'),

  sortOrder: Joi.string()
    .optional()
    .valid('asc', 'desc')
    .default('desc')
});

// Prediction list validation
const listPredictionsSchema = Joi.object({
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

  predictionType: Joi.string()
    .optional()
    .valid('price', 'event', 'market', 'other'),

  status: Joi.string()
    .optional()
    .valid('active', 'expired', 'resolved', 'cancelled', 'all')
    .default('active'),

  sortBy: Joi.string()
    .optional()
    .valid('createdAt', 'targetDate', 'totalStake', 'trendingScore', 'engagementScore')
    .default('createdAt'),

  sortOrder: Joi.string()
    .optional()
    .valid('asc', 'desc')
    .default('desc')
});

// User predictions validation
const userPredictionsSchema = Joi.object({
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
    .valid('active', 'expired', 'resolved', 'cancelled', 'all')
    .default('all'),

  sortBy: Joi.string()
    .optional()
    .valid('createdAt', 'targetDate', 'totalStake', 'trendingScore', 'engagementScore')
    .default('createdAt'),

  sortOrder: Joi.string()
    .optional()
    .valid('asc', 'desc')
    .default('desc')
});

// User stakes validation
const userStakesSchema = Joi.object({
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
    .valid('active', 'expired', 'resolved', 'cancelled', 'all')
    .default('all'),

  sortBy: Joi.string()
    .optional()
    .valid('stakedAt', 'createdAt', 'targetDate', 'totalStake')
    .default('stakedAt'),

  sortOrder: Joi.string()
    .optional()
    .valid('asc', 'desc')
    .default('desc')
});

// Trending predictions validation
const trendingPredictionsSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20)
});

// Asset predictions validation
const assetPredictionsSchema = Joi.object({
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
    .valid('active', 'expired', 'resolved', 'cancelled', 'all')
    .default('active'),

  sortBy: Joi.string()
    .optional()
    .valid('createdAt', 'targetDate', 'totalStake', 'trendingScore', 'engagementScore')
    .default('createdAt'),

  sortOrder: Joi.string()
    .optional()
    .valid('asc', 'desc')
    .default('desc')
});

module.exports = {
  createPredictionSchema,
  stakeSchema,
  resolvePredictionSchema,
  updatePredictionSchema,
  searchPredictionsSchema,
  listPredictionsSchema,
  userPredictionsSchema,
  userStakesSchema,
  trendingPredictionsSchema,
  assetPredictionsSchema
};
