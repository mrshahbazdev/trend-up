# 🔐 TrendUpCoin Auth Module

## Phase 1: Models & Utilities ✅

This phase establishes the foundation for the authentication system.

### 📁 Structure

auth/
├── models/
│ ├── User.model.js # User profile model
│ ├── Auth.model.js # Password storage model
│ ├── EmailVerification.model.js # Email verification codes
│ ├── PasswordReset.model.js # Password reset tokens
│ └── index.js # Model exports
├── utils/
│ ├── jwt.util.js # JWT token utilities
│ ├── password.util.js # Password hashing utilities
│ ├── crypto.util.js # Crypto utilities (codes, tokens)
│ └── index.js # Utility exports
└── tests/
└── phase1.test.js # Phase 1 tests

### 🗄️ Models

#### User Model

- **Fields**: email, username, name, avatar, bio, walletAddress, role
- **Features**: Email & wallet verification, social stats, last login tracking
- **Indexes**: email, username, walletAddress, createdAt

#### Auth Model

- **Fields**: userId, password, passwordChangedAt
- **Features**: Failed login tracking, account locking (5 attempts = 2hr lock)
- **Security**: Password excluded by default in queries

#### EmailVerification Model

- **Fields**: email, code, verified, attempts, expiresAt
- **Features**: 6-digit code, 15min expiry, 5 attempt limit
- **Auto-cleanup**: TTL index removes expired documents

#### PasswordReset Model

- **Fields**: email, token, used, expiresAt
- **Features**: Hex token, 1hr expiry, one-time use
- **Auto-cleanup**: Deleted after 24 hours

### 🛠️ Utilities

#### JWT Utilities

- `generateAccessToken(payload)` - Create access token (30m)
- `generateRefreshToken(payload)` - Create refresh token (14d)
- `verifyAccessToken(token)` - Verify access token
- `verifyRefreshToken(token)` - Verify refresh token
- `decodeToken(token)` - Decode without verification

#### Password Utilities

- `hashPassword(password)` - Hash with bcrypt (10 rounds)
- `comparePassword(password, hash)` - Compare password
- `validatePasswordStrength(password)` - Validate strength

#### Crypto Utilities

- `generateVerificationCode()` - 6-digit code
- `generateResetToken()` - Hex token (64 bytes)
- `generateWalletNonce()` - Wallet signature nonce
- `getVerificationExpiry()` - Code expiry date
- `getResetTokenExpiry()` - Token expiry date

### ✅ Testing

Run Phase 1 tests:

```bash
npm test -- phase1.test.js
```

### 📝 Next Steps

Phase 2: Email Service (Nodemailer setup & templates)
