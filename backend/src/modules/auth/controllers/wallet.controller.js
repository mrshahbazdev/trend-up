const walletService = require('../services/wallet.service');
const { sendSuccessResponse } = require('../../../core/utils/response');
const ErrorHandler = require('../../../core/errors/ErrorHandler');

class WalletController {
  async requestNonce(req, res) {
    const { walletAddress } = req.body;
    const result = await walletService.requestNonce(walletAddress);
    sendSuccessResponse(res, result, 'Nonce generated successfully');
  }

  async verifySignature(req, res) {
    const { walletAddress, signature, nonce, linkToEmail } = req.body;
    const result = await walletService.verifyWalletSignature(
      walletAddress,
      signature,
      nonce,
      linkToEmail
    );
    sendSuccessResponse(res, result, 'Wallet verified successfully');
  }
}

const walletController = new WalletController();

module.exports = {
  requestNonce: ErrorHandler.handleAsync(walletController.requestNonce.bind(walletController)),
  verifySignature: ErrorHandler.handleAsync(walletController.verifySignature.bind(walletController)),
};

