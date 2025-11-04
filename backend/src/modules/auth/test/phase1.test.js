/**
 * PHASE 1 TESTS - Models & Utilities
 * Run with: npm test -- phase1.test.js
 */

const mongoose = require('mongoose');
const { User, Auth, EmailVerification, PasswordReset } = require('../models');
const {
  generateAccessToken,
  verifyAccessToken,
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateVerificationCode,
  generateResetToken,
} = require('../utils');

describe('Phase 1: Models & Utilities', () => {
  describe('Utilities', () => {
    describe('JWT Utilities', () => {
      it('should generate and verify access token', () => {
        const payload = { userId: '123', email: 'test@example.com' };
        const token = generateAccessToken(payload);
        expect(token).toBeTruthy();

        const decoded = verifyAccessToken(token);
        expect(decoded.userId).toBe(payload.userId);
        expect(decoded.email).toBe(payload.email);
      });
    });

    describe('Password Utilities', () => {
      it('should hash and compare password', async () => {
        const password = 'Test123!@#';
        const hashed = await hashPassword(password);
        expect(hashed).toBeTruthy();
        expect(hashed).not.toBe(password);

        const isMatch = await comparePassword(password, hashed);
        expect(isMatch).toBe(true);

        const isNotMatch = await comparePassword('wrong', hashed);
        expect(isNotMatch).toBe(false);
      });

      it('should validate password strength', () => {
        const weak = validatePasswordStrength('weak');
        expect(weak.valid).toBe(false);
        expect(weak.errors.length).toBeGreaterThan(0);

        const strong = validatePasswordStrength('Strong123!@#');
        expect(strong.valid).toBe(true);
        expect(strong.errors.length).toBe(0);
      });
    });

    describe('Crypto Utilities', () => {
      it('should generate 6-digit verification code', () => {
        const code = generateVerificationCode();
        expect(code).toBeTruthy();
        expect(code.length).toBe(6);
        expect(/^\d{6}$/.test(code)).toBe(true);
      });

      it('should generate reset token', () => {
        const token = generateResetToken();
        expect(token).toBeTruthy();
        expect(token.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Models', () => {
    it('User model should be defined', () => {
      expect(User).toBeDefined();
      expect(User.modelName).toBe('User');
    });

    it('Auth model should be defined', () => {
      expect(Auth).toBeDefined();
      expect(Auth.modelName).toBe('Auth');
    });

    it('EmailVerification model should be defined', () => {
      expect(EmailVerification).toBeDefined();
      expect(EmailVerification.modelName).toBe('EmailVerification');
    });

    it('PasswordReset model should be defined', () => {
      expect(PasswordReset).toBeDefined();
      expect(PasswordReset.modelName).toBe('PasswordReset');
    });
  });
});
