import ApiService from './api';

class IncomeService {
  // Get comprehensive income data (all in one) - recommended
  async getIncome(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit);

      const endpoint = `/income${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await ApiService.get(endpoint);
      
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get income data',
      };
    }
  }

  // Get income statistics
  async getIncomeStatistics() {
    try {
      const response = await ApiService.get('/income/statistics');
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get income statistics',
      };
    }
  }

  // Get recent sessions
  async getRecentSessions(limit = 10) {
    try {
      const response = await ApiService.get(`/income/recent-sessions?limit=${limit}`);
      return {
        success: true,
        message: response.message,
        sessions: response.sessions,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get recent sessions',
      };
    }
  }

  // Get monthly income
  async getMonthlyIncome(timeframe = 'last6months', startDate, endDate) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('timeframe', timeframe);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await ApiService.get(`/income/monthly?${queryParams.toString()}`);
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get monthly income',
      };
    }
  }
}

export default new IncomeService();

