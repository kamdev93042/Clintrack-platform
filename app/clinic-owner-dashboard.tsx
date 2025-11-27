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
import ClinicOwnerAuthService from '../services/clinicOwnerAuthService';
import ClinicOwnerService from '../services/clinicOwnerService';
import ClinicOwnerPatientService from '../services/clinicOwnerPatientService';
import ClinicOwnerDoctorService from '../services/clinicOwnerDoctorService';

// Default stats (will be replaced with real data)
const defaultStats = {
  totalDoctors: 0,
  totalPatients: 0,
  totalUploads: 0,
  storageUsage: 0, // GB
  storageLimit: 100, // GB
};

const mockPatientGrowth = [
  { month: 'Jan', patients: 50 },
  { month: 'Feb', patients: 75 },
  { month: 'Mar', patients: 100 },
  { month: 'Apr', patients: 130 },
  { month: 'May', patients: 160 },
  { month: 'Jun', patients: 195 },
  { month: 'Jul', patients: 230 },
  { month: 'Aug', patients: 270 },
  { month: 'Sep', patients: 310 },
  { month: 'Oct', patients: 330 },
  { month: 'Nov', patients: 340 },
  { month: 'Dec', patients: 342 },
];

const mockUploadsTrend = [
  { month: 'Jan', uploads: 30 },
  { month: 'Feb', uploads: 50 },
  { month: 'Mar', uploads: 70 },
  { month: 'Apr', uploads: 90 },
  { month: 'May', uploads: 110 },
  { month: 'Jun', uploads: 130 },
  { month: 'Jul', uploads: 150 },
  { month: 'Aug', uploads: 170 },
  { month: 'Sep', uploads: 190 },
  { month: 'Oct', uploads: 210 },
  { month: 'Nov', uploads: 230 },
  { month: 'Dec', uploads: 250 },
];

export default function ClinicOwnerDashboardScreen() {
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
    }
  }, [activeTab, searchQuery]);

  const initializeAuth = async () => {
    try {
      await ClinicOwnerAuthService.initializeAuth();
      await loadDashboardData();
      await loadDoctors();
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
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBars}>
          {data.map((item, index) => {
            const value = item[valueKey] || item.value || 0;
            const height = Math.max((value / maxValue) * 120, 4); // Minimum height of 4 for visibility
            return (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height, backgroundColor: color }]} />
                </View>
                <Text style={styles.chartLabel}>{item.month.substring(0, 3)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Calculate max value for charts
  const maxPatients = Math.max(...mockPatientGrowth.map(d => d.patients));
  const maxUploads = Math.max(...mockUploadsTrend.map(d => d.uploads));

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
      if (activeTab === 'patients') {
        await loadPatients();
      } else if (activeTab === 'dashboard') {
        await loadDoctors();
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
      <View style={styles.header}>
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
          <BarChart data={mockPatientGrowth} maxValue={maxPatients} color="#10B981" valueKey="patients" />
        </View>
      </View>

      {/* Uploads Trend Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Uploads Trend</Text>
        <View style={styles.chartCard}>
          <BarChart data={mockUploadsTrend} maxValue={maxUploads} color="#10B981" valueKey="uploads" />
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
            <View key={doctor.id} style={styles.doctorCard}>
              <View style={styles.doctorHeader}>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{doctor.name}</Text>
                  <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
                </View>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#6B46C1" />
                  <Text style={styles.rating}>{doctor.rating.toFixed(1)}</Text>
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
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );

  const renderPatients = () => (
    <View style={styles.patientsContainer}>
      <View style={styles.searchContainer}>
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
                // Navigate to patient details if needed
                Alert.alert('Patient Details', `Name: ${item.name}\nAge: ${item.age}\nDoctor: ${item.doctor.name}\nStatus: ${item.status}`);
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
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="cloud-upload" size={24} color="#6B7280" />
          <Text style={styles.navText}>Uploads</Text>
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
    paddingTop: 20,
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
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    width: '80%',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 8,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
});
