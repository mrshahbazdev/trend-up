const Joi = require('joi');

const votingValidators = {
  createDemocraticVote: {
    body: Joi.object({
      voteId: Joi.number().integer().min(0).required(),
      title: Joi.string().min(2).max(200).required(),
      creator: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
      blockchainTxHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
      expiryTimestamp: Joi.number().integer().min(0).required()
    })
  },

  recordDemocraticVote: {
    body: Joi.object({
      voteId: Joi.number().integer().min(0).required(),
      voter: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
      vote: Joi.boolean().required(),
      blockchainTxHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
      votingPower: Joi.string().required()
    })
  },

  recordHodlVote: {
    body: Joi.object({
      voter: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
      blockchainTxHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
      votingPower: Joi.string().required()
    })
  },

  getDemocraticVote: {
    params: Joi.object({
      id: Joi.number().integer().min(0).required()
    })
  },

  getUserVotingHistory: {
    params: Joi.object({
      walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
    }),
    query: Joi.object({
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1).max(100)
    })
  },

  getAllDemocraticVotes: {
    query: Joi.object({
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1).max(100),
      isActive: Joi.string().valid('true', 'false')
    })
  }
};

module.exports = votingValidators;

