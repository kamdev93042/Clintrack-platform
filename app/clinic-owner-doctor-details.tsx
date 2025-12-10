import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ClinicOwnerAuthService from '../services/clinicOwnerAuthService';
import ClinicOwnerDoctorService from '../services/clinicOwnerDoctorService';

export default function ClinicOwnerDoctorDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [doctor, setDoctor] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Ensure id is a string (useLocalSearchParams can return array)
  const doctorId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (doctorId) {
      initializeAuth();
    }
  }, [doctorId]);

  const initializeAuth = async () => {
    try {
      const initialized = await ClinicOwnerAuthService.initializeAuth();
      if (!initialized) {
        console.error('Failed to initialize clinic owner auth');
        Alert.alert('Error', 'Authentication failed. Please login again.');
        router.back();
        return;
      }
      await loadDoctorDetails();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setLoading(false);
    }
  };

  const loadDoctorDetails = async () => {
    if (!doctorId) return;
    
    try {
      setLoading(true);
      const result = await ClinicOwnerDoctorService.getDoctorDetails(doctorId);
      
      if (result.success && result.data) {
        setDoctor(result.data.doctor);
        setStatistics(result.data.statistics);
        setRecentPatients(result.data.recentPatients || []);
      } else {
        Alert.alert('Error', result.message || 'Failed to load doctor details');
        router.back();
      }
    } catch (error) {
      console.error('Error loading doctor details:', error);
      Alert.alert('Error', 'Failed to load doctor details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleToggleStatus = async () => {
    if (!doctor || !doctorId) return;
    
    try {
      const newStatus = doctor.isActive ? 'inactive' : 'active';
      const result = await ClinicOwnerDoctorService.toggleDoctorStatus(doctorId, newStatus);
      
      if (result.success) {
        // Update local state
        setDoctor({ ...doctor, isActive: !doctor.isActive });
        Alert.alert('Success', `Doctor status updated to ${newStatus}`);
      } else {
        Alert.alert('Error', result.message || 'Failed to update doctor status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update doctor status. Please try again.');
    }
  };

  const handleRemoveDoctor = () => {
    if (!doctor || !doctorId) return;
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!doctor || !doctorId) return;
    
    try {
      setRemoving(true);
      const result = await ClinicOwnerDoctorService.removeDoctor(doctorId);
      
      if (result.success) {
        setRemoving(false);
        setShowRemoveModal(false);
        // Show success modal
        setShowSuccessModal(true);
        // Navigate to doctors list after 2 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          router.push('/clinic-owner-doctors');
        }, 2000);
      } else {
        setRemoving(false);
        Alert.alert('Error', result.message || 'Failed to remove doctor');
      }
    } catch (error) {
      setRemoving(false);
      Alert.alert('Error', 'Failed to remove doctor. Please try again.');
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveModal(false);
  };


  const formatCurrency = (amount: number) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading doctor details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Doctor not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Doctor Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="medical" size={40} color="white" />
            </View>
            <View style={[styles.statusBadge, doctor.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
              <View style={[styles.statusDot, doctor.isActive ? styles.statusDotActive : styles.statusDotInactive]} />
              <Text style={styles.statusText}>{doctor.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
          
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.specialty}>{doctor.specialty}</Text>
          
          {doctor.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={24} color="#6B46C1" />
              <Text style={styles.statNumber}>{statistics?.totalPatients || 0}</Text>
              <Text style={styles.statLabel}>Total Patients</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.statNumber}>{statistics?.activePatients || 0}</Text>
              <Text style={styles.statLabel}>Active Patients</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>{statistics?.totalSessions || 0}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="wallet" size={24} color="#EF4444" />
              <Text style={styles.statNumber}>{formatCurrency(statistics?.revenue || 0)}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>
          </View>
        </View>

        {/* Doctor Information Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Doctor Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{doctor.name}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{doctor.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{doctor.phoneNumber}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="medical-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Specialty</Text>
              <Text style={styles.infoValue}>{doctor.specialty}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>PIN Code</Text>
              <Text style={styles.infoValue}>{doctor.pinCode}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Joined Date</Text>
              <Text style={styles.infoValue}>{formatDate(doctor.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Recent Patients Card */}
        {recentPatients && recentPatients.length > 0 && (
          <View style={styles.patientsCard}>
            <Text style={styles.cardTitle}>Recent Patients</Text>
            {recentPatients.map((patient, index) => (
              <View key={index} style={styles.patientItem}>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientDetails}>
                    Age: {patient.age} • {patient.medicalCondition}
                  </Text>
                  <Text style={styles.patientStats}>
                    Sessions: {patient.totalSessions || 0} • Paid: {formatCurrency(patient.totalAmountPaid || 0)}
                  </Text>
                </View>
                <View style={[
                  styles.patientStatusBadge,
                  patient.status === 'active' ? styles.patientStatusActive : 
                  patient.status === 'inactive' ? styles.patientStatusInactive : 
                  styles.patientStatusDischarged
                ]}>
                  <Text style={styles.patientStatusText}>{patient.status || 'N/A'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          <TouchableOpacity 
            style={[styles.actionButton, doctor.isActive ? styles.actionButtonInactive : styles.actionButtonActive]}
            onPress={handleToggleStatus}
          >
            <Ionicons 
              name={doctor.isActive ? "pause-circle" : "play-circle"} 
              size={20} 
              color="white" 
            />
            <Text style={styles.actionButtonText}>
              {doctor.isActive ? 'Deactivate Doctor' : 'Activate Doctor'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonRemove]}
            onPress={handleRemoveDoctor}
          >
            <Ionicons 
              name="trash-outline" 
              size={20} 
              color="white" 
            />
            <Text style={styles.actionButtonText}>
              Remove Doctor
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Remove Doctor Confirmation Modal */}
      <Modal
        visible={showRemoveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelRemove}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={32} color="#EF4444" />
              <Text style={styles.modalTitle}>Remove Doctor</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Are you sure you want to remove {doctor?.name} from your clinic?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={handleCancelRemove}
                disabled={removing}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton, removing && styles.modalButtonDisabled]}
                onPress={handleConfirmRemove}
                disabled={removing}
              >
                {removing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Message */}
      {showSuccessModal && (
        <View style={styles.loaderOverlay}>
          <View style={styles.successMessageContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.successMessageText}>
              Successfully removed doctor
            </Text>
          </View>
        </View>
      )}
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
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  statusBadgeActive: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusDotInactive: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
    textAlign: 'center',
  },
  specialty: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 12,
    marginBottom: 4,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 2,
  },
  patientsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  patientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  patientInfo: {
    flex: 1,
    marginRight: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  patientStats: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  patientStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  patientStatusActive: {
    backgroundColor: '#D1FAE5',
  },
  patientStatusInactive: {
    backgroundColor: '#FEF3C7',
  },
  patientStatusDischarged: {
    backgroundColor: '#FEE2E2',
  },
  patientStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonActive: {
    backgroundColor: '#10B981',
  },
  actionButtonInactive: {
    backgroundColor: '#F59E0B',
  },
  actionButtonRemove: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
  },
  modalConfirmButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalCancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Success Message Styles (matching login success style)
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successMessageText: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
});

