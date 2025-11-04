const express = require('express');
const {
  requestNonce,
  verifySignature,
} = require('../controllers/wallet.controller');
const {
  requestNonceValidator,
  verifyWalletValidator,
} = require('../validators/wallet.validators');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const walletLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many wallet authentication requests. Please try again later',
  },
});

router.post(
  '/request-nonce',
  walletLimiter,
  requestNonceValidator,
  requestNonce
);

router.post(
  '/verify',
  walletLimiter,
  verifyWalletValidator,
  verifySignature
);

module.exports = router;

