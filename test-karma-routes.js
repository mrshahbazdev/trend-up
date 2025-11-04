const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testKarmaRoutes() {
  try {
    console.log('[INFO] Testing Karma Routes...\n');

    // Test 1: Health Check
    console.log('1️⃣ Testing Health Endpoint...');
    try {
      const healthResponse = await axios.get('http://localhost:3001/health');
      console.log('[SUCCESS] Health check passed:', healthResponse.data.status);
    } catch (error) {
      console.log('[ERROR] Health check failed:', error.message);
      return;
    }

    // Test 2: Get Karma Leaderboard
    console.log('\n2️⃣ Testing Karma Leaderboard...');
    try {
      const leaderboardResponse = await axios.get(`${BASE_URL}/social/karma/leaderboard`);
      console.log('[SUCCESS] Karma leaderboard retrieved:', {
        count: leaderboardResponse.data.data.leaderboard.length
      });
    } catch (error) {
      console.log('[ERROR] Karma leaderboard failed:', error.response?.data?.message || error.message);
    }

    // Test 3: Get Badge Stats
    console.log('\n3️⃣ Testing Badge Stats...');
    try {
      const badgeStatsResponse = await axios.get(`${BASE_URL}/social/badges/stats`);
      console.log('[SUCCESS] Badge stats retrieved:', {
        totalBadges: badgeStatsResponse.data.data.stats.totalBadges
      });
    } catch (error) {
      console.log('[ERROR] Badge stats failed:', error.response?.data?.message || error.message);
    }

    // Test 4: Initialize Badges
    console.log('\n4️⃣ Testing Initialize Badges...');
    try {
      const initBadgesResponse = await axios.post(`${BASE_URL}/social/badges/initialize`);
      console.log('[SUCCESS] Badges initialized:', initBadgesResponse.data.data.message);
    } catch (error) {
      console.log('[ERROR] Initialize badges failed:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Karma Routes Test Complete!');

  } catch (error) {
    console.error('[ERROR] Test failed:', error.message);
  }
}

// Run the test
testKarmaRoutes();
