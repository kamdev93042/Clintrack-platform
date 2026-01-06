// Subscription Service for Frontend
import apiService from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SubscriptionService {
  constructor() {
    this.baseURL = '/doctor'; // Default for doctors, can be changed for clinic owners
  }

  // Set user type (doctor or clinic-owner)
  setUserType(userType) {
    this.baseURL = userType === 'clinicOwner' ? '/clinic-owner' : '/doctor';
  }

  /**
   * Get current subscription
   */
  async getSubscription() {
    try {
      const response = await apiService.get(`${this.baseURL}/subscription`);
      return response;
    } catch (error) {
      console.error('Get subscription error:', error);
      throw error;
    }
  }

  /**
   * Get all available plans
   */
  async getPlans() {
    try {
      const response = await apiService.get(`${this.baseURL}/subscription/plans`);
      // Return response with clinicSubscriptionInfo if available
      return {
        success: response.success,
        data: response.data,
        clinicSubscriptionInfo: response.clinicSubscriptionInfo || null
      };
    } catch (error) {
      console.error('Get plans error:', error);
      throw error;
    }
  }

  /**
   * Create payment order
   * @param {String} planId - Plan ID (e.g., 'basic', 'pro')
   */
  async createPaymentOrder(planId) {
    try {
      const response = await apiService.post(`${this.baseURL}/subscription/create-order`, {
        planId: planId
      });
      return response;
    } catch (error) {
      console.error('Create payment order error:', error);
      // Return proper error message instead of throwing
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          error?.toString() || 
                          'Failed to create payment order. Please try again.';
      throw new Error(errorMessage);
    }
  }

  /**
   * Verify payment after successful payment
   * @param {String} orderId - Razorpay order ID
   * @param {String} paymentId - Razorpay payment ID
   * @param {String} signature - Razorpay signature
   * @param {String} planId - Plan ID
   */
  async verifyPayment(orderId, paymentId, signature, planId) {
    try {
      const response = await apiService.post(`${this.baseURL}/subscription/verify-payment`, {
        orderId,
        paymentId,
        signature,
        planId
      });
      return response;
    } catch (error) {
      console.error('Verify payment error:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription() {
    try {
      const response = await apiService.delete(`${this.baseURL}/subscription`);
      return response;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }
}

export default new SubscriptionService();

