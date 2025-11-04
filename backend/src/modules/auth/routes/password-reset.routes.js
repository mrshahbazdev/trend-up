const express = require('express');
const {
  forgotPassword,
  validateResetToken,
  resetPassword,
} = require('../controllers/password-reset.controller');
const {
  forgotPasswordValidator,
  resetPasswordValidator,
  validateResetTokenValidator,
} = require('../validators/password-reset.validators');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again after a minute',
  },
});

const mediumLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});

router.post(
  '/forgot-password',
  strictLimiter,
  forgotPasswordValidator,
  forgotPassword
);

router.get(
  '/validate-reset-token/:token',
  mediumLimiter,
  validateResetTokenValidator,
  validateResetToken
);

router.post(
  '/reset-password',
  strictLimiter,
  resetPasswordValidator,
  resetPassword
);

module.exports = router;

