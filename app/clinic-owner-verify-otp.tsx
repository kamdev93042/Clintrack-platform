import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ClinicOwnerAuthService from '../services/clinicOwnerAuthService';

export default function ClinicOwnerVerifyOTPScreen() {
  const params = useLocalSearchParams<{ email: string }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const insets = useSafeAreaInsets();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!email) {
      Alert.alert('Error', 'Email is required');
      router.back();
    }
  }, [email]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Clear error when user types
    if (errors.otp) {
      setErrors({});
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setErrors({ otp: 'Please enter complete 6-digit OTP' });
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email is required');
      router.back();
      return;
    }

    setLoading(true);
    try {
      const result = await ClinicOwnerAuthService.verifyOTP(email, otpString);
      
      if (result.success) {
        // Keep loader visible and navigate immediately
        router.push({
          pathname: '/clinic-owner-reset-password',
          params: { email, otp: otpString }
        });
        // Don't set loading to false here - let the screen unmount handle it
      } else {
        setLoading(false);
        setErrors({ otp: result.message || 'Invalid OTP. Please try again.' });
      }
    } catch (error: any) {
      setLoading(false);
      setErrors({ otp: error.message || 'Failed to verify OTP. Please try again.' });
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0 || resendLoading) return;

    if (!email) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setResendLoading(true);
    try {
      const result = await ClinicOwnerAuthService.forgotPassword(email);
      
      if (result.success) {
        Alert.alert('Success', 'A new OTP has been sent to your email address.');
        setResendTimer(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', result.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
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
            <Ionicons name="business" size={20} color="#6B46C1" />
          </View>
          <Text style={styles.headerTitle}>ClinTrack</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail" size={64} color="#6B46C1" />
        </View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit OTP to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>
        
        {/* OTP Input Fields */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                errors.otp && styles.otpInputError
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleOtpKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>
        {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}

        {/* Verify Button */}
        <TouchableOpacity 
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]} 
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        {/* Resend OTP */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the OTP? </Text>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimerText}>Resend in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity 
              onPress={handleResendOTP}
              disabled={resendLoading}
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color="#6B46C1" />
              ) : (
                <Text style={styles.resendLink}>Resend OTP</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Full Screen Loader Overlay */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#6B46C1" />
            <Text style={styles.loaderText}>Verifying OTP...</Text>
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B46C1',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  emailText: {
    fontWeight: '600',
    color: '#374151',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    backgroundColor: 'white',
  },
  otpInputFilled: {
    borderColor: '#6B46C1',
    backgroundColor: '#F3F4F6',
  },
  otpInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  verifyButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  verifyButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  resendText: {
    fontSize: 16,
    color: '#6B7280',
  },
  resendTimerText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  resendLink: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '600',
  },
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
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});

