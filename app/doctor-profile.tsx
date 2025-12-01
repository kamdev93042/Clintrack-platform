import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthService from '../services/authService';
import ProfileService from '../services/profileService';

export default function DoctorProfileScreen() {
  const insets = useSafeAreaInsets();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);

  // Load profile data on component mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await AuthService.initializeAuth();
      await loadProfile();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setProfileLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      // Always fetch from API to get latest data including specialId
      const result = await ProfileService.getProfile();
      if (result.success) {
        setDoctor(result.doctor);
        setEditName(result.doctor.fullName || '');
        setEditEmail(result.doctor.email || '');
        setEditPhone(result.doctor.phoneNumber || '');
        setEditSpecialty(result.doctor.specialty || '');
        
        // Update stored user data with latest info including specialId
        await AuthService.saveUser(result.doctor);
      } else {
        // Fallback to stored user if API fails
        const storedUser = await AuthService.getUser();
        if (storedUser) {
          setDoctor(storedUser);
          setEditName(storedUser.fullName || '');
          setEditEmail(storedUser.email || '');
          setEditPhone(storedUser.phoneNumber || '');
          setEditSpecialty(storedUser.specialty || '');
        } else {
          Alert.alert('Error', result.message);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to stored user on error
      const storedUser = await AuthService.getUser();
      if (storedUser) {
        setDoctor(storedUser);
        setEditName(storedUser.fullName || '');
        setEditEmail(storedUser.email || '');
        setEditPhone(storedUser.phoneNumber || '');
        setEditSpecialty(storedUser.specialty || '');
      } else {
        Alert.alert('Error', 'Failed to load profile');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      router.push('/');
    } catch (error) {
      // Even if logout fails, navigate to home
      router.push('/');
    }
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  const handleSaveProfile = async () => {
    if (!editName || !editEmail || !editPhone || !editSpecialty) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Update profile
      const profileData = {
        fullName: editName,
        phoneNumber: editPhone,
        specialty: editSpecialty,
      };

      const profileResult = await ProfileService.updateProfile(profileData);
      
      if (!profileResult.success) {
        Alert.alert('Error', profileResult.message);
        return;
      }

      // Update password if provided
      if (currentPassword && newPassword) {
        const passwordResult = await AuthService.changePassword(currentPassword, newPassword);
        
        if (!passwordResult.success) {
          Alert.alert('Error', passwordResult.message);
          return;
        }
      }

      // Update local state
      setDoctor(profileResult.doctor);
      
      // Save updated doctor data to AsyncStorage so other screens can access it
      await AuthService.saveUser(profileResult.doctor);
      
      setShowEditModal(false);
      setCurrentPassword('');
      setNewPassword('');
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={60} color="white" />
            </View>
          </View>

          {/* Name and Specialty */}
          <Text style={styles.doctorName}>
            {profileLoading ? 'Loading...' : (doctor?.fullName || 'Dr. Unknown')}
          </Text>
          <Text style={styles.specialty}>
            {profileLoading ? 'Loading...' : (doctor?.specialty || 'Specialty not set')}
          </Text>

          {/* Information Fields */}
          <View style={styles.fieldsContainer}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View style={styles.fieldValue}>
                <Text style={styles.fieldText}>
                  {profileLoading ? 'Loading...' : (doctor?.fullName || 'Not set')}
                </Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.fieldValue}>
                <Text style={styles.fieldText}>
                  {profileLoading ? 'Loading...' : (doctor?.email || 'Not set')}
                </Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.fieldValue}>
                <Text style={styles.fieldText}>
                  {profileLoading ? 'Loading...' : (doctor?.phoneNumber || 'Not set')}
                </Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Speciality</Text>
              <View style={styles.fieldValue}>
                <Text style={styles.fieldText}>
                  {profileLoading ? 'Loading...' : (doctor?.specialty || 'Not set')}
                </Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Special ID</Text>
              <View style={styles.fieldValue}>
                <Text style={styles.fieldText}>
                  {profileLoading ? 'Loading...' : (doctor?.specialId || 'Not set')}
                </Text>
              </View>
            </View>

          </View>
        </View>

        {/* Settings Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleEditProfile}>
            <View style={styles.settingLeft}>
              <Ionicons name="create" size={24} color="#F59E0B" />
              <Text style={styles.settingText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed" size={24} color="#F59E0B" />
              <Text style={styles.settingText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity> */}

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color="#F59E0B" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="card" size={24} color="#3B82F6" />
              <Text style={styles.settingText}>Subscription</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <Ionicons name="log-out" size={24} color="#8B4513" />
              <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleCloseEditModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.formContainer}>
                {/* Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    value={editName}
                    onChangeText={setEditName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={editEmail}
                    onChangeText={setEditEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Phone Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9CA3AF"
                    value={editPhone}
                    onChangeText={setEditPhone}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Specialty</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your specialty"
                    placeholderTextColor="#9CA3AF"
                    value={editSpecialty}
                    onChangeText={setEditSpecialty}
                    autoCorrect={false}
                  />
                </View>

                {/* Password Section */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Change Password</Text>
                  <View style={styles.passwordRow}>
                    <View style={styles.halfWidthContainer}>
                      <Text style={styles.passwordLabel}>Current Password</Text>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Current password"
                        placeholderTextColor="#9CA3AF"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry={true}
                        autoCorrect={false}
                      />
                    </View>
                    <View style={styles.halfWidthContainer}>
                      <Text style={styles.passwordLabel}>New Password</Text>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="New password"
                        placeholderTextColor="#9CA3AF"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={true}
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
                    onPress={handleSaveProfile}
                    disabled={loading}
                  >
                    <Text style={styles.saveButtonText}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={handleCloseEditModal}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
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
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
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
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4.65,
    elevation: 8,
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
    marginBottom: 30,
    textAlign: 'center',
  },
  fieldsContainer: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldValue: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fieldText: {
    fontSize: 16,
    color: '#374151',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
  },
  // Additional Card Styles
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
  },
  textAreaValue: {
    minHeight: 60,
    justifyContent: 'flex-start',
  },
  // Settings Styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 15,
  },
  logoutText: {
    color: '#EF4444',
  },
  // Edit Profile Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
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
    maxHeight: 400,
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
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
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
  // Password Section Styles
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidthContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#374151',
    backgroundColor: 'white',
  },
});
