import ApiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'clinic_owner_token';
const USER_KEY = 'clinic_owner_user';

class ClinicOwnerAuthService {
  // Register a new clinic owner
  async register(clinicOwnerData) {
    try {
      console.log('Calling register API with data:', { ...clinicOwnerData, password: '***' });
      const response = await ApiService.post('/clinic-owner-auth/register', clinicOwnerData, {
        includeAuth: false,
      });

      console.log('Registration API response:', response);

      // Save token and user data
      if (response.token) {
        console.log('Registration successful, saving token:', response.token.substring(0, 20) + '...');
        await this.saveToken(response.token);
        await this.saveUser(response.clinicOwner);
        ApiService.setToken(response.token);
        console.log('Token saved and set in ApiService');
      }

      return {
        success: true,
        message: response.message,
        clinicOwner: response.clinicOwner,
        token: response.token,
      };
    } catch (error) {
      console.error('Registration error details:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Registration failed';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  // Login clinic owner
  async login(email, password) {
    try {
      const response = await ApiService.post('/clinic-owner-auth/login', { email, password }, {
        includeAuth: false,
      });

      // Save token and user data
      if (response.token) {
        console.log('Login successful, saving token:', response.token.substring(0, 20) + '...');
        await this.saveToken(response.token);
        await this.saveUser(response.clinicOwner);
        ApiService.setToken(response.token);
        console.log('Token saved and set in ApiService');
      }

      return {
        success: true,
        message: response.message,
        clinicOwner: response.clinicOwner,
        token: response.token,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  }

  // Logout clinic owner
  async logout() {
    try {
      await ApiService.post('/clinic-owner-auth/logout');
      
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

  // Get current clinic owner
  async getCurrentClinicOwner() {
    try {
      const response = await ApiService.get('/clinic-owner-auth/me');
      return {
        success: true,
        clinicOwner: response.clinicOwner,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get clinic owner info',
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
      const response = await this.getCurrentClinicOwner();
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
      console.error('Error initializing auth:', error);
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

export default new ClinicOwnerAuthService();

