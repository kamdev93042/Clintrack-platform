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

  // Get trends data (patient growth and uploads trend)
  async getTrends() {
    try {
      const response = await ApiService.get('/clinic-owner/trends');
      if (response && response.success && response.data) {
        return {
          success: true,
          data: response.data,
        };
      } else {
        return {
          success: false,
          message: 'Failed to get trends data',
          data: {
            patientGrowth: [],
            uploadsTrend: []
          }
        };
      }
    } catch (error) {
      console.error('[ClinicOwnerService] Error fetching trends:', error);
      return {
        success: false,
        message: error.message || 'Failed to get trends data',
        data: {
          patientGrowth: [],
          uploadsTrend: []
        }
      };
    }
  }
}

export default new ClinicOwnerService();

