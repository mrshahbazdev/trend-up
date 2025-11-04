const mongoose = require('mongoose');

const democraticVoteSchema = new mongoose.Schema(
  {
    voteId: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    creator: {
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
    totalVotes: {
      type: Number,
      default: 0
    },
    votedYes: {
      type: Number,
      default: 0
    },
    votedNo: {
      type: Number,
      default: 0
    },
    expiryTimestamp: {
      type: Number,
      required: true
    },
    blockchainTxHash: {
      type: String,
      required: true,
      unique: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
democraticVoteSchema.index({ creator: 1, createdAt: -1 });
democraticVoteSchema.index({ expiryTimestamp: 1 });
democraticVoteSchema.index({ isActive: 1, createdAt: -1 });

const DemocraticVote = mongoose.model('DemocraticVote', democraticVoteSchema);

module.exports = DemocraticVote;

