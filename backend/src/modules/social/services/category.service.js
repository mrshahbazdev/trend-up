const { Category, Post } = require('../models');
const { logger } = require('../../../core/utils/logger');
const mongoose = require('mongoose');

class CategoryService {
  constructor() {
    // Category limits
    this.categoryLimits = {
      maxNameLength: 50,
      maxDescriptionLength: 500,
      maxRulesCount: 10,
      maxTagsCount: 20,
      maxKeywordsCount: 30,
      maxNestingLevel: 2
    };
  }

  // Create a new category
  async createCategory(categoryData, createdBy) {
    try {
      // Validate required fields
      if (!categoryData.name || !categoryData.description) {
        throw new Error('Category name and description are required');
      }

      // Check if category name already exists
      const existingCategory = await Category.findOne({ 
        $or: [
          { name: categoryData.name },
          { slug: categoryData.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') }
        ]
      });

      if (existingCategory) {
        throw new Error('Category with this name already exists');
      }

      // Set level based on parent category
      let level = 0;
      if (categoryData.parentCategoryId) {
        const parentCategory = await Category.findById(categoryData.parentCategoryId);
        if (!parentCategory) {
          throw new Error('Parent category not found');
        }

        if (parentCategory.level >= this.categoryLimits.maxNestingLevel) {
          throw new Error('Maximum nesting level reached');
        }

        level = parentCategory.level + 1;
      }

      // Create the category
      const category = new Category({
        ...categoryData,
        createdBy: new mongoose.Types.ObjectId(createdBy),
        level
      });

      await category.save();
      await category.populate('createdBy', 'name username avatar');

      logger.info(`[INFO] Category created: ${category.name} by user ${createdBy}`);
      return category;
    } catch (error) {
      logger.error(`[ERROR] Failed to create category:`, error);
      throw error;
    }
  }

  // Get all categories with optional filtering
  async getAllCategories(options = {}) {
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
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Build query
      const query = {};

      if (isActive !== null) query.isActive = isActive;
      if (isPublic !== null) query.isPublic = isPublic;
      if (parentCategoryId) query.parentCategoryId = new mongoose.Types.ObjectId(parentCategoryId);
      if (level !== null) query.level = level;

      // Add search functionality
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } },
          { keywords: { $in: [searchRegex] } }
        ];
      }

      const categories = await Category.find(query)
        .populate('createdBy', 'name username avatar')
        .populate('parentCategory', 'name slug')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await Category.countDocuments(query);

      return {
        categories,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get categories:`, error);
      throw error;
    }
  }

  // Get category by ID
  async getCategoryById(categoryId) {
    try {
      const category = await Category.findById(categoryId)
        .populate('createdBy', 'name username avatar')
        .populate('parentCategory', 'name slug description')
        .populate('subcategories', 'name slug postCount')
        .lean();

      if (!category) {
        throw new Error('Category not found');
      }

      if (!category.isActive) {
        throw new Error('Category is not active');
      }

      return category;
    } catch (error) {
      logger.error(`[ERROR] Failed to get category by ID:`, error);
      throw error;
    }
  }

  // Get category by slug
  async getCategoryBySlug(slug) {
    try {
      const category = await Category.findOne({ slug, isActive: true })
        .populate('createdBy', 'name username avatar')
        .populate('parentCategory', 'name slug description')
        .populate('subcategories', 'name slug postCount')
        .lean();

      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      logger.error(`[ERROR] Failed to get category by slug:`, error);
      throw error;
    }
  }

  // Update a category
  async updateCategory(categoryId, updateData, userId, isModerator = false) {
    try {
      const category = await Category.findById(categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }

      // Check authorization
      if (!isModerator && category.createdBy.toString() !== userId) {
        throw new Error('Not authorized to update this category');
      }

      // Check if new name conflicts with existing categories
      if (updateData.name && updateData.name !== category.name) {
        const existingCategory = await Category.findOne({ 
          name: updateData.name,
          _id: { $ne: categoryId }
        });

        if (existingCategory) {
          throw new Error('Category with this name already exists');
        }
      }

      // Update the category
      Object.assign(category, updateData);
      await category.save();
      await category.populate('createdBy', 'name username avatar');

      logger.info(`[INFO] Category ${categoryId} updated by user ${userId}`);
      return category;
    } catch (error) {
      logger.error(`[ERROR] Failed to update category:`, error);
      throw error;
    }
  }

  // Delete a category (soft delete)
  async deleteCategory(categoryId, userId, isModerator = false) {
    try {
      const category = await Category.findById(categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }

      // Check authorization
      if (!isModerator && category.createdBy.toString() !== userId) {
        throw new Error('Not authorized to delete this category');
      }

      // Check if category has posts
      const postCount = await Post.countDocuments({ categoryId: new mongoose.Types.ObjectId(categoryId) });
      if (postCount > 0) {
        throw new Error('Cannot delete category with existing posts');
      }

      // Check if category has subcategories
      const subcategoryCount = await Category.countDocuments({ parentCategoryId: new mongoose.Types.ObjectId(categoryId) });
      if (subcategoryCount > 0) {
        throw new Error('Cannot delete category with subcategories');
      }

      // Soft delete the category
      category.isActive = false;
      await category.save();

      logger.info(`[INFO] Category ${categoryId} deleted by user ${userId}`);
      return { message: 'Category deleted successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to delete category:`, error);
      throw error;
    }
  }

  // Get category hierarchy
  async getCategoryHierarchy() {
    try {
      const categories = await Category.getCategoryHierarchy();
      return categories;
    } catch (error) {
      logger.error(`[ERROR] Failed to get category hierarchy:`, error);
      throw error;
    }
  }

  // Get popular categories
  async getPopularCategories(limit = 20) {
    try {
      const categories = await Category.getPopularCategories(limit);
      return categories;
    } catch (error) {
      logger.error(`[ERROR] Failed to get popular categories:`, error);
      throw error;
    }
  }

  // Get trending categories
  async getTrendingCategories(timeframe = 7, limit = 10) {
    try {
      const categories = await Category.getTrendingCategories(timeframe, limit);
      return categories;
    } catch (error) {
      logger.error(`[ERROR] Failed to get trending categories:`, error);
      throw error;
    }
  }

  // Search categories
  async searchCategories(query, options = {}) {
    try {
      const categories = await Category.searchCategories(query, options);
      return categories;
    } catch (error) {
      logger.error(`[ERROR] Failed to search categories:`, error);
      throw error;
    }
  }

  // Get category statistics
  async getCategoryStats() {
    try {
      const stats = await Category.getCategoryStats();
      return stats[0] || {
        totalCategories: 0,
        activeCategories: 0,
        publicCategories: 0,
        totalPosts: 0,
        totalFollowers: 0,
        averagePostsPerCategory: 0
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get category stats:`, error);
      throw error;
    }
  }

  // Get subcategories
  async getSubcategories(categoryId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'name',
        sortOrder = 'asc'
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const subcategories = await Category.find({
        parentCategoryId: new mongoose.Types.ObjectId(categoryId),
        isActive: true
      })
        .populate('createdBy', 'name username avatar')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await Category.countDocuments({
        parentCategoryId: new mongoose.Types.ObjectId(categoryId),
        isActive: true
      });

      return {
        subcategories,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      };
    } catch (error) {
      logger.error(`[ERROR] Failed to get subcategories:`, error);
      throw error;
    }
  }

  // Initialize default categories
  async initializeDefaultCategories() {
    try {
      const defaultCategories = [
        {
          name: 'General',
          description: 'General discussions and topics',
          color: '#3B82F6',
          isDefault: true,
          tags: ['general', 'discussion', 'chat'],
          keywords: ['general', 'discussion', 'chat', 'talk']
        },
        {
          name: 'Technology',
          description: 'Technology news, discussions, and innovations',
          color: '#10B981',
          tags: ['tech', 'technology', 'innovation', 'software'],
          keywords: ['technology', 'tech', 'software', 'hardware', 'innovation', 'ai', 'programming']
        },
        {
          name: 'Business',
          description: 'Business news, entrepreneurship, and finance',
          color: '#F59E0B',
          tags: ['business', 'finance', 'entrepreneurship', 'startup'],
          keywords: ['business', 'finance', 'entrepreneurship', 'startup', 'investment', 'economy']
        },
        {
          name: 'Entertainment',
          description: 'Movies, music, games, and entertainment',
          color: '#EF4444',
          tags: ['entertainment', 'movies', 'music', 'games'],
          keywords: ['entertainment', 'movies', 'music', 'games', 'tv', 'celebrities', 'fun']
        },
        {
          name: 'Sports',
          description: 'Sports news, discussions, and updates',
          color: '#8B5CF6',
          tags: ['sports', 'fitness', 'athletics', 'competition'],
          keywords: ['sports', 'fitness', 'athletics', 'football', 'basketball', 'soccer', 'olympics']
        },
        {
          name: 'Science',
          description: 'Scientific discoveries, research, and education',
          color: '#06B6D4',
          tags: ['science', 'research', 'education', 'discovery'],
          keywords: ['science', 'research', 'education', 'discovery', 'physics', 'chemistry', 'biology']
        }
      ];

      const createdCategories = [];
      for (const categoryData of defaultCategories) {
        try {
          // Check if category already exists
          const existingCategory = await Category.findOne({ name: categoryData.name });
          if (existingCategory) {
            logger.warn(`[WARN] Category '${categoryData.name}' already exists, skipping`);
            continue;
          }

          const category = await this.createCategory(categoryData, 'system');
          createdCategories.push(category);
        } catch (error) {
          logger.error(`[ERROR] Failed to create default category '${categoryData.name}':`, error);
        }
      }

      logger.info(`[INFO] Initialized ${createdCategories.length} default categories`);
      return createdCategories;
    } catch (error) {
      logger.error(`[ERROR] Failed to initialize default categories:`, error);
      throw error;
    }
  }

  // Follow/Unfollow category (if implemented)
  async followCategory(categoryId, userId) {
    try {
      // This would integrate with a CategoryFollow model if implemented
      logger.info(`[INFO] User ${userId} followed category ${categoryId}`);
      return { message: 'Category followed successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to follow category:`, error);
      throw error;
    }
  }

  async unfollowCategory(categoryId, userId) {
    try {
      // This would integrate with a CategoryFollow model if implemented
      logger.info(`[INFO] User ${userId} unfollowed category ${categoryId}`);
      return { message: 'Category unfollowed successfully' };
    } catch (error) {
      logger.error(`[ERROR] Failed to unfollow category:`, error);
      throw error;
    }
  }
}

module.exports = new CategoryService();
