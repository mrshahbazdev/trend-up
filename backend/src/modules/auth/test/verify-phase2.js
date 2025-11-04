/**
 * PHASE 2 VERIFICATION SCRIPT
 * Test email service and templates
 * Run with: node backend/src/modules/auth/test/verify-phase2.js <your-email@example.com>
 */

const emailService = require('../services/email.service');
const { generateVerificationCode, generateResetToken } = require('../utils');

async function verifyPhase2() {
  console.log('PHASE 2 VERIFICATION STARTING...\n');

  const testEmail = process.argv[2];

  if (!testEmail) {
    console.error('ERROR: Please provide a test email address');
    console.log('Usage: node backend/src/modules/auth/test/verify-phase2.js your-email@example.com');
    process.exit(1);
  }

  try {
    // Test 1: Verify email connection
    console.log('TEST 1: Verifying Email Connection');
    const isConnected = await emailService.verifyConnection();
    if (isConnected) {
      console.log('  PASS Email server connection verified\n');
    } else {
      throw new Error('Email server connection failed');
    }

    // Test 2: Send verification code email
    console.log('TEST 2: Sending Verification Code Email');
    const code = generateVerificationCode();
    console.log(`  Code generated: ${code}`);
    
    await emailService.sendVerificationEmail(testEmail, code, 'Test User');
    console.log(`  PASS Verification email sent to ${testEmail}\n`);

    // Test 3: Send password reset email
    console.log('TEST 3: Sending Password Reset Email');
    const token = generateResetToken();
    console.log(`  Token generated: ${token.substring(0, 20)}...`);
    
    await emailService.sendPasswordResetEmail(testEmail, token, 'Test User');
    console.log(`  PASS Password reset email sent to ${testEmail}\n`);

    // Test 4: Send welcome email
    console.log('TEST 4: Sending Welcome Email');
    await emailService.sendWelcomeEmail(testEmail, 'Test User');
    console.log(`  PASS Welcome email sent to ${testEmail}\n`);

    console.log('ALL TESTS PASSED! Phase 2 is working correctly.\n');
    console.log(`Check your inbox at ${testEmail} for 3 test emails.`);
    
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check backend/.env file has correct SMTP settings');
    console.error('2. For Gmail, use App Password not regular password');
    console.error('3. Verify SMTP_USER and SMTP_PASS are set correctly');
    
    process.exit(1);
  }
}

verifyPhase2();


