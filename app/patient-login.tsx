import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PatientAuthService from '../services/patientAuthService';

export default function PatientLoginScreen() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Field-level error states
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Clear error for a specific field
  const clearError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const handleLogin = async () => {
    // Clear previous errors
    setErrors({});
    
    // Validate fields
    const newErrors: {[key: string]: string} = {};
    
    if (!mobileNumber) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else {
      // Validate mobile number format
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(mobileNumber)) {
        newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
      }
    }
    
    // If there are validation errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const result = await PatientAuthService.login(mobileNumber);
      
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
        console.log('Patient login failed, result:', result);
        // Handle backend validation errors
        const resultAny = result as any;
        
        // Check if result has errorData
        if (resultAny.errorData && Object.keys(resultAny.errorData).length > 0) {
          const errorData = resultAny.errorData;
          console.log('Handling errorData:', errorData);
          
          // Check if error has validation errors array
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorData.errors.forEach((err: any) => {
              const field = err.path || err.param || err.field || 'mobileNumber';
              const message = err.msg || err.message || 'Invalid value';
              if (field === 'mobileNumber' || field === 'mobile' || message.toLowerCase().includes('mobile')) {
                setErrors({ mobileNumber: message });
              }
            });
          } 
          // Check if error has a field property
          else if (errorData.field && errorData.message) {
            if (errorData.field === 'mobileNumber' || errorData.field === 'mobile') {
              setErrors({ mobileNumber: errorData.message });
            } else {
              setErrors({ mobileNumber: errorData.message });
            }
          }
          // Check if error has a single message
          else if (errorData.message) {
            const errorMessage = errorData.message;
            const messageLower = errorMessage.toLowerCase();
            
            if (messageLower.includes('mobile') || 
                messageLower.includes('10 digits') || 
                messageLower.includes('exactly 10') ||
                messageLower.includes('provide mobile')) {
              setErrors({ mobileNumber: errorMessage });
            } else if (messageLower.includes('invalid') || 
                       messageLower.includes('credentials') || 
                       messageLower.includes('incorrect') || 
                       messageLower.includes('wrong') || 
                       messageLower.includes('not found') ||
                       messageLower.includes('discharged')) {
              setErrors({ mobileNumber: errorMessage });
            } else {
              setErrors({ mobileNumber: errorMessage });
            }
          }
        }
        // Check if result has errors array
        else if (resultAny.errors && resultAny.errors.length > 0) {
          console.log('Handling errors array:', resultAny.errors);
          resultAny.errors.forEach((err: any) => {
            const field = err.path || err.param || err.field || 'mobileNumber';
            const message = err.msg || err.message || 'Invalid value';
            if (field === 'mobileNumber' || field === 'mobile' || message.toLowerCase().includes('mobile')) {
              setErrors({ mobileNumber: message });
            }
          });
        }
        // Check if result has message
        else if (result.message) {
          const errorMsg = result.message;
          const messageLower = errorMsg.toLowerCase();
          console.log('Handling single message:', errorMsg);
          
          if (messageLower.includes('mobile') || 
              messageLower.includes('10 digits') || 
              messageLower.includes('exactly 10') ||
              messageLower.includes('provide mobile')) {
            setErrors({ mobileNumber: errorMsg });
          } else if (messageLower.includes('invalid') || 
                     messageLower.includes('credentials') ||
                     messageLower.includes('incorrect') ||
                     messageLower.includes('wrong') ||
                     messageLower.includes('not found') ||
                     messageLower.includes('discharged')) {
            setErrors({ mobileNumber: errorMsg });
          } else {
            // Show alert for other errors
            Alert.alert('Error', errorMsg);
          }
        } else {
          Alert.alert('Error', 'Login failed. Please try again.');
        }
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Patient login error (catch block):', error);
      console.error('Error response:', error?.response);
      
      // Handle backend validation errors
      if (error?.response?.data) {
        const errorData = error.response.data;
        console.log('Handling error.response.data:', errorData);
        
        // Check if error has validation errors array
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err: any) => {
            const field = err.path || err.param || err.field || 'mobileNumber';
            const message = err.msg || err.message || 'Invalid value';
            if (field === 'mobileNumber' || field === 'mobile' || message.toLowerCase().includes('mobile')) {
              setErrors({ mobileNumber: message });
            }
          });
        } 
        // Check if error has a field property
        else if (errorData.field && errorData.message) {
          if (errorData.field === 'mobileNumber' || errorData.field === 'mobile') {
            setErrors({ mobileNumber: errorData.message });
          } else {
            setErrors({ mobileNumber: errorData.message });
          }
        }
        // Check if error has a single message
        else if (errorData.message) {
          const errorMessage = errorData.message;
          const messageLower = errorMessage.toLowerCase();
          
          // Check for mobile number validation errors
          if (messageLower.includes('mobile') || 
              messageLower.includes('10 digits') || 
              messageLower.includes('exactly 10') ||
              messageLower.includes('provide mobile')) {
            setErrors({ mobileNumber: errorMessage });
          } 
          // Check for invalid credentials
          else if (messageLower.includes('invalid') || 
                   messageLower.includes('credentials') || 
                   messageLower.includes('incorrect') || 
                   messageLower.includes('wrong') || 
                   messageLower.includes('not found') ||
                   messageLower.includes('discharged')) {
            setErrors({ mobileNumber: errorMessage });
          } 
          // Default: show in mobile number field
          else {
            setErrors({ mobileNumber: errorMessage });
          }
        }
      } 
      // Handle error message directly
      else if (error?.message) {
        const errorMessage = error.message;
        const messageLower = errorMessage.toLowerCase();
        console.log('Handling error.message:', errorMessage);
        
        // Check for mobile number validation errors
        if (messageLower.includes('mobile') || 
            messageLower.includes('10 digits') || 
            messageLower.includes('exactly 10')) {
          setErrors({ mobileNumber: errorMessage });
        } 
        // Check for invalid credentials
        else if (messageLower.includes('invalid') || 
                 messageLower.includes('credentials') || 
                 messageLower.includes('incorrect') || 
                 messageLower.includes('wrong') || 
                 messageLower.includes('not found')) {
          setErrors({ mobileNumber: 'Invalid mobile number. Patient not found.' });
        } 
        // Default: show in mobile number field
        else {
          setErrors({ mobileNumber: errorMessage });
        }
      } 
      // Fallback
      else {
        Alert.alert('Error', 'Login failed. Please try again.');
      }
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
        
          {/* Mobile Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <TextInput
              style={[styles.input, errors.mobileNumber && styles.inputError]}
              placeholder="Enter your 10-digit mobile number"
              placeholderTextColor="#9CA3AF"
              value={mobileNumber}
              onChangeText={(text) => {
                // Allow only digits and limit to 10 digits
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
                setMobileNumber(cleaned);
                clearError('mobileNumber');
              }}
              keyboardType="phone-pad"
              maxLength={10}
              autoCorrect={false}
            />
            {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
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
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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

