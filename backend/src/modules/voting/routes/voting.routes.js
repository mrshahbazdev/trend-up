const express = require('express');
const router = express.Router();
const votingController = require('../controllers/voting.controller');
const votingValidators = require('../validators/voting.validators');
const { validate } = require('../../../core/utils/validator');

// Democratic voting routes
router.post(
  '/democratic/create',
  validate(votingValidators.createDemocraticVote),
  votingController.createDemocraticVote.bind(votingController)
);

router.post(
  '/democratic/vote',
  validate(votingValidators.recordDemocraticVote),
  votingController.recordDemocraticVote.bind(votingController)
);

router.get(
  '/democratic/:id',
  validate(votingValidators.getDemocraticVote),
  votingController.getDemocraticVote.bind(votingController)
);

router.get(
  '/democratic',
  validate(votingValidators.getAllDemocraticVotes),
  votingController.getAllDemocraticVotes.bind(votingController)
);

// HODL voting routes
router.post(
  '/hodl',
  validate(votingValidators.recordHodlVote),
  votingController.recordHodlVote.bind(votingController)
);

router.get(
  '/hodl/stats',
  votingController.getHodlVotingStats.bind(votingController)
);

// User voting history
router.get(
  '/user/history/:walletAddress',
  validate(votingValidators.getUserVotingHistory),
  votingController.getUserVotingHistory.bind(votingController)
);

module.exports = router;

