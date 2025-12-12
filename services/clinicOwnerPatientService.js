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
      console.log('📡 Calling patient details API for ID:', patientId);
      const response = await ApiService.get(`/clinic-owner/patients/${patientId}`);
      
      console.log('📡 Patient details API response:', {
        hasResponse: !!response,
        hasData: !!response?.data,
        hasPatient: !!response?.data?.patient,
        success: response?.success
      });
      
      // Handle different response structures
      if (response && response.data) {
        return {
          success: true,
          data: response.data,
        };
      } else if (response && response.patient) {
        // Handle case where patient is directly in response
        return {
          success: true,
          data: {
            patient: response.patient,
            sessions: response.sessions || [],
            payments: response.payments || []
          },
        };
      } else {
        console.warn('⚠️ Unexpected response structure:', response);
        return {
          success: false,
          message: 'Unexpected response structure from server',
        };
      }
    } catch (error) {
      console.error('❌ Error getting patient details:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        endpoint: `/clinic-owner/patients/${patientId}`
      });
      return {
        success: false,
        message: error?.response?.data?.message || error.message || 'Failed to get patient details',
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

