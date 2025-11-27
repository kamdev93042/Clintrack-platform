import ApiService from './api';

class ClinicOwnerService {
  // Get dashboard data
  async getDashboard() {
    try {
      console.log('[ClinicOwnerService] Fetching dashboard data...');
      const response = await ApiService.get('/clinic-owner/dashboard');
      console.log('[ClinicOwnerService] Raw API response:', JSON.stringify(response, null, 2));
      
      // The API returns { success: true, data: {...} }
      // So response is already the full object
      if (response && response.success && response.data) {
        console.log('[ClinicOwnerService] Returning data:', response.data);
        return {
          success: true,
          data: response.data,
        };
      } else {
        console.warn('[ClinicOwnerService] Unexpected response structure:', response);
        return {
          success: false,
          message: 'Unexpected response structure',
          data: response,
        };
      }
    } catch (error) {
      console.error('[ClinicOwnerService] Error fetching dashboard:', error);
      return {
        success: false,
        message: error.message || 'Failed to get dashboard data',
        error: error,
      };
    }
  }

  // Get profile data
  async getProfile() {
    try {
      const response = await ApiService.get('/clinic-owner/profile');
      return {
        success: true,
        clinicOwner: response.clinicOwner,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get profile data',
      };
    }
  }
}

export default new ClinicOwnerService();

