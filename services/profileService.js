import ApiService from './api';

class ProfileService {
  // Get doctor profile
  async getProfile() {
    try {
      const response = await ApiService.get('/doctor/profile');
      return {
        success: true,
        doctor: response.doctor,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get profile',
      };
    }
  }

  // Update doctor profile
  async updateProfile(profileData) {
    try {
      const response = await ApiService.put('/doctor/profile', profileData);
      return {
        success: true,
        message: response.message,
        doctor: response.doctor,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update profile',
      };
    }
  }

  // Upload ID document
  async uploadIdDocument(fileData) {
    try {
      // Note: This would need to be implemented with proper file upload
      // For now, returning a placeholder response
      return {
        success: false,
        message: 'File upload not implemented yet',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to upload document',
      };
    }
  }
}

export default new ProfileService();
