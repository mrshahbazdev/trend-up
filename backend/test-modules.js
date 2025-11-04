console.log('[INFO] Testing individual modules...');

// Test 1: Core modules
try {
  console.log('[INFO] Testing core modules...');
  const logger = require('./src/core/utils/logger');
  const ErrorHandler = require('./src/core/errors/ErrorHandler');
  console.log('[SUCCESS] Core modules loaded');
} catch (error) {
  console.error('[ERROR] Core modules failed:', error.message);
  console.error('[ERROR] Stack:', error.stack);
}

// Test 2: Auth models
try {
  console.log('[INFO] Testing auth models...');
  const { User, Auth, EmailVerification, PasswordReset } = require('./src/modules/auth/models');
  console.log('[SUCCESS] Auth models loaded');
} catch (error) {
  console.error('[ERROR] Auth models failed:', error.message);
  console.error('[ERROR] Stack:', error.stack);
}

// Test 3: Social models (without moderation)
try {
  console.log('[INFO] Testing social models (without moderation)...');
  const { Post, Reaction, Comment, Karma, Badge, Follow, Category, Hashtag, Topic, Feed, Media, Poll, Prediction, Vote } = require('./src/modules/social/models');
  console.log('[SUCCESS] Social models (without moderation) loaded');
} catch (error) {
  console.error('[ERROR] Social models (without moderation) failed:', error.message);
  console.error('[ERROR] Stack:', error.stack);
}

// Test 4: Moderation models (the problematic ones)
try {
  console.log('[INFO] Testing moderation models...');
  const { Flag, Report, ModerationAction } = require('./src/modules/social/models');
  console.log('[SUCCESS] Moderation models loaded');
} catch (error) {
  console.error('[ERROR] Moderation models failed:', error.message);
  console.error('[ERROR] Stack:', error.stack);
}

// Test 5: Content Filter Service
try {
  console.log('[INFO] Testing content filter service...');
  const contentFilterService = require('./src/core/services/content-filter.service');
  console.log('[SUCCESS] Content filter service loaded');
} catch (error) {
  console.error('[ERROR] Content filter service failed:', error.message);
  console.error('[ERROR] Stack:', error.stack);
}

// Test 6: Moderation Service
try {
  console.log('[INFO] Testing moderation service...');
  const moderationService = require('./src/core/services/moderation.service');
  console.log('[SUCCESS] Moderation service loaded');
} catch (error) {
  console.error('[ERROR] Moderation service failed:', error.message);
  console.error('[ERROR] Stack:', error.stack);
}

// Test 7: Auth routes
try {
  console.log('[INFO] Testing auth routes...');
  const { authRoutes } = require('./src/modules/auth');
  console.log('[SUCCESS] Auth routes loaded');
} catch (error) {
  console.error('[ERROR] Auth routes failed:', error.message);
  console.error('[ERROR] Stack:', error.stack);
}

console.log('[INFO] Module testing completed');
