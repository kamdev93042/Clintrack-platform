// API Configuration
const API_CONFIG = {
  // Development
  development: {
    baseURL: 'http://localhost:5000/api',
  },
  
  // Production (update with your production URL)
  production: {
    baseURL: 'http://3.110.168.166/api',
  },
};

// Get current environment
const getEnvironment = () => {
  // Always use production for built APK
  // In development (Expo Go), __DEV__ will be true
  // In production build (APK), __DEV__ will be false
  // For safety, if __DEV__ is undefined or false, use production
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return 'production';
  }
  return 'development';
};

// Force production URL for built APKs
// In production builds, always use production URL
const getBaseURL = () => {
  const env = getEnvironment();
  const url = API_CONFIG[env].baseURL;
  
  // Log for debugging (remove in production if needed)
  console.log('🔧 API Configuration:');
  console.log('   Environment:', env);
  console.log('   __DEV__:', typeof __DEV__ !== 'undefined' ? __DEV__ : 'undefined');
  console.log('   API Base URL:', url);
  console.log('   Full config:', API_CONFIG);
  
  return url;
};

// Export the current API configuration
export const API_BASE_URL = getBaseURL();

export default API_CONFIG[getEnvironment()];
