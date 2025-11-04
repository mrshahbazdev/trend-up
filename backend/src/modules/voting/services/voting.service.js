const { DemocraticVote, VoteRecord, HodlVote } = require('../models');
const { User } = require('../../auth/models');
const { NotFoundError, ConflictError, BadRequestError } = require('../../../core/errors/AppError');
const { logger } = require('../../../core/utils/logger');

class VotingService {
  /**
   * Create a new democratic vote record
   */
  async createDemocraticVote(data) {
    const { voteId, title, creator, blockchainTxHash, expiryTimestamp } = data;

    // Check if vote already exists
    const existingVote = await DemocraticVote.findOne({ voteId });
    if (existingVote) {
      throw new ConflictError('Vote ID already exists');
    }

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: creator.toLowerCase() });

    const vote = await DemocraticVote.create({
      voteId,
      title,
      creator: creator.toLowerCase(),
      userId: user?._id,
      expiryTimestamp,
      blockchainTxHash,
      totalVotes: 0,
      votedYes: 0,
      votedNo: 0
    });

    logger.info(`Democratic vote created: ${voteId} by ${creator}`);

    return { vote, message: 'Democratic vote created successfully' };
  }

  /**
   * Record a vote on democratic proposal
   */
  async recordDemocraticVote(data) {
    const { voteId, voter, vote, blockchainTxHash, votingPower } = data;

    // Check if vote exists
    const democraticVote = await DemocraticVote.findOne({ voteId });
    if (!democraticVote) {
      throw new NotFoundError('Vote not found');
    }

    // Check if already voted
    const existingVoteRecord = await VoteRecord.findOne({ 
      voteId, 
      voter: voter.toLowerCase() 
    });
    
    if (existingVoteRecord) {
      throw new ConflictError('Already voted on this proposal');
    }

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: voter.toLowerCase() });

    // Create vote record
    const voteRecord = await VoteRecord.create({
      voteId,
      voter: voter.toLowerCase(),
      userId: user?._id,
      vote,
      votingPower,
      blockchainTxHash
    });

    // Update democratic vote counts
    const updateData = {
      $inc: { 
        totalVotes: 1,
        ...(vote ? { votedYes: 1 } : { votedNo: 1 })
      }
    };

    await DemocraticVote.findOneAndUpdate({ voteId }, updateData);

    logger.info(`Vote recorded: ${voter} voted ${vote ? 'yes' : 'no'} on vote ${voteId}`);

    return { 
      voteRecord, 
      message: 'Vote recorded successfully' 
    };
  }

  /**
   * Record a HODL vote
   */
  async recordHodlVote(data) {
    const { voter, blockchainTxHash, votingPower } = data;

    // Find user by wallet address
    const user = await User.findOne({ walletAddress: voter.toLowerCase() });

    const hodlVote = await HodlVote.create({
      voter: voter.toLowerCase(),
      userId: user?._id,
      votingPower,
      blockchainTxHash
    });

    logger.info(`HODL vote recorded: ${voter}`);

    return { 
      hodlVote, 
      message: 'HODL vote recorded successfully' 
    };
  }

  /**
   * Get democratic vote by ID
   */
  async getDemocraticVote(voteId) {
    const vote = await DemocraticVote.findOne({ voteId })
      .populate('userId', 'name username avatar')
      .lean();

    if (!vote) {
      throw new NotFoundError('Vote not found');
    }

    // Get vote records for this vote
    const voteRecords = await VoteRecord.find({ voteId })
      .populate('userId', 'name username avatar')
      .sort({ createdAt: -1 })
      .lean();

    return { vote, voteRecords };
  }

  /**
   * Get all democratic votes
   */
  async getAllDemocraticVotes(filters = {}) {
    const { page = 1, limit = 20, isActive } = filters;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const votes = await DemocraticVote.find(query)
      .populate('userId', 'name username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await DemocraticVote.countDocuments(query);

    return { 
      votes, 
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get user's voting history
   */
  async getUserVotingHistory(walletAddress, filters = {}) {
    const { page = 1, limit = 20 } = filters;

    const voteRecords = await VoteRecord.find({ 
      voter: walletAddress.toLowerCase() 
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get vote details for each record
    const voteIds = [...new Set(voteRecords.map(r => r.voteId))];
    const votes = await DemocraticVote.find({ voteId: { $in: voteIds } }).lean();
    
    const votesMap = {};
    votes.forEach(v => {
      votesMap[v.voteId] = v;
    });

    const history = voteRecords.map(record => ({
      ...record,
      voteDetails: votesMap[record.voteId]
    }));

    const total = await VoteRecord.countDocuments({ 
      voter: walletAddress.toLowerCase() 
    });

    // Get HODL votes
    const hodlVotes = await HodlVote.find({ 
      voter: walletAddress.toLowerCase() 
    })
      .sort({ createdAt: -1 })
      .lean();

    return { 
      democraticVotes: history,
      hodlVotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get HODL voting statistics
   */
  async getHodlVotingStats() {
    const totalVotes = await HodlVote.countDocuments();
    const uniqueVoters = await HodlVote.distinct('voter');
    
    const recentVotes = await HodlVote.find()
      .populate('userId', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      totalVotes,
      uniqueVoters: uniqueVoters.length,
      recentVotes
    };
  }
}

const votingService = new VotingService();

module.exports = votingService;

