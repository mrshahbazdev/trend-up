const { User } = require('../../auth/models');
const { NotFoundError, ConflictError, BadRequestError } = require('../../../core/errors/AppError');
const { logger } = require('../../../core/utils/logger');

class UserService {
  /**
   * Get user's own profile
   */
  async getMyProfile(userId) {
    const user = await User.findById(userId).select('-__v');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return { user };
  }

  /**
   * Get user profile by username (public)
   */
  async getUserByUsername(username) {
    const user = await User.findOne({ username })
      .select('name username avatar bio location website coverImage followersCount followingCount postsCount createdAt')
      .lean();
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return { user };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    const { name, username, bio, location, website } = updates;

    // Check if username is being changed and if it's already taken
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        throw new ConflictError('Username already taken');
      }
    }

    // Validate website URL if provided
    if (website && website.trim() && !this.isValidUrl(website)) {
      throw new BadRequestError('Invalid website URL format');
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    logger.info(`User profile updated: ${user.email}`);

    return { 
      user,
      message: 'Profile updated successfully'
    };
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId, avatarUrl) {
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    ).select('-__v');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    logger.info(`Avatar updated for user: ${user.email}`);

    return { 
      user,
      message: 'Avatar updated successfully'
    };
  }

  /**
   * Update cover image
   */
  async updateCoverImage(userId, coverImageUrl) {
    const user = await User.findByIdAndUpdate(
      userId,
      { coverImage: coverImageUrl },
      { new: true }
    ).select('-__v');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    logger.info(`Cover image updated for user: ${user.email}`);

    return { 
      user,
      message: 'Cover image updated successfully'
    };
  }

  /**
   * Soft delete user account
   */
  async deleteAccount(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isActive: false,
        username: `deleted_${userId}`,
        email: `deleted_${userId}@deleted.com`
      },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    logger.info(`Account deleted (soft): ${userId}`);

    return { 
      message: 'Account deleted successfully'
    };
  }

  /**
   * Search users by name or username
   */
  async searchUsers(query, limit = 10) {
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    })
    .select('name username avatar bio followersCount')
    .limit(limit)
    .lean();

    return { users, count: users.length };
  }

  /**
   * Helper: Validate URL format
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

const userService = new UserService();

module.exports = userService;

