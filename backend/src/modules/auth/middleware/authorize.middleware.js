/**
 * Authorization Middleware
 * Checks if user has required roles
 */

const { AuthorizationError } = require('../../../core/errors/AppError');
const ErrorHandler = require('../../../core/errors/ErrorHandler');

const authorize = (roles = []) => {
  return ErrorHandler.handleAsync(async (req, res, next) => {
    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    // If no roles specified, allow access
    if (roles.length === 0) {
      return next();
    }

    // Check if user has required role
    const userRole = req.user.role || 'user';
    
    if (!roles.includes(userRole)) {
      throw new AuthorizationError(`Access denied. Required roles: ${roles.join(', ')}`);
    }

    next();
  });
};

module.exports = { authorize };
