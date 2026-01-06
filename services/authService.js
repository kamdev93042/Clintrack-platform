import ApiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'clintrack_token';
const USER_KEY = 'clintrack_user';

class AuthService {
  // Register a new doctor
  async register(doctorData, idDocument = null) {
    try {
      let response;

      if (idDocument) {
        console.log('📄 Preparing ID document for upload...');
        console.log('📄 Document URI:', idDocument.uri);
        console.log('📄 Document Type:', idDocument.type);
        console.log('📄 Document Name:', idDocument.name);
        console.log('📄 Platform:', Platform.OS);
        
        // Create FormData for file upload
        const formData = new FormData();
        
        // Add doctor data first
        Object.keys(doctorData).forEach(key => {
          formData.append(key, doctorData[key]);
        });

        // Determine file extension and MIME type
        const fileExtension = idDocument.name?.split('.').pop()?.toLowerCase() || 'pdf';
        let mimeType = idDocument.type || 'application/pdf';
        
        // Ensure correct MIME type based on extension
        if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
          mimeType = 'image/jpeg';
        } else if (fileExtension === 'png') {
          mimeType = 'image/png';
        } else if (fileExtension === 'gif') {
          mimeType = 'image/gif';
        } else if (fileExtension === 'pdf') {
          mimeType = 'application/pdf';
        }
        
        const fileName = idDocument.name || `document.${fileExtension}`;
        
        // Handle file upload differently for web vs native platforms
        if (Platform.OS === 'web') {
          // For web: Convert blob URI to Blob object
          console.log('🌐 Web platform detected - converting blob URI to Blob');
          
          try {
            // Fetch the blob URI and convert to Blob
            const response = await fetch(idDocument.uri);
            const blob = await response.blob();
            
            console.log('📤 Blob created:', {
              type: blob.type,
              size: blob.size,
              fileName: fileName
            });
            
            // Append Blob to FormData (web format)
            formData.append('idDocument', blob, fileName);
            
            console.log('✅ File appended to FormData (web format)');
          } catch (error) {
            console.error('❌ Error converting blob URI to Blob:', error);
            throw new Error('Failed to process file for upload. Please try again.');
          }
        } else {
          // For native platforms (iOS/Android): Use object format with uri, type, name
          console.log('📱 Native platform detected - using object format');
          
          // Ensure URI is valid for native (should start with file:// or content://)
          if (!idDocument.uri || (!idDocument.uri.startsWith('file://') && !idDocument.uri.startsWith('content://'))) {
            throw new Error('Invalid file URI. File must be selected from device storage.');
          }
          
          const fileObject = {
            uri: idDocument.uri,
            type: mimeType,
            name: fileName,
          };
          
          console.log('📤 Appending file to FormData (native format):', {
            uri: idDocument.uri?.substring(0, 50) + '...',
            type: mimeType,
            name: fileName,
            platform: Platform.OS
          });
          
          // Append file object directly - React Native FormData will handle file:// URIs
          formData.append('idDocument', fileObject);
          
          console.log('✅ File appended to FormData (native format)');
        }

        // Make request with FormData
        response = await ApiService.postFormData('/auth/register', formData, {
          includeAuth: false,
        });
      } else {
        // Regular registration without file
        response = await ApiService.post('/auth/register', doctorData, {
          includeAuth: false,
        });
      }

      // New registration flow: returns registrationToken, not token yet
      // Token will be returned after email verification
      return {
        success: true,
        message: response.message,
        registrationToken: response.registrationToken,
        email: response.email,
      };
    } catch (error) {
      // Return full error object so frontend can access error details
      return {
        success: false,
        message: error.message || 'Registration failed',
        errorData: error.response?.data || {},
        errors: error.response?.data?.errors || []
      };
    }
  }

  // Login doctor
  async login(email, password) {
    try {
      const response = await ApiService.post('/auth/login', { email, password }, {
        includeAuth: false,
      });

      // Save token and user data
      if (response.token) {
        console.log('Login successful, saving token:', response.token.substring(0, 20) + '...');
        await this.saveToken(response.token);
        await this.saveUser(response.doctor);
        ApiService.setToken(response.token);
        console.log('Token saved and set in ApiService');
      }

      return {
        success: true,
        message: response.message,
        doctor: response.doctor,
        token: response.token,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  }

  // Logout doctor
  async logout() {
    try {
      await ApiService.post('/auth/logout');
      
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

  // Get current doctor
  async getCurrentDoctor() {
    try {
      const response = await ApiService.get('/auth/me');
      return {
        success: true,
        doctor: response.doctor,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get doctor info',
      };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await ApiService.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Password change failed',
      };
    }
  }

  // Forgot password - Send OTP
  async forgotPassword(email) {
    try {
      const response = await ApiService.post('/auth/forgot-password', { email }, {
        includeAuth: false,
      });

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
      };
    }
  }

  // Verify OTP
  async verifyOTP(email, otp) {
    try {
      const response = await ApiService.post('/auth/verify-otp', { email, otp }, {
        includeAuth: false,
      });

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'OTP verification failed',
      };
    }
  }

  // Reset password
  async resetPassword(email, otp, newPassword) {
    try {
      const response = await ApiService.post('/auth/reset-password', { 
        email, 
        otp, 
        newPassword 
      }, {
        includeAuth: false,
      });

      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Password reset failed',
      };
    }
  }

  // Complete registration - Verify OTP and create account
  async completeRegistration(registrationToken, email, otp) {
    try {
      const response = await ApiService.post('/auth/complete-registration', {
        registrationToken,
        email,
        otp
      }, {
        includeAuth: false,
      });

      // Save token and user data after successful registration
      if (response.token) {
        console.log('Registration completed, saving token:', response.token.substring(0, 20) + '...');
        await this.saveToken(response.token);
        await this.saveUser(response.doctor);
        ApiService.setToken(response.token);
        console.log('Token saved and set in ApiService');
      }

      return {
        success: true,
        message: response.message,
        doctor: response.doctor,
        token: response.token,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Registration completion failed',
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
      const response = await this.getCurrentDoctor();
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

export default new AuthService();
