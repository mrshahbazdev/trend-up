const verificationService = require('../services/verification.service');
const authService = require('../services/auth.service');
const { sendSuccessResponse, sendCreatedResponse } = require('../../../core/utils/response');
const ErrorHandler = require('../../../core/errors/ErrorHandler');

class AuthController {
  async requestVerification(req, res) {
    const { email } = req.body;
    const result = await verificationService.requestVerification(email);
    sendSuccessResponse(res, result, 'Verification code sent successfully');
  }

  async verifyEmail(req, res) {
    const { email, code } = req.body;
    const result = await verificationService.verifyEmail(email, code);
    sendSuccessResponse(res, result, 'Email verified successfully');
  }

  async register(req, res) {
    const { email, name, password, username } = req.body;
    const result = await authService.register({
      email,
      name,
      password,
      username,
    });
    sendCreatedResponse(res, result, 'User registered successfully');
  }

  async login(req, res) {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    sendSuccessResponse(res, result, 'Login successful');
  }

  async refreshToken(req, res) {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    sendSuccessResponse(res, result, 'Token refreshed successfully');
  }

  async getCurrentUser(req, res) {
    sendSuccessResponse(res, req.user, 'User retrieved successfully');
  }
}

const authController = new AuthController();

module.exports = {
  requestVerification: ErrorHandler.handleAsync(authController.requestVerification.bind(authController)),
  verifyEmail: ErrorHandler.handleAsync(authController.verifyEmail.bind(authController)),
  register: ErrorHandler.handleAsync(authController.register.bind(authController)),
  login: ErrorHandler.handleAsync(authController.login.bind(authController)),
  refreshToken: ErrorHandler.handleAsync(authController.refreshToken.bind(authController)),
  getCurrentUser: ErrorHandler.handleAsync(authController.getCurrentUser.bind(authController)),
};

