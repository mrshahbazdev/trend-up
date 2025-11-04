const categoryService = require('../services/category.service');
const { logger } = require('../../../core/utils/logger');
const { ResponseHandler } = require('../../../core/utils/response');

class CategoryController {
  // Create a new category
  async createCategory(req, res, next) {
    try {
      const userId = req.user.userId;
      const category = await categoryService.createCategory(req.body, userId);

      return ResponseHandler.success(res, {
        category,
        message: 'Category created successfully'
      }, 201);
    } catch (error) {
      logger.error(`[ERROR] Failed to create category:`, error);
      next(error);
    }
  }

  // Get all categories
  async getAllCategories(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'name',
        sortOrder = 'asc',
        isActive = true,
        isPublic = true,
        parentCategoryId = null,
        level = null,
        search = null
      } = req.query;

      const result = await categoryService.getAllCategories({
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        isActive: isActive === 'true',
        isPublic: isPublic === 'true',
        parentCategoryId,
        level: level ? parseInt(level) : null,
        search
      });

      return ResponseHandler.success(res, {
        categories: result.categories,
        pagination: result.pagination,
        message: 'Categories retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get categories:`, error);
      next(error);
    }
  }

  // Get category by ID
  async getCategoryById(req, res, next) {
    try {
      const { categoryId } = req.params;
      const category = await categoryService.getCategoryById(categoryId);

      return ResponseHandler.success(res, {
        category,
        message: 'Category retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get category by ID:`, error);
      next(error);
    }
  }

  // Get category by slug
  async getCategoryBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const category = await categoryService.getCategoryBySlug(slug);

      return ResponseHandler.success(res, {
        category,
        message: 'Category retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get category by slug:`, error);
      next(error);
    }
  }

  // Update a category
  async updateCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const userId = req.user.userId;
      const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

      const category = await categoryService.updateCategory(categoryId, req.body, userId, isModerator);

      return ResponseHandler.success(res, {
        category,
        message: 'Category updated successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to update category:`, error);
      next(error);
    }
  }

  // Delete a category
  async deleteCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const userId = req.user.userId;
      const isModerator = req.user.role === 'moderator' || req.user.role === 'admin';

      const result = await categoryService.deleteCategory(categoryId, userId, isModerator);

      return ResponseHandler.success(res, {
        result,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to delete category:`, error);
      next(error);
    }
  }

  // Get category hierarchy
  async getCategoryHierarchy(req, res, next) {
    try {
      const categories = await categoryService.getCategoryHierarchy();

      return ResponseHandler.success(res, {
        categories,
        message: 'Category hierarchy retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get category hierarchy:`, error);
      next(error);
    }
  }

  // Get popular categories
  async getPopularCategories(req, res, next) {
    try {
      const { limit = 20 } = req.query;
      const categories = await categoryService.getPopularCategories(parseInt(limit));

      return ResponseHandler.success(res, {
        categories,
        message: 'Popular categories retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get popular categories:`, error);
      next(error);
    }
  }

  // Get trending categories
  async getTrendingCategories(req, res, next) {
    try {
      const { timeframe = 7, limit = 10 } = req.query;
      const categories = await categoryService.getTrendingCategories(
        parseInt(timeframe),
        parseInt(limit)
      );

      return ResponseHandler.success(res, {
        categories,
        message: 'Trending categories retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending categories:`, error);
      next(error);
    }
  }

  // Search categories
  async searchCategories(req, res, next) {
    try {
      const { q, limit = 20, offset = 0 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const categories = await categoryService.searchCategories(q.trim(), {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return ResponseHandler.success(res, {
        categories,
        query: q.trim(),
        message: 'Category search completed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to search categories:`, error);
      next(error);
    }
  }

  // Get category statistics
  async getCategoryStats(req, res, next) {
    try {
      const stats = await categoryService.getCategoryStats();

      return ResponseHandler.success(res, {
        stats,
        message: 'Category statistics retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get category stats:`, error);
      next(error);
    }
  }

  // Get subcategories
  async getSubcategories(req, res, next) {
    try {
      const { categoryId } = req.params;
      const {
        page = 1,
        limit = 20,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      const result = await categoryService.getSubcategories(categoryId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      });

      return ResponseHandler.success(res, {
        subcategories: result.subcategories,
        pagination: result.pagination,
        message: 'Subcategories retrieved successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to get subcategories:`, error);
      next(error);
    }
  }

  // Initialize default categories
  async initializeDefaultCategories(req, res, next) {
    try {
      const categories = await categoryService.initializeDefaultCategories();

      return ResponseHandler.success(res, {
        categories,
        message: 'Default categories initialized successfully'
      }, 201);
    } catch (error) {
      logger.error(`[ERROR] Failed to initialize default categories:`, error);
      next(error);
    }
  }

  // Follow category
  async followCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const userId = req.user.userId;

      const result = await categoryService.followCategory(categoryId, userId);

      return ResponseHandler.success(res, {
        result,
        message: 'Category followed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to follow category:`, error);
      next(error);
    }
  }

  // Unfollow category
  async unfollowCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const userId = req.user.userId;

      const result = await categoryService.unfollowCategory(categoryId, userId);

      return ResponseHandler.success(res, {
        result,
        message: 'Category unfollowed successfully'
      });
    } catch (error) {
      logger.error(`[ERROR] Failed to unfollow category:`, error);
      next(error);
    }
  }
}

module.exports = new CategoryController();
