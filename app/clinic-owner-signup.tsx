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
    if (!email || !email.trim()) return 'Email is required';
    const trimmedEmail = email.trim();
    // More comprehensive email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address (e.g., name@example.com)';
    }
    // Check for basic email format requirements
    if (trimmedEmail.length > 254) return 'Email address is too long';
    if (trimmedEmail.indexOf('@') === -1) return 'Email must contain @ symbol';
    if (trimmedEmail.split('@')[1]?.indexOf('.') === -1) return 'Email must contain a valid domain (e.g., .com)';
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
        // Try multiple ways to get the field name
        const field = err.path || err.param || err.field || err.location || err.msg?.split(' ')[0]?.toLowerCase();
        const message = err.msg || err.message || 'Invalid value';
        
        // Map backend field names to frontend field names (case-insensitive)
        const fieldMap: {[key: string]: string} = {
          'clinicname': 'clinicName',
          'clinicName': 'clinicName',
          'ownername': 'ownerName',
          'ownerName': 'ownerName',
          'email': 'email',
          'phonenumber': 'phoneNumber',
          'phoneNumber': 'phoneNumber',
          'address': 'address',
          'pincode': 'pincode',
          'pinCode': 'pincode',
          'password': 'password',
        };
        
        // Normalize field name for lookup
        const normalizedField = field?.toLowerCase() || '';
        const frontendField = fieldMap[normalizedField] || fieldMap[field] || field;
        
        // Always set the error, even if field mapping fails
        if (frontendField) {
          newErrors[frontendField] = message;
        } else {
          // If we can't map the field, try to extract it from the message
          const messageLower = message.toLowerCase();
          if (messageLower.includes('email')) {
            newErrors.email = message;
          } else if (messageLower.includes('phone')) {
            newErrors.phoneNumber = message;
          } else if (messageLower.includes('password')) {
            newErrors.password = message;
          } else if (messageLower.includes('pin')) {
            newErrors.pincode = message;
          } else if (messageLower.includes('clinic')) {
            newErrors.clinicName = message;
          } else if (messageLower.includes('owner')) {
            newErrors.ownerName = message;
          } else if (messageLower.includes('address')) {
            newErrors.address = message;
          } else {
            // Fallback: show in general error
            newErrors.general = message;
          }
        }
      });
    } 
    // Check if error has a field property (from backend custom errors)
    else if (error?.field && error?.message) {
      // Backend explicitly specified the field
      const fieldMap: {[key: string]: string} = {
        'email': 'email',
        'phoneNumber': 'phoneNumber',
        'clinicName': 'clinicName',
        'ownerName': 'ownerName',
        'address': 'address',
        'pinCode': 'pincode',
        'pincode': 'pincode',
        'password': 'password',
      };
      const frontendField = fieldMap[error.field] || error.field;
      newErrors[frontendField] = error.message;
    }
    // Check if error has a single message and try to extract field
    else if (error?.message) {
      const message = error.message.toLowerCase();
      // Check for duplicate email error
      if (message.includes('already registered') || message.includes('already exists')) {
        if (message.includes('email')) {
          newErrors.email = error.message;
        } else if (message.includes('phone') || message.includes('phone number')) {
          newErrors.phoneNumber = error.message;
        } else {
          // Generic "already exists" - try to determine field from context
          newErrors.email = error.message; // Default to email as most common
        }
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
      } else {
        // If we can't determine the field, show general error
        newErrors.general = error.message;
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // Show alert for all validation errors
      const errorMessages = Object.values(newErrors);
      if (errorMessages.length > 0) {
        // If there's a duplicate email error, show it prominently
        if (newErrors.email && (newErrors.email.includes('already registered') || newErrors.email.includes('already exists'))) {
          Alert.alert(
            'Email Already Registered',
            newErrors.email,
            [{ text: 'OK' }]
          );
        } else if (newErrors.general) {
          // General error - show it directly
          Alert.alert('Error', newErrors.general, [{ text: 'OK' }]);
        } else if (errorMessages.length === 1) {
          // Single error - show it directly
          Alert.alert('Validation Error', errorMessages[0], [{ text: 'OK' }]);
        } else {
          // Multiple errors - show summary
          const errorSummary = errorMessages.slice(0, 3).join('\n• ');
          const remainingCount = errorMessages.length > 3 ? `\n...and ${errorMessages.length - 3} more error(s)` : '';
          Alert.alert(
            'Validation Errors',
            `Please fix the following:\n• ${errorSummary}${remainingCount}`,
            [{ text: 'OK' }]
          );
        }
      }
    } else if (error?.message) {
      // If no field-specific errors but has general message, show it
      Alert.alert('Error', error.message, [{ text: 'OK' }]);
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
        console.log('Registration failed, result:', result);
        // Handle backend validation errors
        // Check if errorData has content (not just empty object)
        if (result.errorData && Object.keys(result.errorData).length > 0) {
          // Pass full error data including field information
          console.log('Handling errorData:', result.errorData);
          handleBackendErrors(result.errorData);
        } else if (result.errors && result.errors.length > 0) {
          // Handle validation errors array
          console.log('Handling errors array:', result.errors);
          handleBackendErrors({ errors: result.errors, message: result.message });
        } else if (result.message) {
          // Handle single error message
          console.log('Handling single message:', result.message);
          // Check if message contains "already registered" to determine field
          if (result.message.toLowerCase().includes('already registered') || 
              result.message.toLowerCase().includes('already exists')) {
            // This is likely a duplicate email error
            handleBackendErrors({ 
              message: result.message,
              field: 'email'
            });
          } else {
            handleBackendErrors({ message: result.message });
          }
        } else {
          Alert.alert('Error', result.message || 'Registration failed');
        }
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Registration error (catch block):', error);
      console.error('Error response:', error?.response);
      console.error('Error message:', error?.message);
      // Handle API errors - check if error has response data
      if (error?.response?.data) {
        // Backend validation errors are in error.response.data
        console.log('Handling error.response.data:', error.response.data);
        handleBackendErrors(error.response.data);
      } else if (error?.message) {
        // Network or other errors - try to extract field if it's a known error
        const errorMessage = error.message;
        console.log('Handling error.message:', errorMessage);
        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          // This is likely a duplicate email error
          handleBackendErrors({ 
            message: errorMessage,
            field: 'email'
          });
        } else {
          handleBackendErrors({ message: errorMessage });
        }
      } else {
        console.log('No error message found, showing generic error');
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
                // Real-time email validation
                if (text.trim() && errors.email) {
                  const emailError = validateEmail(text);
                  if (!emailError) {
                    clearError('email');
                  }
                }
              }}
              onBlur={() => {
                // Validate email when user leaves the field
                const emailError = validateEmail(email);
                if (emailError) {
                  setErrors(prev => ({ ...prev, email: emailError }));
                }
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

