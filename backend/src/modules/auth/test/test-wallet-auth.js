const { ethers } = require('ethers');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1/auth';

async function testWalletAuth() {
  console.log('========================================');
  console.log('WALLET AUTHENTICATION TEST');
  console.log('========================================\n');

  try {
    const wallet = ethers.Wallet.createRandom();
    console.log('Test Wallet Created:');
    console.log(`  Address: ${wallet.address}`);
    console.log('');

    console.log('STEP 1: Requesting nonce...');
    const nonceResp = await axios.post(`${BASE_URL}/wallet/request-nonce`, {
      walletAddress: wallet.address,
    });

    const { message, nonce } = nonceResp.data.data;
    console.log('PASS - Nonce received');
    console.log(`  Nonce: ${nonce.substring(0, 20)}...`);
    console.log(`  Message to sign: ${message.substring(0, 50)}...`);
    console.log('');

    console.log('STEP 2: Signing message with wallet...');
    const signature = await wallet.signMessage(message);
    console.log('PASS - Message signed');
    console.log(`  Signature: ${signature.substring(0, 40)}...`);
    console.log('');

    console.log('STEP 3: Verifying signature and authenticating...');
    const verifyResp = await axios.post(`${BASE_URL}/wallet/verify`, {
      walletAddress: wallet.address,
      signature,
      nonce,
    });

    console.log('PASS - Wallet authenticated!');
    console.log('\nUser Details:');
    console.log(`  ID: ${verifyResp.data.data.user._id}`);
    console.log(`  Email: ${verifyResp.data.data.user.email}`);
    console.log(`  Wallet: ${verifyResp.data.data.user.walletAddress}`);
    console.log(`  Wallet Verified: ${verifyResp.data.data.user.walletVerified}`);
    console.log('\nTokens:');
    console.log(`  Access Token: ${verifyResp.data.data.accessToken.substring(0, 40)}...`);
    console.log(`  Refresh Token: ${verifyResp.data.data.refreshToken.substring(0, 40)}...`);
    console.log('');

    console.log('STEP 4: Testing protected route with wallet-generated token...');
    const meResp = await axios.get(`${BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${verifyResp.data.data.accessToken}`,
      },
    });

    console.log('PASS - Protected route works with wallet auth!');
    console.log(`  User: ${meResp.data.data.name}`);
    console.log('');

    console.log('========================================');
    console.log('ALL WALLET AUTH TESTS PASSED!');
    console.log('========================================');
    
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error.response?.data || error.message);
    process.exit(1);
  }
}

testWalletAuth();

