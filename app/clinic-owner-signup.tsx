import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, StatusBar, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ClinicOwnerAuthService from '../services/clinicOwnerAuthService';

export default function ClinicOwnerSignUpScreen() {
  const [clinicName, setClinicName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Field-level error states
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Validation functions
  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePhoneNumber = (phone: string): string => {
    if (!phone) return 'Phone number is required';
    if (!/^\d+$/.test(phone)) return 'Phone number must contain only digits';
    if (phone.length !== 10) return 'Phone number must be exactly 10 digits';
    return '';
  };

  const validatePassword = (pwd: string): string => {
    if (!pwd) return 'Password is required';
    if (pwd.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validatePincode = (pin: string): string => {
    if (!pin) return 'Pincode is required';
    if (!/^\d+$/.test(pin)) return 'Pincode must contain only digits';
    if (pin.length !== 6) return 'Pincode must be exactly 6 digits';
    return '';
  };

  // Clear error for a specific field
  const clearError = (fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  // Handle backend validation errors
  const handleBackendErrors = (error: any) => {
    const newErrors: {[key: string]: string} = {};
    
    // Check if error has validation errors array
    if (error?.errors && Array.isArray(error.errors)) {
      error.errors.forEach((err: any) => {
        const field = err.path || err.param || err.field;
        const message = err.msg || err.message || 'Invalid value';
        
        // Map backend field names to frontend field names
        const fieldMap: {[key: string]: string} = {
          'clinicName': 'clinicName',
          'ownerName': 'ownerName',
          'email': 'email',
          'phoneNumber': 'phoneNumber',
          'address': 'address',
          'pinCode': 'pincode',
          'pincode': 'pincode',
          'password': 'password',
        };
        
        const frontendField = fieldMap[field] || field;
        newErrors[frontendField] = message;
      });
    } else if (error?.message) {
      // If single error message, try to extract field name
      const message = error.message.toLowerCase();
      if (message.includes('email')) {
        newErrors.email = error.message;
      } else if (message.includes('phone')) {
        newErrors.phoneNumber = error.message;
      } else if (message.includes('password')) {
        newErrors.password = error.message;
      } else if (message.includes('pincode') || message.includes('pin code')) {
        newErrors.pincode = error.message;
      } else if (message.includes('clinic name') || message.includes('clinicname')) {
        newErrors.clinicName = error.message;
      } else if (message.includes('owner name') || message.includes('ownername')) {
        newErrors.ownerName = error.message;
      } else if (message.includes('address')) {
        newErrors.address = error.message;
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    }
  };

  const handleSignUp = async () => {
    // Clear previous errors
    setErrors({});
    
    // Validate all fields
    const newErrors: {[key: string]: string} = {};
    
    if (!clinicName.trim()) {
      newErrors.clinicName = 'Clinic name is required';
    }
    
    if (!ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    }
    
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    
    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;
    
    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    const pincodeError = validatePincode(pincode);
    if (pincodeError) newErrors.pincode = pincodeError;
    
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    
    // If there are validation errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const clinicOwnerData = {
        clinicName,
        ownerName,
        email,
        phoneNumber,
        address,
        pinCode: pincode, // Convert pincode to pinCode for backend
        password,
      };

      console.log('Registering clinic owner with data:', { ...clinicOwnerData, password: '***' });

      const result = await ClinicOwnerAuthService.register(clinicOwnerData);
      
      if (result.success) {
        // Navigate to email verification screen
        setLoading(false);
        router.push({
          pathname: '/clinic-owner-verify-email',
          params: { 
            email: email.trim(),
            registrationToken: result.registrationToken 
          }
        });
      } else {
        setLoading(false);
        // Handle backend validation errors
        if (result.message) {
          handleBackendErrors({ message: result.message });
        } else {
          Alert.alert('Error', result.message || 'Registration failed');
        }
      }
    } catch (error: any) {
      setLoading(false);
      // Handle API errors
      if (error?.response?.data) {
        handleBackendErrors(error.response.data);
      } else if (error?.message) {
        handleBackendErrors({ message: error.message });
      } else {
        Alert.alert('Error', 'Registration failed. Please try again.');
      }
    }
  };


  const handleLogin = () => {
    router.push('/clinic-owner-login');
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
            <Ionicons name="business" size={20} color="#6B46C1" />
          </View>
          <Text style={styles.headerTitle}>ClinTrack</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Main Content */}
      {!loading && !showSuccessMessage && (
        <ScrollView 
          style={styles.mainContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          <Text style={styles.title}>Create Clinic Account</Text>
        
          {/* Clinic Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Clinic Name</Text>
            <TextInput
              style={[styles.input, errors.clinicName && styles.inputError]}
              placeholder="Enter clinic name"
              placeholderTextColor="#9CA3AF"
              value={clinicName}
              onChangeText={(text) => {
                setClinicName(text);
                clearError('clinicName');
              }}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {errors.clinicName && <Text style={styles.errorText}>{errors.clinicName}</Text>}
          </View>

          {/* Owner Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Owner Name</Text>
            <TextInput
              style={[styles.input, errors.ownerName && styles.inputError]}
              placeholder="Enter owner full name"
              placeholderTextColor="#9CA3AF"
              value={ownerName}
              onChangeText={(text) => {
                setOwnerName(text);
                clearError('ownerName');
              }}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {errors.ownerName && <Text style={styles.errorText}>{errors.ownerName}</Text>}
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="your@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError('email');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={[styles.input, errors.phoneNumber && styles.inputError]}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor="#9CA3AF"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                clearError('phoneNumber');
              }}
              keyboardType="phone-pad"
              maxLength={10}
              autoCorrect={false}
            />
            {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
          </View>

          {/* Address Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Clinic Address</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.address && styles.inputError]}
              placeholder="Enter clinic address"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                clearError('address');
              }}
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
              autoCorrect={false}
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>

          {/* Pincode Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Pincode</Text>
            <TextInput
              style={[styles.input, errors.pincode && styles.inputError]}
              placeholder="Enter 6-digit pincode"
              placeholderTextColor="#9CA3AF"
              value={pincode}
              onChangeText={(text) => {
                setPincode(text);
                clearError('pincode');
              }}
              keyboardType="numeric"
              maxLength={6}
              autoCorrect={false}
            />
            {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError('password');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
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
              Successfully registered
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
    color: '#374151',
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  eyeIcon: {
    paddingRight: 16,
    paddingLeft: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
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
    marginBottom: 40,
    paddingBottom: 20,
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

