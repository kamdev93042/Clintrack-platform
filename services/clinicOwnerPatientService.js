import ApiService from './api';

class ClinicOwnerPatientService {
  // Get all patients across the clinic
  async getPatients(search = '', status = '', page = 1, limit = 50) {
    try {
      let endpoint = `/clinic-owner/patients?page=${page}&limit=${limit}`;
      
      if (search) {
        endpoint += `&search=${encodeURIComponent(search)}`;
      }
      
      if (status) {
        endpoint += `&status=${encodeURIComponent(status)}`;
      }

      const response = await ApiService.get(endpoint);
      return {
        success: true,
        patients: response.data.patients,
        total: response.data.total,
        page: response.data.page,
        totalPages: response.data.totalPages,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get patients',
        patients: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }
  }

  // Get patient details
  async getPatientDetails(patientId) {
    try {
      const response = await ApiService.get(`/clinic-owner/patients/${patientId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get patient details',
      };
    }
  }

  // Get patient statistics
  async getPatientStats() {
    try {
      const response = await ApiService.get('/clinic-owner/patients/stats');
      return {
        success: true,
        stats: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get patient statistics',
        stats: {
          totalPatients: 0,
          activePatients: 0,
          inactivePatients: 0,
          dischargedPatients: 0,
          totalSessions: 0,
          totalRevenue: 0,
        },
      };
    }
  }
}

export default new ClinicOwnerPatientService();

