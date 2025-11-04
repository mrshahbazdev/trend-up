/**
 * src/pages/live/constants.js
 *
 * Shared constants for the Live application.
 * All values now come from environment variables
 */

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api/v1/live';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
export const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || '087b6bd261f845b2bca5586c9ca2178a';
export const AGORA_SDK_URL = import.meta.env.VITE_AGORA_SDK_URL || 'https://download.agora.io/sdk/release/AgoraRTC_N-4.20.2.js';

// Validate required environment variables
export const validateEnv = () => {
  const required = ['VITE_AGORA_APP_ID'];
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    return false;
  }
  
  console.log('✅ Environment variables loaded successfully');
  return true;
};

// Export configuration object
export const config = {
  backend: {
    url: BACKEND_URL,
    endpoints: {
      liveSpaces: `${BACKEND_URL}/space/live`,
      spaceDetails: `${BACKEND_URL}/space/details`,
      joinToken: `${BACKEND_URL}/token/join`,
      userJoined: `${BACKEND_URL}/space/user-joined`,
      userLeft: `${BACKEND_URL}/space/user-left`,
      startSpace: `${BACKEND_URL}/space/start`,
      stopSpace: `${BACKEND_URL}/space/stop`,
      raiseHand: `${BACKEND_URL}/space/raise-hand`,
      lowerHand: `${BACKEND_URL}/space/lower-hand`,
      acceptHand: `${BACKEND_URL}/space/accept-hand`,
      removeSpeaker: `${BACKEND_URL}/space/remove-speaker`
    }
  },
  socket: {
    url: SOCKET_URL,
    events: {
      registerUser: 'register-user',
      userJoined: 'user-joined',
      userLeft: 'user-left',
      roomStateUpdate: 'roomStateUpdate',
      heartbeat: 'heartbeat'
    }
  },
  agora: {
    appId: AGORA_APP_ID,
    sdkUrl: AGORA_SDK_URL,
    tokenExpiration: 3600, // 1 hour in seconds
    role: {
      publisher: 'publisher',
      subscriber: 'subscriber'
    }
  }
};

export default config;