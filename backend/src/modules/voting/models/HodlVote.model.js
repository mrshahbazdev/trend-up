const mongoose = require('mongoose');

const hodlVoteSchema = new mongoose.Schema(
  {
    voter: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    votingPower: {
      type: String,
      required: true // Token balance at vote time
    },
    blockchainTxHash: {
      type: String,
      required: true,
      unique: true
    }
  },
  {
    timestamps: true
  }
);

// Index for queries
hodlVoteSchema.index({ voter: 1, createdAt: -1 });
hodlVoteSchema.index({ createdAt: -1 });

const HodlVote = mongoose.model('HodlVote', hodlVoteSchema);

module.exports = HodlVote;

