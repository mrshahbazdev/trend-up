const { AppError } = require('./AppError');
const { logger } = require('../utils/logger');
const config = require('../../config');

class ErrorHandler {
  static handle(err, req, res, next) {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
      error: err.message,
      stack: err.stack,
      statusCode: err.statusCode || 500,
      name: err.name,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      const message = 'Invalid ID format';
      error = new AppError(message, 400, 'INVALID_ID');
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const message = `${field} already exists`;
      error = new AppError(message, 409, 'DUPLICATE_FIELD');
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(el => ({
        field: el.path,
        message: el.message
      }));
      const message = 'Validation failed';
      error = new AppError(message, 400, 'VALIDATION_ERROR');
      error.errors = errors;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      const message = 'Invalid token';
      error = new AppError(message, 401, 'INVALID_TOKEN');
    }

    if (err.name === 'TokenExpiredError') {
      const message = 'Token expired';
      error = new AppError(message, 401, 'TOKEN_EXPIRED');
    }

    // Send error response
    ErrorHandler.sendErrorResponse(res, error);
  }

  static sendErrorResponse(res, error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    const errorCode = error.errorCode || 'INTERNAL_ERROR';

    const response = {
      success: false,
      message,
      error: {
        code: errorCode,
        details: error.errors || null,
        timestamp: new Date().toISOString()
      }
    };

    // Don't leak error details in production
    if (config.server.env === 'production' && statusCode === 500) {
      response.message = 'Something went wrong!';
      response.error.details = null;
    }

    res.status(statusCode).json(response);
  }

  static handleAsync(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  static handleUncaughtException() {
    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
        error: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code
      });
      process.exit(1);
    });
  }

  static handleUnhandledRejection() {
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...', {
        error: err?.message || String(err),
        stack: err?.stack,
        name: err?.name,
        code: err?.code,
        reason: err?.reason
      });
      process.exit(1);
    });
  }
}

module.exports = ErrorHandler;
