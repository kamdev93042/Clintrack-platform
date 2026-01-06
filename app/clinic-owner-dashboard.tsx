import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ClinicOwnerAuthService from '../services/clinicOwnerAuthService';
import ClinicOwnerService from '../services/clinicOwnerService';
import ClinicOwnerPatientService from '../services/clinicOwnerPatientService';
import ClinicOwnerDoctorService from '../services/clinicOwnerDoctorService';
import SupportContactForm from '../components/SupportContactForm';

// Default stats (will be replaced with real data)
const defaultStats = {
  totalDoctors: 0,
  totalPatients: 0,
  totalUploads: 0,
  storageUsage: 0, // GB
  storageLimit: 100, // GB
};

// Default empty trends data
const defaultPatientGrowth = [
  { month: 'Jan', patients: 0 },
  { month: 'Feb', patients: 0 },
  { month: 'Mar', patients: 0 },
  { month: 'Apr', patients: 0 },
  { month: 'May', patients: 0 },
  { month: 'Jun', patients: 0 },
  { month: 'Jul', patients: 0 },
  { month: 'Aug', patients: 0 },
  { month: 'Sep', patients: 0 },
  { month: 'Oct', patients: 0 },
  { month: 'Nov', patients: 0 },
  { month: 'Dec', patients: 0 },
];

const defaultUploadsTrend = [
  { month: 'Jan', uploads: 0 },
  { month: 'Feb', uploads: 0 },
  { month: 'Mar', uploads: 0 },
  { month: 'Apr', uploads: 0 },
  { month: 'May', uploads: 0 },
  { month: 'Jun', uploads: 0 },
  { month: 'Jul', uploads: 0 },
  { month: 'Aug', uploads: 0 },
  { month: 'Sep', uploads: 0 },
  { month: 'Oct', uploads: 0 },
  { month: 'Nov', uploads: 0 },
  { month: 'Dec', uploads: 0 },
];

export default function ClinicOwnerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [clinicName, setClinicName] = useState('City Health Clinic');
  const [ownerName, setOwnerName] = useState('Clinic Owner');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(defaultStats);
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsPage, setPatientsPage] = useState(1);
  const [patientsTotalPages, setPatientsTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [patientGrowth, setPatientGrowth] = useState(defaultPatientGrowth);
  const [uploadsTrend, setUploadsTrend] = useState(defaultUploadsTrend);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (activeTab === 'patients') {
      loadPatients();
    } else if (activeTab === 'dashboard') {
      // Reload dashboard data when switching back to dashboard tab
      loadDashboardData();
      loadDoctors();
      loadTrends();
    }
  }, [activeTab, searchQuery]);

  const initializeAuth = async () => {
    try {
      await ClinicOwnerAuthService.initializeAuth();
      await loadDashboardData();
      await loadDoctors();
      await loadTrends();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');
      const result = await ClinicOwnerService.getDashboard();
      console.log('Dashboard API result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        setClinicName(result.data.clinicName || 'City Health Clinic');
        setOwnerName(result.data.ownerName || 'Clinic Owner');
        
        // Update stats with real data
        if (result.data.statistics) {
          console.log('Setting stats:', result.data.statistics);
          const newStats = {
            totalDoctors: Number(result.data.statistics.totalDoctors) || 0,
            totalPatients: Number(result.data.statistics.totalPatients) || 0,
            totalUploads: Number(result.data.statistics.totalUploads) || 0,
            storageUsage: Number(result.data.statistics.storageUsage) || 0,
            storageLimit: Number(result.data.statistics.storageLimit) || 100,
          };
          console.log('Setting stats state:', newStats);
          setStats(newStats);
        } else {
          console.warn('No statistics in response:', result.data);
          console.warn('Full result object:', result);
        }
      } else {
        console.warn('Dashboard API call failed or no data:', result);
        // Try to get from stored user
        const storedUser = await ClinicOwnerAuthService.getUser();
        if (storedUser) {
          setClinicName(storedUser.clinicName || 'City Health Clinic');
          setOwnerName(storedUser.ownerName || 'Clinic Owner');
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Try to get from stored user
      const storedUser = await ClinicOwnerAuthService.getUser();
      if (storedUser) {
        setClinicName(storedUser.clinicName || 'City Health Clinic');
        setOwnerName(storedUser.ownerName || 'Clinic Owner');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      setDoctorsLoading(true);
      const result = await ClinicOwnerDoctorService.getDoctors('');
      if (result.success && result.doctors) {
        // Map API response to match UI format
        const mappedDoctors = result.doctors.map((doctor: any) => ({
          id: doctor.id || doctor._id,
          name: doctor.name || doctor.fullName || 'Unknown Doctor',
          specialty: doctor.specialty || 'General',
          patients: doctor.patients || doctor.totalPatients || 0,
          sessions: doctor.sessions || doctor.totalSessions || 0,
          revenue: doctor.revenue || doctor.totalRevenue || 0,
          rating: doctor.rating || 0,
          status: doctor.status || (doctor.isActive ? 'active' : 'inactive'),
        }));
        setDoctors(mappedDoctors);
      } else {
        console.error('Failed to load doctors:', result.message);
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const loadTrends = async () => {
    try {
      setTrendsLoading(true);
      const result = await ClinicOwnerService.getTrends();
      if (result.success && result.data) {
        // Update patient growth data - ensure it's always an array
        if (result.data.patientGrowth && Array.isArray(result.data.patientGrowth) && result.data.patientGrowth.length > 0) {
          setPatientGrowth(result.data.patientGrowth);
        } else {
          // Keep default if no data
          setPatientGrowth(defaultPatientGrowth);
        }
        // Update uploads trend data - ensure it's always an array
        if (result.data.uploadsTrend && Array.isArray(result.data.uploadsTrend) && result.data.uploadsTrend.length > 0) {
          setUploadsTrend(result.data.uploadsTrend);
        } else {
          // Keep default if no data
          setUploadsTrend(defaultUploadsTrend);
        }
      } else {
        console.error('Failed to load trends:', result.message);
        // Set defaults on error
        setPatientGrowth(defaultPatientGrowth);
        setUploadsTrend(defaultUploadsTrend);
      }
    } catch (error) {
      console.error('Error loading trends:', error);
      // Set defaults on error
      setPatientGrowth(defaultPatientGrowth);
      setUploadsTrend(defaultUploadsTrend);
    } finally {
      setTrendsLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      setPatientsLoading(true);
      const result = await ClinicOwnerPatientService.getPatients(
        searchQuery,
        '',
        patientsPage,
        50
      );
      
      if (result.success) {
        setPatients(result.patients || []);
        setPatientsTotalPages(result.totalPages || 1);
      } else {
        console.error('Failed to load patients:', result.message);
        setPatients([]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleDoctorsPress = () => {
    setActiveTab('dashboard');
  };

  const handlePatientsPress = () => {
    setActiveTab('patients');
  };

  const handleHomePress = () => {
    setActiveTab('dashboard');
  };

  const handleProfilePress = () => {
    router.push('/clinic-owner-profile');
  };

  // Simple bar chart component
  const BarChart = ({ data, maxValue, color, valueKey }: { data: any[], maxValue: number, color: string, valueKey: string }) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartLoadingText}>No data available</Text>
        </View>
      );
    }

    const safeMaxValue = maxValue > 0 ? maxValue : 1;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBars}>
          {data.map((item, index) => {
            if (!item) return null;
            const value = item[valueKey] || item.value || 0;
            const height = Math.max((value / safeMaxValue) * 120, 4); // Minimum height of 4 for visibility
            const monthLabel = item.month ? (item.month.substring ? item.month.substring(0, 3) : item.month) : '';
            return (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barColumn}>
                  <View style={styles.barContainer}>
                    {/* Count value positioned at the top of each bar dynamically */}
                    <Text style={[styles.barValue, { bottom: height + 4 }]}>{value}</Text>
                    <View style={[styles.bar, { height, backgroundColor: color }]} />
                  </View>
                </View>
                <Text style={styles.chartLabel}>{monthLabel}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Calculate max value for charts with safety checks
  const calculateMaxValue = (data: any[], key: string): number => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return 1;
    }
    try {
      const values = data
        .filter(d => d && typeof d === 'object')
        .map(d => {
          const value = d[key];
          return typeof value === 'number' && !isNaN(value) ? value : 0;
        });
      return values.length > 0 ? Math.max(...values, 1) : 1;
    } catch (error) {
      console.error('Error calculating max value:', error);
      return 1;
    }
  };

  const maxPatients = calculateMaxValue(patientGrowth, 'patients');
  const maxUploads = calculateMaxValue(uploadsTrend, 'uploads');

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
      if (activeTab === 'patients') {
        await loadPatients();
      } else if (activeTab === 'dashboard') {
        await loadDoctors();
        await loadTrends();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const renderDashboard = () => (
    <ScrollView 
      style={styles.scrollView} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.clinicName}>{loading ? 'Loading...' : clinicName}</Text>
        <Text style={styles.ownerName}>{loading ? 'Loading...' : ownerName}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{loading ? '...' : stats.totalDoctors}</Text>
            <Text style={styles.statLabel}>Total Doctors</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{loading ? '...' : stats.totalPatients}</Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{loading ? '...' : stats.totalUploads}</Text>
            <Text style={styles.statLabel}>Total Uploads</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {loading ? '...' : (typeof stats.storageUsage === 'number' ? stats.storageUsage.toFixed(1) : '0.0')} GB
            </Text>
            <Text style={styles.statLabel}>Storage Used</Text>
            <Text style={styles.storageSubtext}>
              {loading ? '...' : `${typeof stats.storageUsage === 'number' ? stats.storageUsage.toFixed(1) : '0.0'} / ${stats.storageLimit} GB`}
            </Text>
          </View>
        </View>
      </View>

      {/* Patient Growth Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Patient Growth Trend</Text>
        <View style={styles.chartCard}>
          {trendsLoading ? (
            <View style={styles.chartLoadingContainer}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={styles.chartLoadingText}>Loading trend data...</Text>
            </View>
          ) : (
            <BarChart data={patientGrowth} maxValue={maxPatients} color="#10B981" valueKey="patients" />
          )}
        </View>
      </View>

      {/* Uploads Trend Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Uploads Trend</Text>
        <View style={styles.chartCard}>
          {trendsLoading ? (
            <View style={styles.chartLoadingContainer}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={styles.chartLoadingText}>Loading trend data...</Text>
            </View>
          ) : (
            <BarChart data={uploadsTrend} maxValue={maxUploads} color="#10B981" valueKey="uploads" />
          )}
        </View>
      </View>

      {/* Doctors Performance */}
      <View style={styles.doctorsSection}>
        <Text style={styles.sectionTitle}>Doctors Performance</Text>
        {doctorsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B46C1" />
            <Text style={styles.loadingText}>Loading doctors...</Text>
          </View>
        ) : doctors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No doctors found</Text>
            <Text style={styles.emptySubtext}>Add doctors to your clinic to see their performance here.</Text>
          </View>
        ) : (
          doctors.map((doctor) => (
            <TouchableOpacity 
              key={doctor.id} 
              style={styles.doctorCard}
              onPress={() => {
                // Navigate to doctor details screen
                router.push(`/clinic-owner-doctor-details?id=${doctor.id}`);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.doctorHeader}>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{doctor.name}</Text>
                  <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                </View>
                <View style={styles.doctorHeaderRight}>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#6B46C1" />
                    <Text style={styles.rating}>{doctor.rating.toFixed(1)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.chevronIcon} />
                </View>
              </View>
              <View style={styles.doctorStats}>
                <View style={styles.doctorStatItem}>
                  <Text style={styles.doctorStatValue}>{doctor.patients}</Text>
                  <Text style={styles.doctorStatLabel}>Patients</Text>
                </View>
                <View style={styles.doctorStatItem}>
                  <Text style={styles.doctorStatValue}>{doctor.sessions}</Text>
                  <Text style={styles.doctorStatLabel}>Sessions</Text>
                </View>
                <View style={styles.doctorStatItem}>
                  <Text style={styles.doctorStatValue}>
                    ₹{doctor.revenue >= 1000 ? `${(doctor.revenue / 1000).toFixed(0)}k` : doctor.revenue.toFixed(0)}
                  </Text>
                  <Text style={styles.doctorStatLabel}>Revenue</Text>
                </View>
              </View>
              <View style={styles.tapToViewContainer}>
                <Ionicons name="eye-outline" size={16} color="#6B46C1" />
                <Text style={styles.tapToViewText}>Tap to view details</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

    </ScrollView>
  );

  const renderPatients = () => (
    <View style={styles.patientsContainer}>
      <View style={[styles.searchContainer, { marginTop: insets.top + 10 }]}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients by name, phone, email, or condition..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {patientsLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.emptyText}>Loading patients...</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.patientCard}
              onPress={() => {
                // Navigate to patient profile screen
                router.push(`/clinic-owner-patient-profile?id=${item.id}`);
              }}
            >
              <View style={styles.patientHeader}>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{item.name}</Text>
                  <Text style={styles.patientDetails}>
                    Age: {item.age} • {item.doctor.name} ({item.doctor.specialty})
                  </Text>
                  <Text style={styles.patientCondition}>{item.medicalCondition}</Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: item.status === 'active' ? '#10B981' : 
                                     item.status === 'inactive' ? '#F59E0B' : '#6B7280' 
                  }
                ]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.patientFooter}>
                <View style={styles.footerItem}>
                  <Ionicons name="calendar" size={14} color="#6B46C1" />
                  <Text style={styles.lastVisit}>
                    Last Visit: {formatDate(item.lastSessionDate)}
                  </Text>
                </View>
                <View style={styles.footerItem}>
                  <Ionicons name="medical" size={14} color="#6B46C1" />
                  <Text style={styles.lastVisit}>
                    Sessions: {item.totalSessions}
                  </Text>
                </View>
              </View>
              <View style={styles.tapToViewContainer}>
                <Ionicons name="eye-outline" size={16} color="#6B46C1" />
                <Text style={styles.tapToViewText}>Tap to view</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.patientsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No patients found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'Patients from your clinic doctors will appear here'}
              </Text>
            </View>
          }
          onEndReached={() => {
            if (patientsPage < patientsTotalPages && !patientsLoading) {
              setPatientsPage(prev => prev + 1);
            }
          }}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6B46C1" />

      {/* Content */}
      {activeTab === 'dashboard' ? renderDashboard() : renderPatients()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'dashboard' && styles.navItemActive]}
          onPress={handleHomePress}
        >
          <Ionicons name="home" size={24} color={activeTab === 'dashboard' ? '#6B46C1' : '#6B7280'} />
          <Text style={[styles.navText, activeTab === 'dashboard' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'patients' && styles.navItemActive]}
          onPress={handlePatientsPress}
        >
          <Ionicons name="people" size={24} color={activeTab === 'patients' ? '#6B46C1' : '#6B7280'} />
          <Text style={[styles.navText, activeTab === 'patients' && styles.navTextActive]}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/clinic-owner-doctors')}>
          <Ionicons name="medical" size={24} color="#6B7280" />
          <Text style={styles.navText}>Doctors</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfilePress}>
          <Ionicons name="person" size={24} color="#6B7280" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Support Button */}
      <TouchableOpacity
        style={styles.supportButton}
        onPress={() => setSupportModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
      </TouchableOpacity>

      {/* Support Contact Form Modal */}
      <SupportContactForm
        visible={supportModalVisible}
        onClose={() => setSupportModalVisible(false)}
      />
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
  clinicName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 8,
  },
  ownerName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.9,
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
  storageSubtext: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
  },
  chartSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartContainer: {
    marginTop: 8,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 140,
    width: '100%',
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    width: '80%',
    alignItems: 'center',
    position: 'relative',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    position: 'absolute',
    width: '100%',
  },
  chartLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 8,
  },
  chartLoadingContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLoadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  doctorsSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  doctorCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  doctorHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chevronIcon: {
    marginLeft: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  doctorStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  doctorStatItem: {
    alignItems: 'center',
  },
  doctorStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  doctorStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  patientsContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  patientsList: {
    padding: 16,
    paddingTop: 0,
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  patientDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  patientCondition: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  patientFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  lastVisit: {
    fontSize: 14,
    color: '#6B7280',
  },
  tapToViewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 6,
  },
  tapToViewText: {
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
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
