import ApiService from './api';
import ClinicOwnerAuthService from './clinicOwnerAuthService';

class ClinicOwnerDoctorService {
  // Add doctor to clinic (by email)
  async addDoctor(email) {
    try {
      const response = await ApiService.post('/clinic-owner/doctors', { email });
      return {
        success: true,
        message: response.message,
        doctor: response.doctor,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to add doctor',
      };
    }
  }

  // Search all doctors by pincode (for adding to clinic)
  async searchDoctorsByPincode(pincode) {
    try {
      const response = await ApiService.get(`/clinic-owner/doctors/search?pincode=${encodeURIComponent(pincode)}`);
      return {
        success: true,
        doctors: response.data.doctors,
        total: response.data.total,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to search doctors',
        doctors: [],
        total: 0,
      };
    }
  }

  // Get all doctors for clinic owner
  async getDoctors(search = '') {
    try {
      const endpoint = search 
        ? `/clinic-owner/doctors?search=${encodeURIComponent(search)}`
        : '/clinic-owner/doctors';
      const response = await ApiService.get(endpoint);
      return {
        success: true,
        doctors: response.data.doctors,
        total: response.data.total,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get doctors',
        doctors: [],
        total: 0,
      };
    }
  }

  // Get doctor details
  async getDoctorDetails(doctorId) {
    try {
      const response = await ApiService.get(`/clinic-owner/doctors/${doctorId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get doctor details',
      };
    }
  }

  // Toggle doctor status
  async toggleDoctorStatus(doctorId, status) {
    try {
      const response = await ApiService.put(`/clinic-owner/doctors/${doctorId}/status`, { status });
      return {
        success: true,
        message: response.message,
        doctor: response.doctor,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update doctor status',
      };
    }
  }

  // Remove doctor from clinic
  async removeDoctor(doctorId) {
    try {
      // Ensure token is set before making request
      const token = await ClinicOwnerAuthService.getToken();
      if (token) {
        ApiService.setToken(token);
        console.log('Token set for removeDoctor request');
      } else {
        console.error('No token available for removeDoctor request');
        return {
          success: false,
          message: 'Authentication required. Please login again.',
        };
      }
      
      console.log('Calling removeDoctor API for doctorId:', doctorId);
      const response = await ApiService.delete(`/clinic-owner/doctors/${doctorId}`);
      console.log('Remove doctor API response:', response);
      return {
        success: true,
        message: response.message || 'Doctor removed successfully',
      };
    } catch (error) {
      console.error('Remove doctor API error:', error);
      console.error('Error response:', error?.response);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to remove doctor';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
}

export default new ClinicOwnerDoctorService();

