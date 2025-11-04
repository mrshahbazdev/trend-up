const { PasswordReset, User, Auth } = require('../models');
const { NotFoundError, ConflictError } = require('../../../core/errors/AppError');
const { generateResetToken, getResetTokenExpiry, hashPassword } = require('../utils');
const emailService = require('./email.service');
const { logger } = require('../../../core/utils/logger');

class PasswordResetService {
  async requestPasswordReset(email) {
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        message: 'If an account exists with this email, a password reset link has been sent',
      };
    }

    const token = generateResetToken();
    const expiresAt = getResetTokenExpiry();

    await PasswordReset.findOneAndUpdate(
      { email },
      {
        email,
        token,
        expiresAt,
        used: false,
      },
      { upsert: true, new: true }
    );

    try {
      await emailService.sendPasswordResetEmail(email, token, user.name);
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${email}:`, {
        error: error.message,
        stack: error.stack
      });
      logger.info(`Password reset token for ${email}: ${token}`);
    }

    return {
      message: 'If an account exists with this email, a password reset link has been sent',
    };
  }

  async validateResetToken(token) {
    const resetRecord = await PasswordReset.findOne({ token });

    if (!resetRecord) {
      return false;
    }

    return resetRecord.isValid();
  }

  async resetPassword(token, newPassword) {
    const resetRecord = await PasswordReset.findOne({ token });

    if (!resetRecord) {
      throw new NotFoundError('Invalid or expired reset token');
    }

    if (!resetRecord.isValid()) {
      throw new ConflictError('Reset token has expired or already been used');
    }

    const user = await User.findOne({ email: resetRecord.email });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const hashedPassword = await hashPassword(newPassword);

    await Auth.findOneAndUpdate(
      { userId: user._id },
      { 
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
      { upsert: true }
    );

    await resetRecord.markAsUsed();

    logger.info(`Password reset successfully for ${resetRecord.email}`);

    return {
      message: 'Password reset successfully. You can now login with your new password',
    };
  }
}

const passwordResetService = new PasswordResetService();

module.exports = passwordResetService;

