import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PatientAuthService from '../services/patientAuthService';

export default function PatientLoginScreen() {
  const [patientName, setPatientName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!patientName || !mobileNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate mobile number format (basic validation)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const result = await PatientAuthService.login(patientName, mobileNumber);
      
      if (result.success) {
        // Show success message after a brief delay
        setTimeout(() => {
          setLoading(false);
          setShowSuccessMessage(true);
          
          // Auto redirect to dashboard after showing success message
          setTimeout(() => {
            router.push('/patient-dashboard');
          }, 1500);
        }, 1000);
      } else {
        setLoading(false);
        Alert.alert('Error', result.message || 'Login failed. Please try again.');
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error?.message || 'Login failed. Please try again.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#6B46C1" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.logoContainer}>
            <Ionicons name="accessibility" size={20} color="#6B46C1" />
          </View>
          <Text style={styles.headerTitle}>ClinTrack</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Main Content */}
      {!loading && !showSuccessMessage && (
        <View style={styles.mainContent}>
          <Text style={styles.title}>Patient Login</Text>
          <Text style={styles.subtitle}>Access your medical records</Text>
        
          {/* Patient Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Patient Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              value={patientName}
              onChangeText={setPatientName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Mobile Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your 10-digit mobile number"
              placeholderTextColor="#9CA3AF"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              maxLength={10}
              autoCorrect={false}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          {/* Info Text */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              View-only access to your medical records, prescriptions, and reports
            </Text>
          </View>
        </View>
      )}

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
              Successfully logged in
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
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
  loginButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 30,
    marginBottom: 20,
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
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

