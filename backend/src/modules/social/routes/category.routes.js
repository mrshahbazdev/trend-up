const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authenticate } = require('../../auth/middleware/auth.middleware');

// Public routes (no authentication required)
router.get('/', categoryController.getAllCategories);
router.get('/hierarchy', categoryController.getCategoryHierarchy);
router.get('/popular', categoryController.getPopularCategories);
router.get('/trending', categoryController.getTrendingCategories);
router.get('/search', categoryController.searchCategories);
router.get('/stats', categoryController.getCategoryStats);
router.get('/:categoryId', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:categoryId/subcategories', categoryController.getSubcategories);

// Protected routes (authentication required)
router.use(authenticate);

// Category CRUD operations
router.post('/', categoryController.createCategory);
router.put('/:categoryId', categoryController.updateCategory);
router.delete('/:categoryId', categoryController.deleteCategory);

// Category interactions
router.post('/:categoryId/follow', categoryController.followCategory);
router.delete('/:categoryId/follow', categoryController.unfollowCategory);

// Admin routes
router.post('/initialize-default', categoryController.initializeDefaultCategories);

module.exports = router;
