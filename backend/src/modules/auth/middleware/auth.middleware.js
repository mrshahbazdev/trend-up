const { verifyAccessToken } = require('../utils');
const { User } = require('../models');
const { AuthenticationError } = require('../../../core/errors/AppError');
const ErrorHandler = require('../../../core/errors/ErrorHandler');

const authMiddleware = ErrorHandler.handleAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided');
  }

  const token = authHeader.split(' ')[1];

  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  if (!user.isActive) {
    throw new AuthenticationError('User account is inactive');
  }

  req.user = user.toObject();
  delete req.user.__v;

  next();
});

module.exports = {
  authenticate: authMiddleware
};

