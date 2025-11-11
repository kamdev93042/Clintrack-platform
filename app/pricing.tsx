import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function PricingScreen() {
  const handleBack = () => {
    router.back();
  };

  const handleSelectPlan = (planName: string) => {
    console.log('Selected plan:', planName);
    // Handle plan selection logic here
  };

  const pricingPlans = [
    {
      id: 'basic',
      title: 'Individual Doctor - Basic',
      description: 'Perfect for solo practitioners',
      price: '₹500',
      period: 'per month',
      features: [
        'Up to 50 patients',
        '100GB storage',
        'Basic patient management',
        'Digital records storage',
        'Email support',
        'Mobile app access',
        'Basic analytics'
      ],
      isPopular: false
    },
    {
      id: 'pro',
      title: 'Individual Doctor - Pro',
      description: 'For growing practices',
      price: '₹1,499',
      period: 'per month',
      features: [
        'Up to 200 patients',
        '500GB storage',
        'Advanced patient management',
        'Priority support',
        'Advanced analytics',
        'Billing management'
      ],
      isPopular: true
    },
    {
      id: 'clinic-starter',
      title: 'Clinic - Starter',
      description: 'For small to medium clinics',
      price: '₹4,999',
      period: 'per month',
      features: [
        'Up to 10 doctors',
        '1,000 patients',
        '1TB storage',
        'Multi-doctor dashboard',
        'Advanced analytics',
        'Billing management',
        'Multi-location support',
        'Priority support'
      ],
      isPopular: false
    },
    {
      id: 'enterprise',
      title: 'Clinic - Enterprise',
      description: 'For large healthcare organizations',
      price: 'Custom',
      period: 'pricing',
      features: [
        'Unlimited doctors',
        'Unlimited patients',
        'Unlimited storage',
        'Custom integrations',
        '24/7 dedicated support',
        'Custom analytics',
        'API access',
        'White-label options'
      ],
      isPopular: false
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5B21B6" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="business" size={24} color="#6B46C1" />
          </View>
          <Text style={styles.headerTitle}>ClinTrack - Pricing</Text>
        </View>
        <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Pricing Plans</Text>
          <Text style={styles.subtitle}>Choose the perfect plan for your healthcare practice.</Text>
        </View>

        {/* Pricing Cards */}
        <View style={styles.pricingContainer}>
          {pricingPlans.map((plan) => (
            <View key={plan.id} style={styles.pricingCard}>
              {/* Popular Badge */}
              {plan.isPopular && (
                <View style={styles.popularBadge}>
                  <Ionicons name="star" size={16} color="white" />
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}

              {/* Plan Header */}
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
              </View>

              {/* Price */}
              <View style={styles.priceSection}>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.period}>{plan.period}</Text>
              </View>

              {/* Features */}
              <View style={styles.featuresSection}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Select Plan Button */}
              <TouchableOpacity 
                style={[styles.selectButton, plan.isPopular && styles.selectButtonPopular]}
                onPress={() => handleSelectPlan(plan.title)}
              >
                <Text style={[styles.selectButtonText, plan.isPopular && styles.selectButtonTextPopular]}>
                  Choose Plan
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#5B21B6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6B46C1',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  pricingContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  pricingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  popularText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: 20,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 16,
    color: '#6B7280',
  },
  priceSection: {
    marginBottom: 24,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6B46C1',
    marginBottom: 4,
  },
  period: {
    fontSize: 16,
    color: '#6B7280',
  },
  featuresSection: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6B46C1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  selectButtonPopular: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1',
  },
  selectButtonTextPopular: {
    color: 'white',
  },
});
