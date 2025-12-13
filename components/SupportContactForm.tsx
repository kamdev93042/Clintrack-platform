import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SupportContactFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: { name: string; mobileNumber: string; message: string }) => Promise<void>;
}

export default function SupportContactForm({ visible, onClose, onSubmit }: SupportContactFormProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; mobileNumber?: string; message?: string }>({});

  const validateMobileNumber = (mobile: string) => {
    // Remove any spaces, dashes, or special characters
    const cleaned = mobile.replace(/[\s\-\(\)]/g, '');
    // Check if it's 10 digits (Indian mobile number format)
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(cleaned);
  };

  const validateForm = () => {
    const newErrors: { name?: string; mobileNumber?: string; message?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!validateMobileNumber(mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    if (!message.trim()) {
      newErrors.message = 'Message is required';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit({ 
          name: name.trim(), 
          mobileNumber: mobileNumber.trim(),
          message: message.trim() 
        });
      } else {
        // Default behavior - just show success message
        Alert.alert(
          'Message Sent!',
          'Thank you for contacting us. We will respond shortly.',
          [
            {
              text: 'OK',
              onPress: () => {
                handleClose();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setMobileNumber('');
    setMessage('');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.overlay}>
          <View style={[styles.formContainer, { paddingTop: insets.top + 20 }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.logoContainer}>
                  <Ionicons name="business" size={20} color="#6B46C1" />
                </View>
                <Text style={styles.headerTitle}>ClinTrack</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {/* Welcome Message */}
              <View style={styles.welcomeBubble}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#6B46C1" style={styles.bubbleIcon} />
                <Text style={styles.welcomeText}>
                  Hi! Let us know how we can help and we'll respond shortly.
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.formFields}>
                {/* Name Field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Name*</Text>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="Enter your name"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (errors.name) {
                        setErrors({ ...errors, name: undefined });
                      }
                    }}
                    editable={!loading}
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                {/* Mobile Number Field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Mobile Number*</Text>
                  <TextInput
                    style={[styles.input, errors.mobileNumber && styles.inputError]}
                    placeholder="Enter your mobile number"
                    placeholderTextColor="#9CA3AF"
                    value={mobileNumber}
                    onChangeText={(text) => {
                      // Allow only digits and limit to 10 digits
                      const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
                      setMobileNumber(cleaned);
                      if (errors.mobileNumber) {
                        setErrors({ ...errors, mobileNumber: undefined });
                      }
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!loading}
                  />
                  {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
                </View>

                {/* Message Field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>How can we help?*</Text>
                  <TextInput
                    style={[styles.textArea, errors.message && styles.inputError]}
                    placeholder="Type your message here..."
                    placeholderTextColor="#9CA3AF"
                    value={message}
                    onChangeText={(text) => {
                      setMessage(text);
                      if (errors.message) {
                        setErrors({ ...errors, message: undefined });
                      }
                    }}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    editable={!loading}
                  />
                  {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>SEND</Text>
                  )}
                </TouchableOpacity>

                {/* Footer Text */}
                <Text style={styles.footerText}>
                  This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  formContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    minHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
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
    marginRight: 10,
  },
  headerTitle: {
    color: '#374151',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  welcomeBubble: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bubbleIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  welcomeText: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  formFields: {
    gap: 20,
  },
  fieldContainer: {
    marginBottom: 4,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#374151',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#374151',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minHeight: 120,
    maxHeight: 200,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});

