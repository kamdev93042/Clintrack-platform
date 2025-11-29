import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AuthService from '../services/authService';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [specialId, setSpecialId] = useState('');
  const [idDocument, setIdDocument] = useState<{name: string, size: string, uri: string, type: string} | null>(null);
  const [pinCode, setPinCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const specialties = [
    'General Medicine',
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Dermatology',
    'Psychiatry',
    'Gynecology',
    'Ophthalmology',
    'ENT',
    'Physiotherapy',
    'Other'
  ];

  const handleSignUp = async () => {
    if (!fullName || !email || !phoneNumber || !specialty || !password || !pinCode || !specialId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Phone number must be exactly 10 digits');
      return;
    }

    if (specialId.length !== 6) {
      Alert.alert('Error', 'Special ID must be exactly 6 digits');
      return;
    }

    setLoading(true);
    try {
      const doctorData = {
        fullName,
        email,
        phoneNumber,
        specialty,
        password,
        pinCode,
        specialId,
      };

      console.log('Registering with data:', doctorData);
      console.log('ID Document:', idDocument);
      
      const result = await AuthService.register(doctorData, idDocument as any);
      
      if (result.success) {
        // Show success message after a brief delay
        setTimeout(() => {
          setLoading(false);
          setShowSuccessMessage(true);
          
          // Auto redirect to login after showing success message
          setTimeout(() => {
            router.push('/login');
          }, 1500);
        }, 1000);
      } else {
        setLoading(false);
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  const handleUploadID = async () => {
    try {
      // Open document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: false, // Don't copy to cache directory
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Check file size (5MB limit)
        const fileSizeInMB = file.size ? file.size / (1024 * 1024) : 0;
        if (fileSizeInMB > 5) {
          Alert.alert('Error', 'File size must be less than 5MB');
          return;
        }

        // Set the document info
        setIdDocument({
          name: file.name || 'document',
          size: `${fileSizeInMB.toFixed(2)} MB`,
          uri: file.uri,
          type: file.mimeType || 'application/pdf'
        });

        console.log('File selected:', file.name, fileSizeInMB.toFixed(2) + 'MB');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleRemoveID = () => {
    setIdDocument(null);
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleBack = () => {
    router.back();
  };

  const handleSpecialtySelect = (selectedSpecialty: string) => {
    setSpecialty(selectedSpecialty);
    setShowSpecialtyModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6B46C1" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.logoContainer}>
            <Ionicons name="business" size={20} color="#6B46C1" />
          </View>
          <Text style={styles.headerTitle}>ClinTrack</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Main Content */}
      {!loading && !showSuccessMessage ? (
        <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Create Account</Text>
        
        {/* Full Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Dr. Your Name"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Phone Number Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 XXXXX XXXXX"
            placeholderTextColor="#9CA3AF"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoCorrect={false}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCorrect={false}
          />
        </View>

        {/* PIN Code Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>PIN Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your PIN code"
            placeholderTextColor="#9CA3AF"
            value={pinCode}
            onChangeText={setPinCode}
            keyboardType="numeric"
            maxLength={6}
            autoCorrect={false}
          />
        </View>

        {/* Specialty Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Specialty</Text>
          <TouchableOpacity 
            style={styles.specialtyContainer}
            onPress={() => setShowSpecialtyModal(true)}
          >
            <Text style={[styles.specialtyInput, specialty ? styles.specialtyInputSelected : styles.specialtyInputPlaceholder]}>
              {specialty || "Select your specialty"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" style={styles.chevronIcon} />
          </TouchableOpacity>
        </View>

        {/* Special ID Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Special ID (6 digits) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your 6-digit Special ID"
            placeholderTextColor="#9CA3AF"
            value={specialId}
            onChangeText={setSpecialId}
            keyboardType="numeric"
            maxLength={6}
            autoCorrect={false}
          />
          <Text style={styles.helperText}>This unique ID will be used when clinic owners add you to their clinic</Text>
        </View>

        {/* ID Document Upload */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Doctor ID Document (Optional)</Text>
          <View style={styles.idUploadContainer}>
            {!idDocument ? (
              <TouchableOpacity style={styles.uploadButton} onPress={handleUploadID}>
                <Ionicons name="cloud-upload-outline" size={24} color="#6B46C1" />
                <Text style={styles.uploadButtonText}>Upload ID Document</Text>
                <Text style={styles.uploadSubtext}>PDF, JPG, PNG (Max 5MB)</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.uploadedFileContainer}>
                <View style={styles.fileInfo}>
                  <Ionicons name="document-text" size={20} color="#6B46C1" />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{idDocument.name}</Text>
                    <Text style={styles.fileSize}>{idDocument.size}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={handleRemoveID}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Create Account Button */}
        <TouchableOpacity 
          style={[styles.createAccountButton, loading && styles.createAccountButtonDisabled]} 
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.createAccountButtonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      ) : null}

      {/* Loader Overlay */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#6B46C1" />
        </View>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <View style={styles.loaderOverlay}>
          <View style={styles.successMessageContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.successMessageText}>
              Successfully registered
            </Text>
          </View>
        </View>
      )}

      {/* Specialty Selection Modal */}
      <Modal
        visible={showSpecialtyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSpecialtyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.specialtyModal}>
            <View style={styles.specialtyModalHeader}>
              <Text style={styles.specialtyModalTitle}>Select your speciality</Text>
              <TouchableOpacity onPress={() => setShowSpecialtyModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.specialtyList}>
              {specialties.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.specialtyItem,
                    specialty === item && styles.specialtyItemSelected
                  ]}
                  onPress={() => handleSpecialtySelect(item)}
                >
                  <Text style={[
                    styles.specialtyItemText,
                    specialty === item && styles.specialtyItemTextSelected
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
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
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6B46C1',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B46C1',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
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
    backgroundColor: 'white',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  specialtyContainer: {
    position: 'relative',
  },
  specialtyInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 40,
    fontSize: 16,
    backgroundColor: 'white',
  },
  specialtyInputSelected: {
    color: '#374151',
  },
  specialtyInputPlaceholder: {
    color: '#9CA3AF',
  },
  chevronIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  createAccountButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  createAccountButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  createAccountButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom:30,
  },
  loginText: {
    fontSize: 16,
    color: '#374151',
  },
  loginLink: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '600',
  },
  // Specialty Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialtyModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  specialtyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  specialtyModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  specialtyList: {
    maxHeight: 400,
  },
  specialtyItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  specialtyItemSelected: {
    backgroundColor: '#6B7280',
  },
  specialtyItemText: {
    fontSize: 16,
    color: '#374151',
  },
  specialtyItemTextSelected: {
    color: 'white',
  },
  // ID Upload Styles
  idUploadContainer: {
    marginTop: 5,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#6B46C1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B46C1',
    marginTop: 6,
    marginBottom: 2,
  },
  uploadSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 10,
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 1,
  },
  fileSize: {
    fontSize: 13,
    color: '#6B7280',
  },
  removeButton: {
    padding: 4,
  },
  // Loader Overlay Styles
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
    textAlign: 'center',
  },
});
