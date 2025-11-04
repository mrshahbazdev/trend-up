const crypto = require('crypto');

/**
 * Generate random verification code (6 digits)
 * @returns {String} 6-digit code
 */
const generateVerificationCode = () => {
  const codeLength = parseInt(process.env.EMAIL_VERIFICATION_CODE_LENGTH) || 6;
  const min = Math.pow(10, codeLength - 1);
  const max = Math.pow(10, codeLength) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

/**
 * Generate random password reset token
 * @returns {String} Hex token
 */
const generateResetToken = () => {
  const tokenLength = parseInt(process.env.PASSWORD_RESET_TOKEN_LENGTH) || 64;
  return crypto.randomBytes(tokenLength).toString('hex');
};

/**
 * Generate random wallet nonce for signature verification
 * @returns {String} Random nonce
 */
const generateWalletNonce = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash sensitive data (one-way)
 * @param {String} data - Data to hash
 * @returns {String} SHA256 hash
 */
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate expiration date for verification code
 * @returns {Date} Expiration date
 */
const getVerificationExpiry = () => {
  const minutes = parseInt(process.env.EMAIL_VERIFICATION_EXPIRE_MINUTES) || 15;
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Generate expiration date for password reset token
 * @returns {Date} Expiration date
 */
const getResetTokenExpiry = () => {
  const hours = parseInt(process.env.PASSWORD_RESET_EXPIRE_HOURS) || 1;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

module.exports = {
  generateVerificationCode,
  generateResetToken,
  generateWalletNonce,
  hashData,
  getVerificationExpiry,
  getResetTokenExpiry,
};
