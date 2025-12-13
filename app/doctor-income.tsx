import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IncomeService from '../services/incomeService';
import AuthService from '../services/authService';
import SupportContactForm from '../components/SupportContactForm';

export default function DoctorIncomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedTimeframe, setSelectedTimeframe] = useState('Last 6 Months');
  const [loading, setLoading] = useState(true);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [statistics, setStatistics] = useState({
    thisMonth: { amount: 0, change: 0 },
    projected: { amount: 0, change: 0 },
    totalEarned: { amount: 0, change: 0 },
    pending: { amount: 0, change: 0 }
  });
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  const handleBack = () => {
    router.back();
  };

  const handleHomePress = () => {
    router.push('/doctor-dashboard');
  };

  const handlePatientsPress = () => {
    router.push('/doctor-patient');
  };

  const handleIncomePress = () => {
    // Already on income screen
  };

  const handlePaymentsPress = () => {
    router.push('/doctor-payments');
  };

  const handleProfilePress = () => {
    router.push('/doctor-profile');
  };

  // Load income data on component mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await AuthService.initializeAuth();
      await loadIncomeData();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setLoading(false);
    }
  };

  const loadIncomeData = async () => {
    try {
      setLoading(true);
      const result = await IncomeService.getIncome({ limit: 10 });
      
      if (result.success && result.data) {
        // Set statistics
        if (result.data.statistics) {
          setStatistics(result.data.statistics);
        }
        
        // Set monthly earnings
        if (result.data.monthlyEarnings !== undefined) {
          setMonthlyEarnings(result.data.monthlyEarnings);
        }
        
        // Set recent sessions - ensure most recent first
        if (result.data.recentSessions) {
          // Sort by sessionDate in descending order (most recent first)
          const sortedSessions = [...result.data.recentSessions].sort((a, b) => {
            // If sessionDate timestamp exists, use it; otherwise use date string
            if (a.sessionDate && b.sessionDate) {
              return b.sessionDate - a.sessionDate;
            }
            // Fallback: try to parse date strings or keep original order
            return 0;
          });
          setRecentSessions(sortedSessions);
        }
      } else {
        console.error('Failed to load income data:', result.message);
      }
    } catch (error) {
      console.error('Error loading income data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeframeChange = async () => {
    // Handle timeframe selection - load monthly data based on timeframe
    let timeframe = 'last6months';
    if (selectedTimeframe === 'Last 6 Months') {
      timeframe = 'last6months';
    } else if (selectedTimeframe === 'Last Year') {
      timeframe = 'lastyear';
    }
    
    try {
      const result = await IncomeService.getMonthlyIncome(timeframe);
      if (result.success && result.data) {
        setMonthlyEarnings(result.data.total || 0);
      }
    } catch (error) {
      console.error('Error loading monthly income:', error);
    }
  };

  // Format currency with Indian number format
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Format percentage change
  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${Math.round(change)}%`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#6B46C1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Income</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading income data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Income Summary Cards */}
          <View style={styles.summaryContainer}>
            {/* This Month */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryAmount}>{formatCurrency(statistics.thisMonth.amount)}</Text>
              <Text style={styles.summaryLabel}>This Month</Text>
              <View style={styles.changeIndicator}>
                <Ionicons 
                  name={statistics.thisMonth.change >= 0 ? "trending-up" : "trending-down"} 
                  size={16} 
                  color={statistics.thisMonth.change >= 0 ? "#10B981" : "#EF4444"} 
                />
                <Text style={statistics.thisMonth.change >= 0 ? styles.positiveChange : styles.negativeChange}>
                  {formatChange(statistics.thisMonth.change)}
                </Text>
              </View>
            </View>

            {/* Projected */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryAmount}>{formatCurrency(statistics.projected.amount)}</Text>
              <Text style={styles.summaryLabel}>Projected</Text>
              <View style={styles.changeIndicator}>
                <Ionicons 
                  name={statistics.projected.change >= 0 ? "trending-up" : "trending-down"} 
                  size={16} 
                  color={statistics.projected.change >= 0 ? "#10B981" : "#EF4444"} 
                />
                <Text style={statistics.projected.change >= 0 ? styles.positiveChange : styles.negativeChange}>
                  {formatChange(statistics.projected.change)}
                </Text>
              </View>
            </View>

            {/* Total Earned */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryAmount}>{formatCurrency(statistics.totalEarned.amount)}</Text>
              <Text style={styles.summaryLabel}>Total Earned</Text>
              <View style={styles.changeIndicator}>
                <Ionicons 
                  name={statistics.totalEarned.change >= 0 ? "trending-up" : "trending-down"} 
                  size={16} 
                  color={statistics.totalEarned.change >= 0 ? "#10B981" : "#EF4444"} 
                />
                <Text style={statistics.totalEarned.change >= 0 ? styles.positiveChange : styles.negativeChange}>
                  {formatChange(statistics.totalEarned.change)}
                </Text>
              </View>
            </View>

            {/* Pending */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryAmount}>{formatCurrency(statistics.pending.amount)}</Text>
              <Text style={styles.summaryLabel}>Pending</Text>
              <View style={styles.changeIndicator}>
                <Ionicons 
                  name={statistics.pending.change >= 0 ? "trending-up" : "trending-down"} 
                  size={16} 
                  color={statistics.pending.change >= 0 ? "#10B981" : "#EF4444"} 
                />
                <Text style={statistics.pending.change >= 0 ? styles.positiveChange : styles.negativeChange}>
                  {formatChange(statistics.pending.change)}
                </Text>
              </View>
            </View>
          </View>

          {/* Monthly Earnings Section */}
          <View style={styles.monthlyEarningsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Monthly Earnings</Text>
            </View>
            
            <View style={styles.earningsCard}>
              <Text style={styles.earningsAmount}>{formatCurrency(monthlyEarnings)}</Text>
            </View>
          </View>

          {/* Recent Sessions Section */}
          <View style={styles.recentSessionsSection}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            
            {recentSessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No recent sessions</Text>
              </View>
            ) : (
              recentSessions.map((session) => (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionIcon}>
                    <Ionicons name={session.icon || 'trophy'} size={20} color={session.iconColor || '#F59E0B'} />
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.patientName}>{session.patientName}</Text>
                    <Text style={styles.sessionType}>{session.sessionType} • {session.fee}</Text>
                  </View>
                  <Text style={styles.sessionDate}>{session.date}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={handleHomePress}>
          <Ionicons name="home" size={24} color="#6B7280" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handlePatientsPress}>
          <Ionicons name="people" size={24} color="#6B7280" />
          <Text style={styles.navText}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={handleIncomePress}>
          <Ionicons name="wallet" size={24} color="#3B82F6" />
          <Text style={[styles.navText, styles.navTextActive]}>Income</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
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
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positiveChange: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  negativeChange: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 4,
  },
  monthlyEarningsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  timeframeButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeframeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  earningsCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  recentSessionsSection: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sessionType: {
    fontSize: 14,
    color: '#6B7280',
  },
  sessionDate: {
    fontSize: 14,
    color: '#9CA3AF',
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
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  navText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  navTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 10,
  },
  supportButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 1000,
  },
});
