import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Modal, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import ClinicOwnerAuthService from '../services/clinicOwnerAuthService';
import ClinicOwnerDoctorService from '../services/clinicOwnerDoctorService';

export default function ClinicOwnerAddDoctorScreen() {
  const [pincode, setPincode] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addingDoctorId, setAddingDoctorId] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await ClinicOwnerAuthService.initializeAuth();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  };

  const handleSearch = async () => {
    if (!pincode || pincode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
      return;
    }

    setLoading(true);
    try {
      const result = await ClinicOwnerDoctorService.searchDoctorsByPincode(pincode);
      
      if (result.success) {
        setDoctors(result.doctors || []);
        if (result.doctors.length === 0) {
          Alert.alert('No Doctors Found', `No doctors found with pincode ${pincode}`);
        }
      } else {
        Alert.alert('Error', result.message || 'Failed to search doctors');
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error searching doctors:', error);
      Alert.alert('Error', 'Failed to search doctors. Please try again.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = (doctor: any) => {
    // Immediately mark as adding to disable button
    setAddingDoctorId(doctor.id);
    setSelectedDoctor(doctor);
    setShowAddDoctorModal(true);
  };

  const handleCloseAddDoctor = () => {
    setShowAddDoctorModal(false);
    setSelectedDoctor(null);
    // Only clear addingDoctorId if doctor wasn't successfully added
    if (selectedDoctor && !doctors.find(d => d.id === selectedDoctor.id)?.isAlreadyAdded) {
      setAddingDoctorId(null);
    }
  };

  const handleSubmitDoctor = async () => {
    if (!selectedDoctor || !selectedDoctor.email) {
      Alert.alert('Error', 'Doctor email is required.');
      return;
    }

    // Immediately update UI - mark doctor as added and disable button
    setDoctors(prev => prev.map(d => 
      d.id === selectedDoctor.id 
        ? { ...d, isAlreadyAdded: true }
        : d
    ));

    setSubmitting(true);
    
    try {
      const result = await ClinicOwnerDoctorService.addDoctor(selectedDoctor.email);
      
      if (result.success) {
        setSubmitting(false);
        setAddingDoctorId(null); // Clear adding state
        handleCloseAddDoctor();
        // Show success message briefly
        Alert.alert('Success', result.message || 'Doctor added successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Doctor is already marked as added in the list, no need to remove
            }
          }
        ]);
      } else {
        setSubmitting(false);
        setAddingDoctorId(null); // Clear adding state on error
        // Revert the UI change if adding failed
        setDoctors(prev => prev.map(d => 
          d.id === selectedDoctor.id 
            ? { ...d, isAlreadyAdded: false }
            : d
        ));
        // Show custom error popup with the message
        setErrorMessage(result.message || 'Failed to add doctor');
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setErrorMessage(null);
        }, 5000);
      }
    } catch (error) {
      setSubmitting(false);
      setAddingDoctorId(null); // Clear adding state on error
      // Revert the UI change if adding failed
      setDoctors(prev => prev.map(d => 
        d.id === selectedDoctor.id 
          ? { ...d, isAlreadyAdded: false }
          : d
      ));
      Alert.alert('Error', 'Failed to add doctor. Please try again.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Doctor</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Pincode Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="location" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter pincode to search doctors"
            placeholderTextColor="#9CA3AF"
            value={pincode}
            onChangeText={setPincode}
            keyboardType="number-pad"
            maxLength={6}
          />
          {pincode.length > 0 && (
            <TouchableOpacity onPress={() => setPincode('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.searchButton, (!pincode || pincode.length !== 6) && styles.searchButtonDisabled]} 
          onPress={handleSearch}
          disabled={!pincode || pincode.length !== 6 || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="white" />
              <Text style={styles.searchButtonText}>Search</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Doctors List */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.emptyTitle}>Searching doctors...</Text>
        </View>
      ) : doctors.length === 0 && pincode.length === 6 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="medical-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No doctors found</Text>
          <Text style={styles.emptySubtitle}>No doctors found with pincode {pincode}</Text>
        </View>
      ) : doctors.length > 0 ? (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isAlreadyAdded = item.isAlreadyAdded || false;
            const isAdding = addingDoctorId === item.id;
            const isDisabled = isAlreadyAdded || isAdding;
            return (
              <View style={styles.doctorCard}>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{item.name}</Text>
                  <Text style={styles.doctorDetails}>
                    {item.specialty}
                  </Text>
                  <View style={styles.doctorDetailsRow}>
                    <Ionicons name="call-outline" size={14} color="#6B7280" />
                    <Text style={styles.doctorDetailText}>{item.phoneNumber}</Text>
                  </View>
                  <View style={styles.doctorDetailsRow}>
                    <Ionicons name="mail-outline" size={14} color="#6B7280" />
                    <Text style={styles.doctorDetailText}>{item.email}</Text>
                  </View>
                  <View style={styles.doctorDetailsRow}>
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text style={styles.doctorDetailText}>{item.pinCode}</Text>
                  </View>
                  <View style={styles.doctorDetailsRow}>
                    <Ionicons name="key-outline" size={14} color="#6B46C1" />
                    <Text style={[styles.doctorDetailText, styles.specialIdText]}>Special ID: {item.specialId || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.rightColumn}>
                  {isAlreadyAdded && (
                    <View style={styles.addedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.addedBadgeText}>Added</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={[styles.addButton, isDisabled && styles.addButtonDisabled]}
                    onPress={() => !isDisabled && handleAddDoctor(item)}
                    disabled={isDisabled}
                  >
                    {isAdding ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={[styles.addButtonText, isDisabled && styles.addButtonTextDisabled]}>
                        {isAlreadyAdded ? 'Added' : 'Add'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.doctorsList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Search for doctors</Text>
          <Text style={styles.emptySubtitle}>Enter a pincode to find doctors in that area</Text>
        </View>
      )}

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
                  Confirm adding this doctor to your clinic. The doctor will be able to manage patients under your clinic.
                </Text>

                {selectedDoctor && (
                  <View style={styles.selectedDoctorInfo}>
                    <Text style={styles.selectedDoctorLabel}>Doctor Details:</Text>
                    <Text style={styles.selectedDoctorText}>Name: {selectedDoctor.name}</Text>
                    <Text style={styles.selectedDoctorText}>Specialty: {selectedDoctor.specialty}</Text>
                    <Text style={styles.selectedDoctorText}>Email: {selectedDoctor.email}</Text>
                    <Text style={styles.selectedDoctorText}>Phone: {selectedDoctor.phoneNumber}</Text>
                    <Text style={styles.selectedDoctorText}>Pincode: {selectedDoctor.pinCode}</Text>
                    <Text style={[styles.selectedDoctorText, styles.specialIdHighlight]}>Special ID: {selectedDoctor.specialId || 'N/A'}</Text>
                  </View>
                )}

                {/* Email (pre-filled, read-only) */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Doctor Email Address *</Text>
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={selectedDoctor?.email || ''}
                    editable={false}
                    placeholderTextColor="#9CA3AF"
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

      {/* Error Popup Modal */}
      <Modal
        visible={errorMessage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setErrorMessage(null)}
      >
        <View style={styles.errorPopupOverlay}>
          <View style={styles.errorPopupContainer}>
            <View style={styles.errorPopupHeader}>
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
              <Text style={styles.errorPopupTitle}>Cannot Add Doctor</Text>
            </View>
            <Text style={styles.errorPopupMessage}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.errorPopupButton}
              onPress={() => setErrorMessage(null)}
            >
              <Text style={styles.errorPopupButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  placeholder: {
    width: 40,
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B46C1',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  doctorsList: {
    padding: 20,
  },
  doctorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  doctorInfo: {
    flex: 1,
    marginRight: 15,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 8,
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  addedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  doctorDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  doctorDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  doctorDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  specialIdText: {
    color: '#6B46C1',
    fontWeight: '600',
  },
  specialIdHighlight: {
    color: '#6B46C1',
    fontWeight: '600',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addButtonTextDisabled: {
    color: '#9CA3AF',
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
    textAlign: 'center',
    paddingHorizontal: 40,
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
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  selectedDoctorInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDoctorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectedDoctorText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
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
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
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
  // Error Popup Styles
  errorPopupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorPopupContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  errorPopupHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  errorPopupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 12,
  },
  errorPopupMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorPopupButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  errorPopupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

