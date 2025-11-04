const jwt = require('jsonwebtoken');
const config = require('../../../config');
const { AuthenticationError } = require('../../../core/errors/AppError');

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload { userId, email }
 * @returns {String} JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE || '30m',
    issuer: 'trendupcoin-api',
    audience: 'trendupcoin-client',
  });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload { userId, email }
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE || '14d',
    issuer: 'trendupcoin-api',
    audience: 'trendupcoin-client',
  });
};

/**
 * Verify JWT access token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret, {
      issuer: 'trendupcoin-api',
      audience: 'trendupcoin-client',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Access token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid access token');
    }
    throw error;
  }
};

/**
 * Verify JWT refresh token
 * @param {String} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret, {
      issuer: 'trendupcoin-api',
      audience: 'trendupcoin-client',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Refresh token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (useful for debugging)
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};
