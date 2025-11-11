// API Configuration
const API_CONFIG = {
  // Development
  development: {
    baseURL: 'http://localhost:5000/api',
  },
  
  // Production (update with your production URL)
  production: {
    baseURL: 'https://your-production-api.com/api',
  },
};

// Get current environment
const getEnvironment = () => {
  // In development, you can use __DEV__ from React Native
  // In production, you might want to use a different method
  return __DEV__ ? 'development' : 'production';
};

// Export the current API configuration
export const API_BASE_URL = API_CONFIG[getEnvironment()].baseURL;

export default API_CONFIG[getEnvironment()];
