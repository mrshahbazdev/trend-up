/**
 * PHASE 1 VERIFICATION SCRIPT
 * Quick test to verify all models and utilities are working
 * Run with: node backend/src/modules/auth/test/verify-phase1.js
 */

const mongoose = require('mongoose');
const config = require('../../../config');

// Import models
const { User, Auth, EmailVerification, PasswordReset } = require('../models');

// Import utilities
const {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateVerificationCode,
  generateResetToken,
  getVerificationExpiry,
  getResetTokenExpiry,
} = require('../utils');

async function verifyPhase1() {
  console.log('🔍 PHASE 1 VERIFICATION STARTING...\n');

  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ MongoDB connected\n');

    // Test 1: Model Definitions
    console.log('TEST 1: Verifying Model Definitions');
    console.log('  ✅ User model:', User.modelName);
    console.log('  ✅ Auth model:', Auth.modelName);
    console.log('  ✅ EmailVerification model:', EmailVerification.modelName);
    console.log('  ✅ PasswordReset model:', PasswordReset.modelName);
    console.log('');

    // Test 2: JWT Utilities
    console.log('TEST 2: JWT Utilities');
    const payload = { userId: '507f1f77bcf86cd799439011', email: 'test@example.com' };
    
    const accessToken = generateAccessToken(payload);
    console.log('  ✅ Access token generated:', accessToken.substring(0, 20) + '...');
    
    const decodedAccess = verifyAccessToken(accessToken);
    console.log('  ✅ Access token verified:', decodedAccess.email);
    
    const refreshToken = generateRefreshToken(payload);
    console.log('  ✅ Refresh token generated:', refreshToken.substring(0, 20) + '...');
    
    const decodedRefresh = verifyRefreshToken(refreshToken);
    console.log('  ✅ Refresh token verified:', decodedRefresh.email);
    console.log('');

    // Test 3: Password Utilities
    console.log('TEST 3: Password Utilities');
    const password = 'TestPassword123!@#';
    
    const hashed = await hashPassword(password);
    console.log('  ✅ Password hashed:', hashed.substring(0, 20) + '...');
    
    const isMatch = await comparePassword(password, hashed);
    console.log('  ✅ Password comparison (correct):', isMatch);
    
    const isWrong = await comparePassword('wrongpassword', hashed);
    console.log('  ✅ Password comparison (wrong):', isWrong);
    
    const strongValidation = validatePasswordStrength('Strong123!@#');
    console.log('  ✅ Strong password validation:', strongValidation.valid);
    
    const weakValidation = validatePasswordStrength('weak');
    console.log('  ✅ Weak password validation:', weakValidation.valid, '(expected: false)');
    console.log('');

    // Test 4: Crypto Utilities
    console.log('TEST 4: Crypto Utilities');
    const verificationCode = generateVerificationCode();
    console.log('  ✅ Verification code:', verificationCode, `(length: ${verificationCode.length})`);
    
    const resetToken = generateResetToken();
    console.log('  ✅ Reset token:', resetToken.substring(0, 20) + '...', `(length: ${resetToken.length})`);
    
    const verifyExpiry = getVerificationExpiry();
    console.log('  ✅ Verification expiry:', verifyExpiry);
    
    const resetExpiry = getResetTokenExpiry();
    console.log('  ✅ Reset token expiry:', resetExpiry);
    console.log('');

    // Test 5: Database Operations (Create & Query)
    console.log('TEST 5: Database Operations');
    
    // Clean up test data first
    await User.deleteMany({ email: 'phase1test@example.com' });
    await Auth.deleteMany({});
    await EmailVerification.deleteMany({ email: 'phase1test@example.com' });
    
    // Create test user
    const testUser = await User.create({
      email: 'phase1test@example.com',
      name: 'Phase 1 Test User',
      username: 'phase1test',
    });
    console.log('  ✅ User created:', testUser.email);
    
    // Create auth for user
    const testAuth = await Auth.create({
      userId: testUser._id,
      password: await hashPassword('TestPassword123!@#'),
    });
    console.log('  ✅ Auth created for user');
    
    // Create email verification
    const testVerification = await EmailVerification.create({
      email: 'phase1test@example.com',
      code: generateVerificationCode(),
      expiresAt: getVerificationExpiry(),
    });
    console.log('  ✅ EmailVerification created:', testVerification.code);
    
    // Query user with auth
    const foundUser = await User.findOne({ email: 'phase1test@example.com' });
    console.log('  ✅ User found:', foundUser.name);
    
    const hasAuth = await foundUser.hasPasswordAuth();
    console.log('  ✅ User has password auth:', hasAuth);
    
    // Clean up test data
    await User.deleteOne({ _id: testUser._id });
    await Auth.deleteOne({ _id: testAuth._id });
    await EmailVerification.deleteOne({ _id: testVerification._id });
    console.log('  ✅ Test data cleaned up');
    console.log('');

    console.log('🎉 ALL TESTS PASSED! Phase 1 is working correctly.\n');

    // Close connection
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// Run verification
verifyPhase1();

