import ApiService from './api';

class DashboardService {
  // Get dashboard data
  async getDashboard() {
    try {
      const response = await ApiService.get('/doctor/dashboard');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get dashboard data',
      };
    }
  }

  // Get statistics
  async getStatistics() {
    try {
      const response = await ApiService.get('/doctor/statistics');
      return {
        success: true,
        statistics: response.statistics,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get statistics',
      };
    }
  }
}

export default new DashboardService();
