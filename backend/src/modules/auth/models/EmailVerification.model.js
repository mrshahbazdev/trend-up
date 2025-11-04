const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
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

// Indexes
// email index is automatically created by unique: true
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Instance method to check if code is expired
emailVerificationSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

// Instance method to increment attempts
emailVerificationSchema.methods.incrementAttempts = async function () {
  this.attempts += 1;
  await this.save();
};

// Instance method to verify code
emailVerificationSchema.methods.verify = async function (code) {
  if (this.isExpired()) {
    throw new Error('Verification code has expired');
  }

  if (this.attempts >= 5) {
    throw new Error('Maximum verification attempts exceeded');
  }

  if (this.code !== code) {
    await this.incrementAttempts();
    throw new Error('Invalid verification code');
  }

  this.verified = true;
  await this.save();
  return true;
};

const EmailVerification = mongoose.model(
  'EmailVerification',
  emailVerificationSchema
);

module.exports = EmailVerification;
