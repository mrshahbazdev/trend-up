const passwordResetService = require('../services/password-reset.service');
const { sendSuccessResponse } = require('../../../core/utils/response');
const ErrorHandler = require('../../../core/errors/ErrorHandler');

class PasswordResetController {
  async forgotPassword(req, res) {
    const { email } = req.body;
    const result = await passwordResetService.requestPasswordReset(email);
    sendSuccessResponse(res, result, result.message);
  }

  async validateResetToken(req, res) {
    const { token } = req.params;
    const isValid = await passwordResetService.validateResetToken(token);
    sendSuccessResponse(res, { valid: isValid }, 'Token validation completed');
  }

  async resetPassword(req, res) {
    const { token, password } = req.body;
    const result = await passwordResetService.resetPassword(token, password);
    sendSuccessResponse(res, result, result.message);
  }
}

const passwordResetController = new PasswordResetController();

module.exports = {
  forgotPassword: ErrorHandler.handleAsync(passwordResetController.forgotPassword.bind(passwordResetController)),
  validateResetToken: ErrorHandler.handleAsync(passwordResetController.validateResetToken.bind(passwordResetController)),
  resetPassword: ErrorHandler.handleAsync(passwordResetController.resetPassword.bind(passwordResetController)),
};

