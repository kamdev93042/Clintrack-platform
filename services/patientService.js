import ApiService from './api';

class PatientService {
  // Add new patient
  async addPatient(patientData) {
    try {
      const response = await ApiService.post('/patients', patientData);
      return {
        success: true,
        message: response.message,
        patient: response.patient,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to add patient',
      };
    }
  }

  // Get all patients with pagination and filters
  async getPatients(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.page) queryParams.append('page', options.page);
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.status) queryParams.append('status', options.status);
      if (options.search) queryParams.append('search', options.search);

      const endpoint = `/patients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await ApiService.get(endpoint);
      
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get patients',
      };
    }
  }

  // Get single patient
  async getPatient(patientId) {
    try {
      const response = await ApiService.get(`/patients/${patientId}`);
      return {
        success: true,
        message: response.message,
        patient: response.patient,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get patient',
      };
    }
  }

  // Update patient
  async updatePatient(patientId, patientData) {
    try {
      const response = await ApiService.put(`/patients/${patientId}`, patientData);
      return {
        success: true,
        message: response.message,
        patient: response.patient,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update patient',
      };
    }
  }

  // Delete patient
  async deletePatient(patientId) {
    try {
      const response = await ApiService.delete(`/patients/${patientId}`);
      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete patient',
      };
    }
  }

  // Get patient statistics
  async getPatientStats() {
    try {
      const response = await ApiService.get('/patients/stats');
      return {
        success: true,
        message: response.message,
        stats: response.stats,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get patient statistics',
      };
    }
  }

  // Search patients
  async searchPatients(query, limit = 10) {
    try {
      const response = await ApiService.get(`/patients/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      return {
        success: true,
        message: response.message,
        patients: response.patients,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to search patients',
      };
    }
  }
}

export default new PatientService();
