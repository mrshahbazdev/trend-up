const emailService = require('./email.service');
const verificationService = require('./verification.service');
const authService = require('./auth.service');
const passwordResetService = require('./password-reset.service');
const walletService = require('./wallet.service');

module.exports = {
  emailService,
  verificationService,
  authService,
  passwordResetService,
  walletService,
};


