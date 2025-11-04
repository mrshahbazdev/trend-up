const { EmailVerification, User } = require('../models');
const { ConflictError, NotFoundError } = require('../../../core/errors/AppError');
const { generateVerificationCode, getVerificationExpiry } = require('../utils');
const emailService = require('./email.service');
const { logger } = require('../../../core/utils/logger');

class VerificationService {
  async requestVerification(email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const code = generateVerificationCode();
    const expiresAt = getVerificationExpiry();

    await EmailVerification.findOneAndUpdate(
      { email },
      {
        email,
        code,
        expiresAt,
        verified: false,
        attempts: 0,
      },
      { upsert: true, new: true }
    );

    try {
      await emailService.sendVerificationEmail(email, code);
      logger.info(`Verification code sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send verification email to ${email}:`, {
        error: error.message,
        stack: error.stack
      });
      logger.info(`Verification code for ${email}: ${code}`);
    }

    return {
      message: 'Verification code sent to your email',
      email,
      expiresIn: '15 minutes',
    };
  }

  async verifyEmail(email, code) {
    const verification = await EmailVerification.findOne({ email });

    if (!verification) {
      throw new NotFoundError('No verification request found for this email');
    }

    if (verification.verified) {
      return {
        message: 'Email already verified',
        verified: true,
      };
    }

    if (verification.attempts >= 5) {
      throw new ConflictError('Maximum verification attempts exceeded. Please request a new code');
    }

    if (verification.isExpired()) {
      throw new ConflictError('Verification code has expired. Please request a new code');
    }

    if (verification.code !== code) {
      verification.attempts += 1;
      await verification.save();
      throw new ConflictError('Invalid verification code');
    }

    verification.verified = true;
    await verification.save();

    logger.info(`Email verified successfully: ${email}`);

    return {
      message: 'Email verified successfully',
      verified: true,
    };
  }

  async isEmailVerified(email) {
    const verification = await EmailVerification.findOne({ email });
    return verification?.verified || false;
  }
}

const verificationService = new VerificationService();

module.exports = verificationService;

