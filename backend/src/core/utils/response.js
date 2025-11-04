const { logger } = require('./logger');

class ResponseHandler {
  static success(res, data = null, message = 'Success', statusCode = 200, meta = {}) {
    const response = {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    };

    logger.info({
      statusCode,
      message,
      url: res.req?.originalUrl,
      method: res.req?.method
    });

    return res.status(statusCode).json(response);
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  static paginated(res, data, pagination, message = 'Data retrieved successfully') {
    return this.success(res, data, message, 200, { pagination });
  }
}

// Convenience functions
const sendSuccessResponse = (res, data, message, statusCode, meta) => 
  ResponseHandler.success(res, data, message, statusCode, meta);

const sendCreatedResponse = (res, data, message) => 
  ResponseHandler.created(res, data, message);

const sendPaginatedResponse = (res, data, pagination, message) => 
  ResponseHandler.paginated(res, data, pagination, message);

const sendErrorResponse = (res, message = 'Error', statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
    error: {
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      ...error
    }
  };

  logger.error({
    statusCode,
    message,
    error,
    url: res.req?.originalUrl,
    method: res.req?.method
  });

  return res.status(statusCode).json(response);
};

module.exports = {
  ResponseHandler,
  sendSuccessResponse,
  sendCreatedResponse,
  sendPaginatedResponse,
  sendErrorResponse
};
