import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import ClinicOwnerAuthService from '../services/clinicOwnerAuthService';
import ClinicOwnerDoctorService from '../services/clinicOwnerDoctorService';

export default function ClinicOwnerDoctorsScreen() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form fields - only email needed since doctor must exist in backend
  const [email, setEmail] = useState('');

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      loadDoctors(searchQuery);
    } else {
      loadDoctors();
    }
  }, [searchQuery]);

  // Refresh doctors list when screen comes into focus (when navigating back)
  useFocusEffect(
    useCallback(() => {
      // Reload doctors when screen is focused
      if (!loading) {
        loadDoctors(searchQuery);
      }
    }, [searchQuery])
  );

  const initializeAuth = async () => {
    try {
      await ClinicOwnerAuthService.initializeAuth();
      await loadDoctors();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setLoading(false);
    }
  };

  const loadDoctors = async (search = '') => {
    try {
      setLoading(true);
      const result = await ClinicOwnerDoctorService.getDoctors(search);
      
      if (result.success) {
        setDoctors(result.doctors || []);
      } else {
        Alert.alert('Error', result.message || 'Failed to load doctors');
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      Alert.alert('Error', 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleAddDoctor = () => {
    router.push('/clinic-owner-add-doctor');
  };

  const handleCloseAddDoctor = () => {
    setShowAddDoctorModal(false);
    // Reset form
    setEmail('');
  };

  const handleSubmitDoctor = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter doctor email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    
    try {
      const result = await ClinicOwnerDoctorService.addDoctor(email);
      
      if (result.success) {
        setSubmitting(false);
        handleCloseAddDoctor();
        Alert.alert('Success', result.message || 'Doctor added successfully!');
        // Reload doctors list
        await loadDoctors();
      } else {
        setSubmitting(false);
        Alert.alert('Error', result.message || 'Failed to add doctor');
      }
    } catch (error) {
      setSubmitting(false);
      Alert.alert('Error', 'Failed to add doctor. Please try again.');
    }
  };


  const handleDoctorPress = async (doctorId: string) => {
    // Navigate to doctor details screen
    router.push(`/clinic-owner-doctor-details?id=${doctorId}`);
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '0';
    return amount.toLocaleString('en-IN');
  };

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctors</Text>
        <TouchableOpacity onPress={handleAddDoctor} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors by name, specialty, or email..."
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

      {/* Doctors List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#6B46C1" />
            <Text style={styles.emptyTitle}>Loading doctors...</Text>
          </View>
        ) : doctors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No doctors found</Text>
            <Text style={styles.emptySubtitle}>Add your first doctor to get started</Text>
          </View>
        ) : (
          doctors.map((doctor) => {
            return (
              <TouchableOpacity 
                key={doctor.id} 
                style={styles.doctorCard}
                onPress={() => handleDoctorPress(doctor.id)}
              >
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{doctor.name}</Text>
                  <Text style={styles.doctorDetails}>
                    {doctor.specialty} • {doctor.email}
                  </Text>
                  <Text style={styles.doctorStats}>
                    Patients: {doctor.patients} • Sessions: {doctor.sessions} • Revenue: ₹{formatCurrency(doctor.revenue)}
                  </Text>
                  <Text style={styles.joinDate}>
                    Joined: {formatDate(doctor.joinDate)}
                  </Text>
                  <View style={styles.actionRow}>
                    <Ionicons name="hand-left" size={16} color="#6B46C1" />
                    <Text style={styles.actionText}>Tap to view details & manage</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add Doctor Modal */}
      <Modal
        visible={showAddDoctorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseAddDoctor}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Doctor</Text>
              <TouchableOpacity onPress={handleCloseAddDoctor} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                <Text style={styles.infoText}>
                  Enter the email address of a doctor who is already registered in the system. 
                  The doctor must have an account before you can add them to your clinic.
                </Text>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Doctor Email Address *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter doctor's registered email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
                    onPress={handleSubmitDoctor}
                    disabled={submitting}
                  >
                    <Text style={styles.submitButtonText}>
                      {submitting ? 'Adding...' : 'Add Doctor'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={handleCloseAddDoctor}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/clinic-owner-dashboard')}
        >
          <Ionicons name="home" size={24} color="#6B7280" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/clinic-owner-dashboard')}
        >
          <Ionicons name="people" size={24} color="#6B7280" />
          <Text style={styles.navText}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => {}}
        >
          <Ionicons name="medical" size={24} color="#6B46C1" />
          <Text style={[styles.navText, styles.navTextActive]}>Doctors</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => router.push('/clinic-owner-profile')}
        >
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  doctorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  doctorInfo: {
    flex: 1,
    marginRight: 15,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
  },
  doctorDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  doctorStats: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 5,
  },
  joinDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#6B46C1',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 500,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  // Bottom Navigation Styles
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

