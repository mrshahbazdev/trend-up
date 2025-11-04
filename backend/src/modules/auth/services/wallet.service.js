const { ethers } = require('ethers');
const { User } = require('../models');
const { ConflictError, AuthenticationError } = require('../../../core/errors/AppError');
const { generateWalletNonce, generateAccessToken, generateRefreshToken } = require('../utils');
const { logger } = require('../../../core/utils/logger');

class WalletService {
  constructor() {
    this.nonces = new Map();
    this.nonceExpiry = parseInt(process.env.WALLET_SIGNATURE_EXPIRE_MINUTES) || 5;
  }

  async requestNonce(walletAddress) {
    const normalizedAddress = walletAddress.toLowerCase();
    
    const nonce = generateWalletNonce();
    const message = process.env.WALLET_SIGNATURE_MESSAGE || 'Sign this message to authenticate with TrendUpCoin';
    const fullMessage = `${message}\n\nNonce: ${nonce}`;
    
    this.nonces.set(normalizedAddress, {
      nonce,
      expiresAt: Date.now() + (this.nonceExpiry * 60 * 1000),
    });

    logger.info(`Nonce generated for wallet: ${normalizedAddress}`);

    return {
      message: fullMessage,
      nonce,
      expiresIn: `${this.nonceExpiry} minutes`,
    };
  }

  async verifyWalletSignature(walletAddress, signature, nonce, linkToEmail = null) {
    const normalizedAddress = walletAddress.toLowerCase();

    const storedNonce = this.nonces.get(normalizedAddress);
    
    if (!storedNonce || storedNonce.nonce !== nonce) {
      throw new AuthenticationError('Invalid or expired nonce');
    }

    if (Date.now() > storedNonce.expiresAt) {
      this.nonces.delete(normalizedAddress);
      throw new AuthenticationError('Nonce has expired');
    }

    const message = process.env.WALLET_SIGNATURE_MESSAGE || 'Sign this message to authenticate with TrendUpCoin';
    const fullMessage = `${message}\n\nNonce: ${nonce}`;

    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(fullMessage, signature);
    } catch (error) {
      logger.error('Signature verification failed:', {
        error: error.message,
        stack: error.stack,
        walletAddress
      });
      throw new AuthenticationError('Invalid signature');
    }

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      throw new AuthenticationError('Signature does not match wallet address');
    }

    this.nonces.delete(normalizedAddress);

    if (linkToEmail) {
      return await this.linkWalletToAccount(normalizedAddress, linkToEmail);
    }

    let user = await User.findOne({ walletAddress: normalizedAddress });

    if (!user) {
      user = await User.create({
        walletAddress: normalizedAddress,
        walletVerified: true,
        name: `User ${normalizedAddress.substring(0, 8)}`,
        email: `${normalizedAddress}@wallet.trendupcoin.com`,
        isEmailVerified: false,
      });

      logger.info(`New user created with wallet: ${normalizedAddress}`);
    } else {
      user.walletVerified = true;
      await user.save();
    }

    const userObject = user.toObject();
    delete userObject.__v;

    const accessToken = generateAccessToken({
      userId: userObject._id,
      email: userObject.email,
    });

    const refreshToken = generateRefreshToken({
      userId: userObject._id,
      email: userObject.email,
    });

    logger.info(`Wallet authentication successful: ${normalizedAddress}`);

    return {
      user: userObject,
      accessToken,
      refreshToken,
    };
  }

  async linkWalletToAccount(walletAddress, email) {
    const normalizedAddress = walletAddress.toLowerCase();

    const user = await User.findOne({ email });
    if (!user) {
      throw new AuthenticationError('User not found with this email');
    }

    const existingWallet = await User.findOne({ walletAddress: normalizedAddress });
    if (existingWallet && existingWallet._id.toString() !== user._id.toString()) {
      throw new ConflictError('This wallet is already linked to another account');
    }

    user.walletAddress = normalizedAddress;
    user.walletVerified = true;
    await user.save();

    logger.info(`Wallet linked to account: ${email} -> ${normalizedAddress}`);

    const userObject = user.toObject();
    delete userObject.__v;

    const accessToken = generateAccessToken({
      userId: userObject._id,
      email: userObject.email,
    });

    const refreshToken = generateRefreshToken({
      userId: userObject._id,
      email: userObject.email,
    });

    return {
      user: userObject,
      accessToken,
      refreshToken,
    };
  }

  cleanupExpiredNonces() {
    const now = Date.now();
    for (const [address, data] of this.nonces.entries()) {
      if (now > data.expiresAt) {
        this.nonces.delete(address);
      }
    }
  }
}

const walletService = new WalletService();

setInterval(() => {
  walletService.cleanupExpiredNonces();
}, 5 * 60 * 1000);

module.exports = walletService;

