import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, StatusBar, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Field-level error states
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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
    if (pwd.length < 6) return 'Password must be at least 6 characters long';
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    // Check for number
    if (!/\d/.test(pwd)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    return '';
  };

  const validateConfirmPassword = (pwd: string, confirmPwd: string): string => {
    if (!confirmPwd) return 'Please confirm your password';
    if (pwd !== confirmPwd) return 'Passwords do not match';
    return '';
  };

  const validatePinCode = (pin: string): string => {
    if (!pin) return 'PIN code is required';
    if (!/^\d+$/.test(pin)) return 'PIN code must contain only digits';
    if (pin.length !== 6) return 'PIN code must be exactly 6 digits';
    return '';
  };

  const validateSpecialId = (id: string): string => {
    if (!id) return 'Special ID is required';
    if (!/^\d+$/.test(id)) return 'Special ID must contain only digits';
    if (id.length !== 6) return 'Special ID must be exactly 6 digits';
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
    
    // Check if error has validation errors array (from express-validator)
    if (error?.errors && Array.isArray(error.errors)) {
      error.errors.forEach((err: any) => {
        // Try multiple ways to get the field name
        const field = err.path || err.param || err.field || err.location || err.msg?.split(' ')[0]?.toLowerCase();
        const message = err.msg || err.message || 'Invalid value';
        
        // Map backend field names to frontend field names (case-insensitive)
        const fieldMap: {[key: string]: string} = {
          'fullname': 'fullName',
          'fullName': 'fullName',
          'email': 'email',
          'phonenumber': 'phoneNumber',
          'phoneNumber': 'phoneNumber',
          'specialty': 'specialty',
          'password': 'password',
          'confirmpassword': 'confirmPassword',
          'confirmPassword': 'confirmPassword',
          'pincode': 'pinCode',
          'pinCode': 'pinCode',
          'specialid': 'specialId',
          'specialId': 'specialId',
          'iddocument': 'idDocument',
          'idDocument': 'idDocument',
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
            newErrors.pinCode = message;
          } else if (messageLower.includes('special id')) {
            newErrors.specialId = message;
          } else if (messageLower.includes('name')) {
            newErrors.fullName = message;
          } else if (messageLower.includes('specialty')) {
            newErrors.specialty = message;
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
        'specialId': 'specialId',
        'pinCode': 'pinCode',
        'fullName': 'fullName',
        'password': 'password',
        'specialty': 'specialty',
        'idDocument': 'idDocument',
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
        } else if (message.includes('special id') || message.includes('specialid')) {
          newErrors.specialId = error.message;
        } else {
          // Generic "already exists" - try to determine field from context
          newErrors.email = error.message; // Default to email as most common
        }
      } else if (message.includes('phone') || message.includes('phone number')) {
        newErrors.phoneNumber = error.message;
      } else if (message.includes('password')) {
        newErrors.password = error.message;
      } else if (message.includes('special id') || message.includes('specialid')) {
        newErrors.specialId = error.message;
      } else if (message.includes('pin') || message.includes('pin code')) {
        newErrors.pinCode = error.message;
      } else if (message.includes('name') || message.includes('full name')) {
        newErrors.fullName = error.message;
      } else if (message.includes('specialty')) {
        newErrors.specialty = error.message;
      } else if (message.includes('document') || message.includes('id document')) {
        newErrors.idDocument = error.message;
      } else {
        // If we can't determine the field, show general error
        // Show in a general error state
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
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    
    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;
    
    if (!specialty) {
      newErrors.specialty = 'Specialty is required';
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    
    const pinError = validatePinCode(pinCode);
    if (pinError) newErrors.pinCode = pinError;
    
    const specialIdError = validateSpecialId(specialId);
    if (specialIdError) newErrors.specialId = specialIdError;
    
    if (!idDocument) {
      newErrors.idDocument = 'ID document is required';
    }
    
    // If there are validation errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
        // Navigate to email verification screen
        setLoading(false);
        router.push({
          pathname: '/verify-email',
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

        // Clear error when document is uploaded
        clearError('idDocument');

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
    clearError('specialty');
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
      {!loading && !showSuccessMessage ? (
        <ScrollView 
          style={styles.mainContent} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          <Text style={styles.title}>Create Account</Text>
        
        {/* Full Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={[styles.input, errors.fullName && styles.inputError]}
            placeholder="Dr. Your Name"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              clearError('fullName');
            }}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
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
            placeholder="+91 XXXXX XXXXX"
            placeholderTextColor="#9CA3AF"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              clearError('phoneNumber');
            }}
            keyboardType="phone-pad"
            autoCorrect={false}
            maxLength={10}
          />
          {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
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
                // Clear confirm password error if password changes
                if (confirmPassword && text === confirmPassword) {
                  clearError('confirmPassword');
                }
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
          {!errors.password && (
            <Text style={styles.helperText}>
              Password must contain at least one uppercase letter, one lowercase letter, and one number
            </Text>
          )}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm your password"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearError('confirmPassword');
                // Validate match in real-time
                if (text && password && text !== password) {
                  setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
                }
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        </View>

        {/* PIN Code Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>PIN Code</Text>
          <TextInput
            style={[styles.input, errors.pinCode && styles.inputError]}
            placeholder="Enter your PIN code"
            placeholderTextColor="#9CA3AF"
            value={pinCode}
            onChangeText={(text) => {
              setPinCode(text);
              clearError('pinCode');
            }}
            keyboardType="numeric"
            maxLength={6}
            autoCorrect={false}
          />
          {errors.pinCode && <Text style={styles.errorText}>{errors.pinCode}</Text>}
        </View>

        {/* Specialty Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Specialty</Text>
          <TouchableOpacity 
            style={[styles.specialtyContainer, errors.specialty && styles.inputError]}
            onPress={() => {
              setShowSpecialtyModal(true);
              clearError('specialty');
            }}
          >
            <Text style={[styles.specialtyInput, specialty ? styles.specialtyInputSelected : styles.specialtyInputPlaceholder]}>
              {specialty || "Select your specialty"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" style={styles.chevronIcon} />
          </TouchableOpacity>
          {errors.specialty && <Text style={styles.errorText}>{errors.specialty}</Text>}
        </View>

        {/* Special ID Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Special ID (6 digits)</Text>
          <TextInput
            style={[styles.input, errors.specialId && styles.inputError]}
            placeholder="Enter your 6-digit Special ID"
            placeholderTextColor="#9CA3AF"
            value={specialId}
            onChangeText={(text) => {
              setSpecialId(text);
              clearError('specialId');
            }}
            keyboardType="numeric"
            maxLength={6}
            autoCorrect={false}
          />
          {errors.specialId && <Text style={styles.errorText}>{errors.specialId}</Text>}
          <Text style={styles.helperText}>This unique ID will be used when clinic owners add you to their clinic</Text>
        </View>

        {/* ID Document Upload */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Doctor ID Document</Text>
          <View style={styles.idUploadContainer}>
            {!idDocument ? (
              <TouchableOpacity 
                style={[styles.uploadButton, errors.idDocument && styles.uploadButtonError]} 
                onPress={() => {
                  handleUploadID();
                  clearError('idDocument');
                }}
              >
                <Ionicons name="cloud-upload-outline" size={24} color={errors.idDocument ? "#EF4444" : "#6B46C1"} />
                <Text style={[styles.uploadButtonText, errors.idDocument && styles.uploadButtonTextError]}>Upload ID Document</Text>
                <Text style={styles.uploadSubtext}>PDF, JPG, PNG (Max 5MB)</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.uploadedFileContainer, errors.idDocument && styles.uploadedFileContainerError]}>
                <View style={styles.fileInfo}>
                  <Ionicons name="document-text" size={20} color="#6B46C1" />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{idDocument.name}</Text>
                    <Text style={styles.fileSize}>{idDocument.size}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={() => {
                  handleRemoveID();
                  clearError('idDocument');
                }}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          {errors.idDocument && <Text style={styles.errorText}>{errors.idDocument}</Text>}
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
  uploadButtonError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  uploadButtonTextError: {
    color: '#EF4444',
  },
  uploadedFileContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
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
