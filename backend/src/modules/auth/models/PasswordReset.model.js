const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
passwordResetSchema.index({ email: 1 });
passwordResetSchema.index({ expiresAt: 1 });
passwordResetSchema.index({ email: 1, used: 1 });
passwordResetSchema.index({ token: 1, used: 1 });

// TTL index to auto-delete expired tokens after 24 hours
passwordResetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// Instance method to check if token is valid
passwordResetSchema.methods.isValid = function () {
  return !this.used && this.expiresAt > new Date();
};

// Instance method to mark token as used
passwordResetSchema.methods.markAsUsed = async function () {
  this.used = true;
  await this.save();
};

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

module.exports = PasswordReset;
