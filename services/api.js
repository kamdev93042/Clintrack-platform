// API Configuration and Base Service
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
  }

  // Get authentication token
  getToken() {
    return this.token;
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
  }

  // Initialize token from storage
  async initializeToken() {
    try {
      const token = await AsyncStorage.getItem('clintrack_token');
      if (token) {
        this.token = token;
      }
    } catch (error) {
      console.error('Error initializing token:', error);
    }
  }

  // Get headers for API requests
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('Sending token:', this.token.substring(0, 20) + '...');
    } else if (includeAuth) {
      console.log('No token available for authenticated request');
    }

    return headers;
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.includeAuth !== false),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Create an error object with response data for better error handling
        const error = new Error(data.message || 'API request failed');
        error.response = { data, status: response.status };
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // POST request with FormData (for file uploads)
  async postFormData(endpoint, formData, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get headers with auth (but don't set Content-Type - let fetch set it with boundary)
    const headers = this.getHeaders(options.includeAuth !== false);
    // Remove Content-Type so fetch can set it automatically with boundary
    delete headers['Content-Type'];
    
    const config = {
      method: 'POST',
      headers: headers,
      body: formData,
      ...options,
    };

    try {
      console.log('Making FormData request to:', url);
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'API request failed');
        }
        
        return data;
      } else {
        // Handle non-JSON response (like HTML error pages)
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }
}

export default new ApiService();
