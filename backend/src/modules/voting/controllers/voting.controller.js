const votingService = require('../services/voting.service');
const { successResponse } = require('../../../core/utils/response');

class VotingController {
  /**
   * POST /api/voting/democratic/create
   * Create a new democratic vote
   */
  async createDemocraticVote(req, res, next) {
    try {
      const { voteId, title, creator, blockchainTxHash, expiryTimestamp } = req.body;

      const result = await votingService.createDemocraticVote({
        voteId,
        title,
        creator,
        blockchainTxHash,
        expiryTimestamp
      });

      res.status(201).json(
        successResponse(result, result.message)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/voting/democratic/vote
   * Record a vote on democratic proposal
   */
  async recordDemocraticVote(req, res, next) {
    try {
      const { voteId, voter, vote, blockchainTxHash, votingPower } = req.body;

      const result = await votingService.recordDemocraticVote({
        voteId,
        voter,
        vote,
        blockchainTxHash,
        votingPower
      });

      res.status(201).json(
        successResponse(result, result.message)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/voting/hodl
   * Record a HODL vote
   */
  async recordHodlVote(req, res, next) {
    try {
      const { voter, blockchainTxHash, votingPower } = req.body;

      const result = await votingService.recordHodlVote({
        voter,
        blockchainTxHash,
        votingPower
      });

      res.status(201).json(
        successResponse(result, result.message)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/voting/democratic/:id
   * Get democratic vote details
   */
  async getDemocraticVote(req, res, next) {
    try {
      const { id } = req.params;
      const result = await votingService.getDemocraticVote(Number(id));

      res.json(
        successResponse(result, 'Vote retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/voting/democratic
   * Get all democratic votes
   */
  async getAllDemocraticVotes(req, res, next) {
    try {
      const { page, limit, isActive } = req.query;
      
      const result = await votingService.getAllDemocraticVotes({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        isActive: isActive ? isActive === 'true' : undefined
      });

      res.json(
        successResponse(result, 'Votes retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/voting/user/history/:walletAddress
   * Get user's voting history
   */
  async getUserVotingHistory(req, res, next) {
    try {
      const { walletAddress } = req.params;
      const { page, limit } = req.query;

      const result = await votingService.getUserVotingHistory(walletAddress, {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20
      });

      res.json(
        successResponse(result, 'Voting history retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/voting/hodl/stats
   * Get HODL voting statistics
   */
  async getHodlVotingStats(req, res, next) {
    try {
      const result = await votingService.getHodlVotingStats();

      res.json(
        successResponse(result, 'HODL stats retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}

const votingController = new VotingController();

module.exports = votingController;

