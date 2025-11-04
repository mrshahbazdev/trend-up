const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

const requestNonceValidator = [
  body('walletAddress')
    .notEmpty()
    .withMessage('Wallet address is required')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum wallet address'),
  validate,
];

const verifyWalletValidator = [
  body('walletAddress')
    .notEmpty()
    .withMessage('Wallet address is required')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid Ethereum wallet address'),
  body('signature')
    .notEmpty()
    .withMessage('Signature is required'),
  body('nonce')
    .notEmpty()
    .withMessage('Nonce is required'),
  body('linkToEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  validate,
];

module.exports = {
  requestNonceValidator,
  verifyWalletValidator,
};

