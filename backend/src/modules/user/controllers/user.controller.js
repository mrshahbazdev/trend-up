const userService = require('../services/user.service');
const s3Service = require('../../../core/services/s3.service');
const { sendSuccessResponse } = require('../../../core/utils/response');
const ErrorHandler = require('../../../core/errors/ErrorHandler');

class UserController {
  async getMyProfile(req, res) {
    const result = await userService.getMyProfile(req.user._id);
    sendSuccessResponse(res, result, 'Profile retrieved successfully');
  }

  async getUserByUsername(req, res) {
    const { username } = req.params;
    const result = await userService.getUserByUsername(username);
    sendSuccessResponse(res, result, 'User retrieved successfully');
  }

  async updateProfile(req, res) {
    const { name, username, bio, location, website } = req.body;
    const result = await userService.updateProfile(req.user._id, {
      name,
      username,
      bio,
      location,
      website
    });
    
    sendSuccessResponse(res, result, result.message);
  }

  async updateAvatar(req, res) {
    if (!req.file) {
      return sendSuccessResponse(res, { message: 'No file uploaded' }, 'No file uploaded', 400);
    }

    // Upload to S3
    const filename = s3Service.generateFilename(req.user._id, req.file.originalname, 'avatar');
    const uploadResult = await s3Service.uploadFile(
      req.file.buffer,
      'avatars',
      filename,
      req.file.mimetype
    );

    // Delete old avatar from S3 if exists
    if (req.user.avatar && req.user.avatar.includes('amazonaws.com')) {
      await s3Service.deleteFile(req.user.avatar);
    }

    // Update user with S3 URL
    const result = await userService.updateAvatar(req.user._id, uploadResult.url);
    
    sendSuccessResponse(res, result, result.message);
  }

  async updateCoverImage(req, res) {
    if (!req.file) {
      return sendSuccessResponse(res, { message: 'No file uploaded' }, 'No file uploaded', 400);
    }

    // Upload to S3
    const filename = s3Service.generateFilename(req.user._id, req.file.originalname, 'cover');
    const uploadResult = await s3Service.uploadFile(
      req.file.buffer,
      'covers',
      filename,
      req.file.mimetype
    );

    // Delete old cover from S3 if exists
    if (req.user.coverImage && req.user.coverImage.includes('amazonaws.com')) {
      await s3Service.deleteFile(req.user.coverImage);
    }

    // Update user with S3 URL
    const result = await userService.updateCoverImage(req.user._id, uploadResult.url);
    
    sendSuccessResponse(res, result, result.message);
  }

  async deleteAccount(req, res) {
    const result = await userService.deleteAccount(req.user._id);
    sendSuccessResponse(res, result, result.message);
  }

  async searchUsers(req, res) {
    const { q, limit } = req.query;
    
    if (!q || q.trim().length < 2) {
      return sendSuccessResponse(res, { users: [], count: 0 }, 'Query too short');
    }

    const result = await userService.searchUsers(q, parseInt(limit) || 10);
    sendSuccessResponse(res, result, 'Users retrieved successfully');
  }
}

const userController = new UserController();

module.exports = {
  getMyProfile: ErrorHandler.handleAsync(userController.getMyProfile.bind(userController)),
  getUserByUsername: ErrorHandler.handleAsync(userController.getUserByUsername.bind(userController)),
  updateProfile: ErrorHandler.handleAsync(userController.updateProfile.bind(userController)),
  updateAvatar: ErrorHandler.handleAsync(userController.updateAvatar.bind(userController)),
  updateCoverImage: ErrorHandler.handleAsync(userController.updateCoverImage.bind(userController)),
  deleteAccount: ErrorHandler.handleAsync(userController.deleteAccount.bind(userController)),
  searchUsers: ErrorHandler.handleAsync(userController.searchUsers.bind(userController)),
};

