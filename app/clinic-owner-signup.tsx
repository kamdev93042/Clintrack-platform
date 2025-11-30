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

  const handleSignUp = async () => {
    if (!clinicName || !ownerName || !email || !phoneNumber || !address || !pincode || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Phone number must be exactly 10 digits');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate pincode (6 digits)
    if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
      Alert.alert('Error', 'Pincode must be exactly 6 digits');
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
        setLoading(false);
        setShowSuccessMessage(true);
        
        // Auto redirect to login after showing success message
        setTimeout(() => {
          router.push('/clinic-owner-login');
        }, 1500);
      } else {
        setLoading(false);
        console.error('Registration failed:', result);
        Alert.alert('Error', result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please check your connection and try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as { message?: string; response?: { data?: { message?: string } } };
        errorMessage = err?.message || err?.response?.data?.message || errorMessage;
      }
      
      Alert.alert('Error', errorMessage);
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
              style={styles.input}
              placeholder="Enter clinic name"
              placeholderTextColor="#9CA3AF"
              value={clinicName}
              onChangeText={setClinicName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Owner Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Owner Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter owner full name"
              placeholderTextColor="#9CA3AF"
              value={ownerName}
              onChangeText={setOwnerName}
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
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor="#9CA3AF"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              maxLength={10}
              autoCorrect={false}
            />
          </View>

          {/* Address Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Clinic Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter clinic address"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
              autoCorrect={false}
            />
          </View>

          {/* Pincode Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Pincode</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit pincode"
              placeholderTextColor="#9CA3AF"
              value={pincode}
              onChangeText={setPincode}
              keyboardType="numeric"
              maxLength={6}
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
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

