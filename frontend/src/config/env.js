/**
 * Frontend Environment Configuration
 * 
 * Access environment variables consistently across the app
 */

export const env = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
  
  // WalletConnect
  walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'a65bc026af82f217afeb8f7543a83113',
  
  // Environment
  isDevelopment: import.meta.env.VITE_ENV === 'development' || import.meta.env.DEV,
  isProduction: import.meta.env.VITE_ENV === 'production' || import.meta.env.PROD,
};

/**
 * Helper function to get full image URL
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path; // Already full URL
  return `${env.backendUrl}${path}`;
};

export default env;

