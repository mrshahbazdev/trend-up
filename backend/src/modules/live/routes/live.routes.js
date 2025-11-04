const express = require('express');
const liveController = require('../controllers/live.controller');
const { authenticate } = require('../../auth/middleware/auth.middleware');
const { isSpaceOwner } = require('../middleware/live.middleware');

const router = express.Router();

// --- Public Routes ---
router.get('/space/live', liveController.getLiveSpaces);
router.get('/space/details/:channelName', liveController.getSpaceDetails);
router.post('/token/join', liveController.getJoinToken);

// ✅ FIXED: user-joined aur user-left ko completely public banao
router.post('/space/user-joined', liveController.userJoined);
router.post('/space/user-left', liveController.userLeft);

// --- Authenticated Routes (Require Login) ---
router.post('/space/start', authenticate, liveController.startSpace);
router.post('/space/raise-hand', authenticate, liveController.raiseHand);
router.post('/space/lower-hand', authenticate, liveController.lowerHand);

// --- Owner-Specific Routes (Require Login AND Ownership) ---
router.post('/space/stop', authenticate, isSpaceOwner, liveController.stopSpace);
router.post('/space/accept-hand', authenticate, isSpaceOwner, liveController.acceptHand);
router.post('/space/remove-speaker', authenticate, isSpaceOwner, liveController.removeSpeaker);

module.exports = router;