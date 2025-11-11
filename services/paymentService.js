import ApiService from './api';

class PaymentService {
  // Get comprehensive payments data (all in one) - recommended
  async getPayments() {
    try {
      const response = await ApiService.get('/payments');
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get payments data',
      };
    }
  }

  // Get payment statistics only
  async getPaymentStatistics() {
    try {
      const response = await ApiService.get('/payments/statistics');
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get payment statistics',
      };
    }
  }

  // Get pending payments list
  async getPendingPayments() {
    try {
      const response = await ApiService.get('/payments/pending');
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get pending payments',
      };
    }
  }

  // Mark payment as paid
  async markPaymentAsPaid(patientId, amount) {
    try {
      const payload = amount !== undefined && amount !== null ? { amount } : {};
      console.log('PaymentService: Marking payment as paid for patient:', patientId, 'payload:', payload);
      console.log('PaymentService: Full payload:', JSON.stringify(payload, null, 2));
      
      const response = await ApiService.post(`/payments/mark-paid/${patientId}`, payload);
      console.log('PaymentService: API response received:', JSON.stringify(response, null, 2));
      console.log('PaymentService: Response type:', typeof response);
      console.log('PaymentService: Response.success:', response?.success);
      
      // Check if response has success field explicitly
      if (response && response.success === true) {
        console.log('PaymentService: ✅ Success response detected');
        return {
          success: true,
          message: response.message || 'Payment marked as paid successfully',
          data: response.data || response,
        };
      } else {
        console.log('PaymentService: ❌ Failed response or success !== true');
        console.log('PaymentService: Response object:', response);
        return {
          success: false,
          message: response?.message || 'Failed to mark payment as paid',
          data: response,
        };
      }
    } catch (error) {
      console.error('PaymentService: ❌ Exception caught:', error);
      console.error('PaymentService: Error response:', error?.response);
      console.error('PaymentService: Error message:', error?.message);
      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Failed to mark payment as paid',
        error: error,
      };
    }
  }

  // Send payment reminder
  async sendPaymentReminder(patientId) {
    try {
      const response = await ApiService.post(`/payments/send-reminder/${patientId}`);
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to send payment reminder',
      };
    }
  }

  // Get payment history for a patient
  async getPaymentHistory(patientId) {
    try {
      const response = await ApiService.get(`/payments/history/${patientId}`);
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get payment history',
      };
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(startDate, endDate) {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const endpoint = `/payments/analytics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await ApiService.get(endpoint);
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get payment analytics',
      };
    }
  }

  // Update payment status (individual payment)
  async updatePaymentStatus(paymentId, status, notes) {
    try {
      const payload = {};
      if (status) payload.status = status;
      if (notes !== undefined) payload.notes = notes;

      const response = await ApiService.put(`/payments/${paymentId}/status`, payload);
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update payment status',
      };
    }
  }

  // Send reminder for specific payment
  async sendPaymentReminderById(paymentId) {
    try {
      const response = await ApiService.post(`/payments/${paymentId}/reminder`);
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to send payment reminder',
      };
    }
  }
}

export default new PaymentService();

