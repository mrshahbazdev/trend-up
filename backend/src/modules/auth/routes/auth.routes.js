const express = require('express');
const {
  requestVerification,
  verifyEmail,
  register,
  login,
  refreshToken,
  getCurrentUser,
} = require('../controllers/auth.controller');
const {
  requestVerificationValidator,
  verifyEmailValidator,
  registerValidator,
  loginValidator,
  refreshTokenValidator,
} = require('../validators/auth.validators');
const { authenticate } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after a minute',
  },
});

const verificationLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});

router.post(
  '/request-verification',
  verificationLimiter,
  requestVerificationValidator,
  requestVerification
);

router.post(
  '/verify-email',
  verificationLimiter,
  verifyEmailValidator,
  verifyEmail
);

router.post(
  '/register',
  authLimiter,
  registerValidator,
  register
);

router.post(
  '/login',
  authLimiter,
  loginValidator,
  login
);

router.post(
  '/refresh',
  verificationLimiter,
  refreshTokenValidator,
  refreshToken
);

router.get(
  '/me',
  authenticate,
  getCurrentUser
);

const passwordResetRoutes = require('./password-reset.routes');
router.use('/', passwordResetRoutes);

const walletRoutes = require('./wallet.routes');
router.use('/wallet', walletRoutes);

module.exports = router;

