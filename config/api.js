// API Configuration
// HARDCODE PRODUCTION URL - This ensures built APK always uses production
const PRODUCTION_API_URL = 'http://3.110.168.166/api';

// For built APK, always use production URL
// Only use localhost if explicitly in Expo Go development
const getBaseURL = () => {
  // Check if we're in Expo Go (development)
  // In production builds, __DEV__ will be false or undefined
  const isDevelopment = typeof __DEV__ !== 'undefined' && __DEV__ === true;
  
  if (isDevelopment) {
    // Only in Expo Go development
    console.log('🔧 API: Using DEVELOPMENT URL (Expo Go)');
    return 'http://localhost:5000/api';
  }
  
  // Production build - ALWAYS use production URL
  console.log('🔧 API: Using PRODUCTION URL (Built APK)');
  console.log('🔧 API URL:', PRODUCTION_API_URL);
  console.log('🔧 __DEV__:', typeof __DEV__ !== 'undefined' ? __DEV__ : 'undefined');
  return PRODUCTION_API_URL;
};

// Export the API base URL
export const API_BASE_URL = getBaseURL();

// Log immediately when module loads
console.log('═══════════════════════════════════════');
console.log('📡 API Configuration Loaded');
console.log('📡 API_BASE_URL:', API_BASE_URL);
console.log('📡 Is Development:', typeof __DEV__ !== 'undefined' && __DEV__ === true);
console.log('═══════════════════════════════════════');

// For compatibility
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5000/api',
  },
  production: {
    baseURL: PRODUCTION_API_URL,
  },
};

export default {
  baseURL: API_BASE_URL,
  ...API_CONFIG
};
