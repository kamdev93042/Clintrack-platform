import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SubscriptionService from '../services/subscriptionService';
import AuthService from '../services/authService';

// Import Razorpay only for native platforms (not web)
let RazorpayCheckout: any = null;
if (Platform.OS !== 'web') {
  try {
    RazorpayCheckout = require('react-native-razorpay').default;
  } catch (error) {
    console.warn('Razorpay not available:', error);
  }
}

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      await AuthService.initializeAuth();
      SubscriptionService.setUserType('doctor');
      await loadSubscription();
      await loadPlans();
      await loadUser();
    } catch (error) {
      console.error('Failed to initialize:', error);
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await SubscriptionService.getSubscription();
      if (response.success) {
        setSubscription(response.data);
      }
    } catch (error: any) {
      console.error('Load subscription error:', error);
      if (error.response?.status !== 404) {
        Alert.alert('Error', error.message || 'Failed to load subscription');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      console.log('📋 Loading plans...');
      const response = await SubscriptionService.getPlans();
      console.log('📋 Plans response:', response);
      if (response.success) {
        setPlans(response.data);
        console.log('✅ Plans loaded:', response.data.length, 'plans');
      } else {
        console.error('❌ Failed to load plans:', response.message);
        Alert.alert('Error', response.message || 'Failed to load plans');
      }
    } catch (error: any) {
      console.error('❌ Load plans error:', error);
      Alert.alert('Error', error.message || 'Failed to load plans');
    }
  };

  const loadUser = async () => {
    try {
      const userData = await AuthService.getUser();
      setUser(userData);
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const handleSubscribe = async (plan: any) => {
    console.log('🔵 Subscribe button clicked for plan:', plan);
    
    if (plan.price === 0) {
      Alert.alert('Info', 'Free plan is already active');
      return;
    }

    if (processing) {
      console.log('⚠️ Already processing, ignoring click');
      return;
    }

    // Check if Razorpay is available (not on web)
    console.log('🌐 Platform.OS:', Platform.OS);
    console.log('💳 RazorpayCheckout available?', RazorpayCheckout !== null);
    
    if (Platform.OS === 'web') {
      console.log('❌ Running on WEB - Razorpay not available');
      Alert.alert(
        'Payment Not Available on Web',
        'Razorpay payment gateway only works on Android and iOS devices.\n\nTo test payments:\n1. Use Android emulator or device\n2. Use iOS simulator or device\n3. Run: npm run android (or npm run ios)',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!RazorpayCheckout) {
      console.error('❌ RazorpayCheckout is not available');
      Alert.alert(
        'Payment Not Available',
        'Razorpay payment gateway is not available. Please make sure:\n1. react-native-razorpay is installed\n2. You are using Android/iOS (not web)\n3. App is rebuilt after installing package',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('🔄 Starting payment process...');
      setProcessing(true);

      // Create payment order
      console.log('📦 Creating payment order for plan:', plan.id);
      const orderResponse = await SubscriptionService.createPaymentOrder(plan.id);
      
      console.log('📦 Order response:', orderResponse);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create order');
      }

      const orderData = orderResponse.data;
      console.log('✅ Order created:', orderData);

      // Open Razorpay checkout
      // Note: orderData.amount is already in rupees, need to convert to paise
      const options = {
        description: 'ClinTrack Subscription',
        image: 'https://your-logo-url.com/logo.png',
        currency: orderData.currency,
        key: orderData.key,
        amount: Math.round(orderData.amount * 100), // Convert rupees to paise
        name: 'ClinTrack',
        order_id: orderData.orderId,
        prefill: {
          email: user?.email || '',
          contact: user?.phoneNumber || '',
          name: user?.fullName || ''
        },
        theme: { color: '#6B46C1' }
      };

      console.log('💳 Opening Razorpay checkout with options:', {
        ...options,
        key: options.key?.substring(0, 10) + '...' // Hide full key in logs
      });

      const paymentData = await RazorpayCheckout.open(options);
      console.log('💳 Payment data received:', paymentData);

      // Verify payment
      const verifyResponse = await SubscriptionService.verifyPayment(
        orderData.orderId,
        paymentData.razorpay_payment_id,
        paymentData.razorpay_signature,
        plan.id
      );

      if (verifyResponse.success) {
        Alert.alert('Success', 'Subscription activated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              loadSubscription();
              router.back();
            }
          }
        ]);
      } else {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        description: error.description,
        stack: error.stack
      });
      
      // Don't show alert if user cancelled
      if (error.message && error.message.includes('User cancelled')) {
        console.log('ℹ️ User cancelled payment');
        return;
      }
      
      if (error.code === 'NETWORK_ERROR') {
        Alert.alert('Network Error', 'Please check your internet connection');
      } else if (error.code === 'BAD_REQUEST_ERROR') {
        Alert.alert('Payment Error', error.description || 'Payment failed');
      } else {
        Alert.alert('Error', error.message || 'Payment failed. Please try again.');
      }
    } finally {
      setProcessing(false);
      console.log('✅ Payment process completed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'trial':
        return '#3B82F6';
      case 'expired':
        return '#EF4444';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'trial':
        return 'Trial';
      case 'expired':
        return 'Expired';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading subscription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Plan Section */}
        {subscription && (
          <View style={styles.currentPlanCard}>
            <Text style={styles.sectionTitle}>Current Plan</Text>
            <View style={styles.planInfo}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{subscription.planName}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(subscription.status) }
                  ]}
                >
                  <Text style={styles.statusText}>{getStatusBadge(subscription.status)}</Text>
                </View>
              </View>
              {subscription.daysRemaining > 0 && (
                <Text style={styles.daysRemaining}>
                  {subscription.daysRemaining} days remaining
                </Text>
              )}
              {subscription.expiryDate && (
                <Text style={styles.expiryDate}>
                  Expires: {new Date(subscription.expiryDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Available Plans Section */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          {plans.length === 0 ? (
            <View style={styles.noPlansContainer}>
              <Text style={styles.noPlansText}>Loading plans...</Text>
            </View>
          ) : (
            plans.map((plan) => (
              <View key={plan.id} style={styles.planCard}>
              <View style={styles.planCardHeader}>
                <Text style={styles.planCardName}>{plan.name}</Text>
                <Text style={styles.planCardPrice}>
                  ₹{plan.price}
                  {plan.price > 0 && <Text style={styles.planCardPeriod}>/month</Text>}
                </Text>
              </View>
              <View style={styles.planFeatures}>
                {plan.features.maxPatients > 0 && (
                  <View style={styles.feature}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.featureText}>
                      {plan.features.maxPatients === -1
                        ? 'Unlimited patients'
                        : `${plan.features.maxPatients} patients`}
                    </Text>
                  </View>
                )}
                {plan.features.maxStorage > 0 && (
                  <View style={styles.feature}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.featureText}>
                      {plan.features.maxStorage === -1
                        ? 'Unlimited storage'
                        : `${plan.features.maxStorage} GB storage`}
                    </Text>
                  </View>
                )}
                <View style={styles.feature}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.featureText}>{plan.features.support} support</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  (subscription?.plan === plan.id || processing) && styles.subscribeButtonDisabled
                ]}
                onPress={() => {
                  console.log('🔘 Subscribe button pressed for plan:', plan.id);
                  console.log('🔘 Current subscription plan:', subscription?.plan);
                  console.log('🔘 Processing:', processing);
                  console.log('🔘 Button disabled?', subscription?.plan === plan.id || processing);
                  handleSubscribe(plan);
                }}
                disabled={subscription?.plan === plan.id || processing}
                activeOpacity={0.7}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : subscription?.plan === plan.id ? (
                  <Text style={styles.subscribeButtonText}>Current Plan</Text>
                ) : (
                  <Text style={styles.subscribeButtonText}>
                    {plan.price === 0 ? 'Select' : 'Subscribe'}
                  </Text>
                )}
              </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827'
  },
  placeholder: {
    width: 40
  },
  content: {
    flex: 1,
    padding: 16
  },
  currentPlanCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16
  },
  planInfo: {
    marginTop: 8
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600'
  },
  daysRemaining: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8
  },
  expiryDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4
  },
  plansSection: {
    marginBottom: 24
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  planCardHeader: {
    marginBottom: 16
  },
  planCardName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8
  },
  planCardPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6B46C1'
  },
  planCardPeriod: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280'
  },
  planFeatures: {
    marginBottom: 20
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12
  },
  subscribeButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  subscribeButtonDisabled: {
    backgroundColor: '#9CA3AF'
  },
  subscribeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  noPlansContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  noPlansText: {
    fontSize: 16,
    color: '#6B7280'
  }
});

