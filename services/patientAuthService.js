import ApiService from './api';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'clintrack_patient_token';
const USER_KEY = 'clintrack_patient_user';

class PatientAuthService {
  // Login patient
  async login(mobileNumber) {
    try {
      const response = await ApiService.post('/patient-auth/login', { mobileNumber }, {
        includeAuth: false,
      });

      // Save token and user data
      if (response.token) {
        console.log('Patient login successful, saving token:', response.token.substring(0, 20) + '...');
        await this.saveToken(response.token);
        await this.saveUser(response.patient);
        ApiService.setToken(response.token);
        console.log('Token saved and set in ApiService');
      }

      return {
        success: true,
        message: response.message,
        patient: response.patient,
        token: response.token,
      };
    } catch (error) {
      // Return full error object so frontend can access error details
      return {
        success: false,
        message: error.message || 'Login failed',
        errorData: error.response?.data || {},
        errors: error.response?.data?.errors || []
      };
    }
  }

  // Logout patient
  async logout() {
    try {
      await ApiService.post('/patient-auth/logout');
      
      // Clear local storage
      await this.clearToken();
      await this.clearUser();
      ApiService.clearToken();

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      // Even if API call fails, clear local data
      await this.clearToken();
      await this.clearUser();
      ApiService.clearToken();

      return {
        success: true,
        message: 'Logged out successfully',
      };
    }
  }

  // Get current patient
  async getCurrentPatient() {
    try {
      const response = await ApiService.get('/patient-auth/me');
      return {
        success: true,
        patient: response.patient,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get patient info',
      };
    }
  }

  // Get patient images from sessions
  async getPatientImages() {
    try {
      const response = await ApiService.get('/patient-auth/images');
      const token = await this.getToken();
      // Convert relative URLs to absolute URLs and add token for Image component
      const images = (response.images || []).map(image => {
        let url = image.url;
        if (!url) return { ...image, url: null };
        
        // If URL doesn't start with http, make it absolute
        if (!url.startsWith('http')) {
          // Remove leading /api if present to avoid double /api/api/
          if (url.startsWith('/api/')) {
            url = url.substring(4); // Remove '/api'
          }
          // Ensure it starts with /
          if (!url.startsWith('/')) {
            url = '/' + url;
          }
          url = `${API_BASE_URL}${url}`;
        }
        
        // Add token as query param for Image component compatibility
        if (url && token && url.includes('/api/patient-auth/media/')) {
          url += (url.includes('?') ? '&' : '?') + `token=${encodeURIComponent(token)}`;
        }
        return { ...image, url };
      });
      return {
        success: true,
        images: images,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get patient images',
        images: [],
      };
    }
  }

  // Get patient sessions
  async getPatientSessions() {
    try {
      const response = await ApiService.get('/patient-auth/sessions');
      return {
        success: true,
        sessions: response.sessions || [],
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get patient sessions',
        sessions: [],
      };
    }
  }

  // Get patient videos from sessions
  async getPatientVideos() {
    try {
      const response = await ApiService.get('/patient-auth/videos');
      const token = await this.getToken();
      // Convert relative URLs to absolute URLs and add token
      const videos = (response.videos || []).map(video => {
        let url = video.url;
        if (!url) return { ...video, url: null };
        
        // If URL doesn't start with http, make it absolute
        if (!url.startsWith('http')) {
          // Remove leading /api if present to avoid double /api/api/
          if (url.startsWith('/api/')) {
            url = url.substring(4); // Remove '/api'
          }
          // Ensure it starts with /
          if (!url.startsWith('/')) {
            url = '/' + url;
          }
          url = `${API_BASE_URL}${url}`;
        }
        
        // Add token as query param for compatibility
        if (url && token && url.includes('/api/patient-auth/media/')) {
          url += (url.includes('?') ? '&' : '?') + `token=${encodeURIComponent(token)}`;
        }
        return { ...video, url };
      });
      return {
        success: true,
        videos: videos,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get patient videos',
        videos: [],
      };
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await this.getToken();
      if (!token) return false;

      // Set token in API service
      ApiService.setToken(token);

      // Verify token by getting current user
      const response = await this.getCurrentPatient();
      return response.success;
    } catch (error) {
      // If token is invalid, clear it
      await this.clearToken();
      ApiService.clearToken();
      return false;
    }
  }

  // Initialize authentication on app start
  async initializeAuth() {
    try {
      await ApiService.initializeToken();
      const token = await this.getToken();
      if (token) {
        ApiService.setToken(token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing patient auth:', error);
      return false;
    }
  }

  // Get stored token
  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Save token to storage
  async saveToken(token) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  // Clear token from storage
  async clearToken() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  // Get stored user
  async getUser() {
    try {
      const user = await AsyncStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Save user to storage
  async saveUser(user) {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }

  // Clear user from storage
  async clearUser() {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error clearing user:', error);
    }
  }
}

export default new PatientAuthService();

