import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationService from '../services/notificationService';
import AuthService from '../services/authService';
import ClinicOwnerAuthService from '../services/clinicOwnerAuthService';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState<'doctor' | 'clinicOwner'>('doctor');

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Determine user type
      const doctorUser = await AuthService.getUser();
      const clinicOwnerUser = await ClinicOwnerAuthService.getUser();
      
      if (clinicOwnerUser) {
        setUserType('clinicOwner');
        NotificationService.setUserType('clinicOwner');
      } else {
        setUserType('doctor');
        NotificationService.setUserType('doctor');
      }

      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to initialize:', error);
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await NotificationService.getNotifications();
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error: any) {
      console.error('Load notifications error:', error);
      if (error.response?.status !== 404) {
        Alert.alert('Error', error.message || 'Failed to load notifications');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await NotificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Load unread count error:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    await loadUnreadCount();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await NotificationService.markAsRead(notificationId);
      if (response.success) {
        // Update local state
        setNotifications(notifications.map(notif =>
          notif._id === notificationId
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await NotificationService.markAllAsRead();
      if (response.success) {
        // Update local state
        setNotifications(notifications.map(notif => ({
          ...notif,
          isRead: true,
          readAt: new Date()
        })));
        setUnreadCount(0);
        Alert.alert('Success', 'All notifications marked as read');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await NotificationService.deleteNotification(notificationId);
              if (response.success) {
                setNotifications(notifications.filter(notif => notif._id !== notificationId));
                // Update unread count if it was unread
                const deletedNotif = notifications.find(n => n._id === notificationId);
                if (deletedNotif && !deletedNotif.isRead) {
                  setUnreadCount(Math.max(0, unreadCount - 1));
                }
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = (notification: any) => {
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      if (notification.actionUrl === '/subscription') {
        router.push(userType === 'doctor' ? '/subscription' : '/clinic-owner-subscription');
      } else {
        router.push(notification.actionUrl as any);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'subscription_expiry':
        return 'time-outline';
      case 'subscription_activated':
        return 'checkmark-circle';
      case 'payment_failed':
        return 'close-circle';
      case 'payment_due':
        return 'card';
      default:
        return 'notifications';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>You're all caught up!</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification._id}
              style={[
                styles.notificationCard,
                !notification.isRead && styles.unreadCard
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={getTypeIcon(notification.type)}
                      size={24}
                      color={getPriorityColor(notification.priority)}
                    />
                    {!notification.isRead && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationTime}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.notificationActions}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(notification._id);
                      }}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                {notification.priority === 'urgent' && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>Urgent</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center'
  },
  markAllButton: {
    padding: 8
  },
  markAllText: {
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '600'
  },
  content: {
    flex: 1,
    padding: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8
  },
  notificationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  unreadCard: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6'
  },
  notificationContent: {
    flex: 1
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  iconContainer: {
    marginRight: 12,
    position: 'relative'
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6'
  },
  notificationInfo: {
    flex: 1
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280'
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  deleteButton: {
    padding: 4
  },
  notificationMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginTop: 8
  },
  urgentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444'
  }
});


