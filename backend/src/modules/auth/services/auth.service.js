const { User, Auth } = require('../models');
const { ConflictError, AuthenticationError } = require('../../../core/errors/AppError');
const { hashPassword, generateAccessToken, generateRefreshToken } = require('../utils');
const verificationService = require('./verification.service');
const emailService = require('./email.service');
const { logger } = require('../../../core/utils/logger');
const mongoose = require('mongoose');

class AuthService {
  async register({ email, name, password, username }) {
    const isVerified = await verificationService.isEmailVerified(email);
    if (!isVerified) {
      throw new ConflictError('Email must be verified before registration');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        throw new ConflictError('Username already taken');
      }
    }

    const hashedPassword = await hashPassword(password);

    try {
      const user = await User.create({
        email,
        name,
        username,
        isEmailVerified: true,
      });

      await Auth.create({
        userId: user._id,
        password: hashedPassword,
      });

      const userObject = user.toObject();
      delete userObject.__v;

      const accessToken = generateAccessToken({
        userId: userObject._id,
        email: userObject.email,
      });

      const refreshToken = generateRefreshToken({
        userId: userObject._id,
        email: userObject.email,
      });

      logger.info(`User registered successfully: ${email}`);

      try {
        await emailService.sendWelcomeEmail(email, name);
      } catch (error) {
        logger.error(`Failed to send welcome email to ${email}:`, {
          error: error.message,
          stack: error.stack
        });
      }

      return {
        user: userObject,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Registration error:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  async login({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    const auth = await Auth.findOne({ userId: user._id }).select('+password');
    if (!auth) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (auth.isLocked) {
      throw new AuthenticationError(
        'Account is locked due to too many failed login attempts. Please try again later'
      );
    }

    const { comparePassword } = require('../utils');
    const isPasswordValid = await comparePassword(password, auth.password);

    if (!isPasswordValid) {
      await auth.incLoginAttempts();
      throw new AuthenticationError('Invalid email or password');
    }

    await auth.resetLoginAttempts();
    await user.updateLastLogin(null);

    const userObject = user.toObject();
    delete userObject.__v;

    const accessToken = generateAccessToken({
      userId: userObject._id,
      email: userObject.email,
    });

    const refreshToken = generateRefreshToken({
      userId: userObject._id,
      email: userObject.email,
    });

    logger.info(`User logged in successfully: ${email}`);

    return {
      user: userObject,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken) {
    const { verifyRefreshToken, generateAccessToken } = require('../utils');

    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const newAccessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
    });

    return {
      accessToken: newAccessToken,
    };
  }
}

const authService = new AuthService();

module.exports = authService;

