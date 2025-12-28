// Notification Service for Frontend
import apiService from './api';

class NotificationService {
  constructor() {
    this.baseURL = '/doctor'; // Default for doctors, can be changed for clinic owners
  }

  // Set user type (doctor or clinic-owner)
  setUserType(userType) {
    this.baseURL = userType === 'clinicOwner' ? '/clinic-owner' : '/doctor';
  }

  /**
   * Get all notifications
   * @param {Object} options - Query options (unread, limit, page)
   */
  async getNotifications(options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.unread) queryParams.append('unread', 'true');
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.page) queryParams.append('page', options.page);

      const queryString = queryParams.toString();
      const endpoint = `${this.baseURL}/notifications${queryString ? '?' + queryString : ''}`;
      
      const response = await apiService.get(endpoint);
      return response;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount() {
    try {
      const response = await apiService.get(`${this.baseURL}/notifications/unread-count`);
      return response;
    } catch (error) {
      console.error('Get unread count error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {String} notificationId - Notification ID
   */
  async markAsRead(notificationId) {
    try {
      const response = await apiService.put(`${this.baseURL}/notifications/${notificationId}`);
      return response;
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await apiService.put(`${this.baseURL}/notifications/read-all`);
      return response;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {String} notificationId - Notification ID
   */
  async deleteNotification(notificationId) {
    try {
      const response = await apiService.delete(`${this.baseURL}/notifications/${notificationId}`);
      return response;
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  }
}

export default new NotificationService();


