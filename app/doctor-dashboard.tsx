import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardService from '../services/dashboardService';
import AuthService from '../services/authService';

export default function DoctorDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Refresh dashboard data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if we're not in the initial loading state
      if (!loading) {
        console.log('🔄 Dashboard screen focused - reloading data...');
        // Reload with a longer delay to ensure backend has processed any recent payment changes
        const timer = setTimeout(() => {
          loadDashboardData(true); // Silent reload - no loading indicator
          loadUserData();
        }, 800); // Increased delay to ensure backend has saved payment status
        return () => clearTimeout(timer);
      }
    }, [loading])
  );

  const initializeAuth = async () => {
    try {
      await AuthService.initializeAuth();
      await loadDashboardData();
      await loadUserData();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setLoading(false);
    }
  };

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent && !loading) {
        // Only show loading on initial load, not on refresh
      }
      console.log('📡 Fetching dashboard data from backend...');
      const result = await DashboardService.getDashboard();
      
      if (result.success && result.data) {
        const oldPendingAmount = dashboardData?.pendingAmount;
        const newPendingAmount = result.data.pendingAmount;
        
        console.log('📊 Dashboard data received:', {
          oldPendingAmount: oldPendingAmount,
          newPendingAmount: newPendingAmount,
          monthlyEarnings: result.data.monthlyEarnings,
          totalPatients: result.data.totalPatients,
          change: oldPendingAmount !== undefined ? oldPendingAmount - newPendingAmount : 'N/A'
        });
        
        setDashboardData(result.data);
        
        if (oldPendingAmount !== undefined && oldPendingAmount !== newPendingAmount) {
          console.log(`✅ Dashboard pending amount updated: ₹${oldPendingAmount} → ₹${newPendingAmount}`);
        } else if (oldPendingAmount === undefined) {
          console.log(`✅ Dashboard initialized with pending amount: ₹${newPendingAmount}`);
        }
      } else {
        console.error('❌ Failed to load dashboard data:', result.message);
      }
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    }
  };

  const loadUserData = async () => {
    try {
      // First try to get user from AsyncStorage (faster and has latest data)
      const storedUser = await AuthService.getUser();
      if (storedUser) {
        setDoctor(storedUser);
        if (loading) setLoading(false);
        return;
      }
      
      // Fallback to API if no stored user
      const result = await AuthService.getCurrentDoctor();
      if (result.success) {
        setDoctor(result.doctor);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      if (loading) setLoading(false);
    }
  };

  const handleProfilePress = () => {
    router.push('/doctor-profile');
  };

  const handlePatientsPress = () => {
    router.push('/doctor-patient');
  };

  const handleIncomePress = () => {
    router.push('/doctor-income');
  };

  const handlePaymentsPress = () => {
    router.push('/doctor-payments');
  };

  const handleHomePress = () => {
    // Already on home/dashboard
    console.log('Home pressed');
  };

  // Format currency with Indian number format
  const formatCurrency = (amount: number) => {
    if (!amount) return '0';
    return amount.toLocaleString('en-IN');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6B46C1" />
      
      <ScrollView style={styles.scrollView}>
        {/* Header Section */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.doctorName}>
            {loading ? 'Loading...' : (doctor?.fullName || 'Dr. Unknown')}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {dashboardData?.totalPatients || '0'}
              </Text>
              <Text style={styles.statLabel}>Total Patients</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {dashboardData?.activeToday || '0'}
              </Text>
              <Text style={styles.statLabel}>Active Today</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                ₹{dashboardData?.pendingAmount ? formatCurrency(dashboardData.pendingAmount) : '0'}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                ₹{dashboardData?.monthlyEarnings ? formatCurrency(dashboardData.monthlyEarnings) : '0'}
              </Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard} onPress={handlePatientsPress}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="people" size={32} color="#6B46C1" />
              </View>
              <Text style={styles.quickActionText}>Patients</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard} onPress={handleIncomePress}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="wallet" size={32} color="#F59E0B" />
              </View>
              <Text style={styles.quickActionText}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard} onPress={handlePaymentsPress}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="card" size={32} color="#3B82F6" />
              </View>
              <Text style={styles.quickActionText}>Payments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard} onPress={handleProfilePress}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="person" size={32} color="#6B46C1" />
              </View>
              <Text style={styles.quickActionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.recentActivityTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity: any, index: number) => (
                <View 
                  key={`${activity.id}-${index}`} 
                  style={[
                    styles.activityItem, 
                    index === dashboardData.recentActivity.length - 1 && styles.lastActivityItem
                  ]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: `${activity.iconColor}20` }]}>
                    <Ionicons name={activity.icon as any} size={20} color={activity.iconColor} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityName}>{activity.name}</Text>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                  </View>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyActivityContainer}>
                <Ionicons name="time-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyActivityText}>No recent activity</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={handleHomePress}>
          <Ionicons name="home" size={24} color="#6B46C1" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handlePatientsPress}>
          <Ionicons name="people" size={24} color="#6B7280" />
          <Text style={styles.navText}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleIncomePress}>
          <Ionicons name="wallet" size={24} color="#6B7280" />
          <Text style={styles.navText}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handlePaymentsPress}>
          <Ionicons name="card" size={24} color="#6B7280" />
          <Text style={styles.navText}>Payments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfilePress}>
          <Ionicons name="person" size={24} color="#6B7280" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  welcomeText: {
    color: 'white',
    fontSize: 18,
    opacity: 0.9,
  },
  doctorName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statsContainer: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
  },
  quickActionsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionIcon: {
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  recentActivityContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  recentActivityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 20,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 10,
  },
  lastActivityItem: {
    borderBottomWidth: 0,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: 'rgba(107, 70, 193, 0.1)',
  },
  navText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  navTextActive: {
    color: '#6B46C1',
    fontWeight: '600',
  },
  emptyActivityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyActivityText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 10,
  },
});
