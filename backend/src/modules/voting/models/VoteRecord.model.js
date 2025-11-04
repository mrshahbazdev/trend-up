const mongoose = require('mongoose');

const voteRecordSchema = new mongoose.Schema(
  {
    voteId: {
      type: Number,
      required: true,
      index: true
    },
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
    vote: {
      type: Boolean,
      required: true // true = yes, false = no
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

// Compound index to prevent duplicate votes
voteRecordSchema.index({ voteId: 1, voter: 1 }, { unique: true });
voteRecordSchema.index({ voter: 1, createdAt: -1 });

const VoteRecord = mongoose.model('VoteRecord', voteRecordSchema);

module.exports = VoteRecord;

