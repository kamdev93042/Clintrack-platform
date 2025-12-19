import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FinanceScreen() {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
  };

  const financeFeatures = [
    {
      id: 'income-tracking',
      title: 'Income Tracking',
      icon: 'trending-up',
      color: '#10B981',
      description: 'Comprehensive income monitoring and analytics',
      features: [
        'Real-time income tracking',
        'Monthly earnings overview',
        'Projected income calculations',
        'Total earned income history',
        'Income trends and analytics',
        'Visual income charts'
      ]
    },
    {
      id: 'payment-management',
      title: 'Payment Management',
      icon: 'card',
      color: '#3B82F6',
      description: 'Efficient payment tracking and management',
      features: [
        'Track patient payments',
        'Payment history records',
        'Pending payments tracking',
        'Payment status updates',
        'Due date reminders',
        'Payment analytics'
      ]
    },
    {
      id: 'session-fees',
      title: 'Session Fee Management',
      icon: 'cash',
      color: '#F59E0B',
      description: 'Manage session fees and charges',
      features: [
        'Set session fees per patient',
        'Track fees per session',
        'Fee history and records',
        'Custom fee structures',
        'Fee analytics and reports',
        'Revenue from sessions'
      ]
    },
    {
      id: 'financial-reports',
      title: 'Financial Reports',
      icon: 'document-text',
      color: '#8B5CF6',
      description: 'Detailed financial reports and insights',
      features: [
        'Monthly financial summaries',
        'Revenue reports',
        'Payment status reports',
        'Income vs expenses analysis',
        'Export financial data',
        'Custom report generation'
      ]
    },
    {
      id: 'pending-payments',
      title: 'Pending Payments',
      icon: 'time',
      color: '#EF4444',
      description: 'Track and manage outstanding payments',
      features: [
        'View all pending payments',
        'Payment due dates tracking',
        'Overdue payment alerts',
        'Payment reminders',
        'Pending amount calculations',
        'Payment follow-up tools'
      ]
    },
    {
      id: 'revenue-analytics',
      title: 'Revenue Analytics',
      icon: 'analytics',
      color: '#EC4899',
      description: 'Advanced revenue analytics and insights',
      features: [
        'Revenue trends analysis',
        'Monthly revenue comparisons',
        'Growth percentage tracking',
        'Revenue forecasting',
        'Performance metrics',
        'Data visualization'
      ]
    }
  ];

  const financialBenefits = [
    {
      id: 'real-time',
      title: 'Real-Time Tracking',
      icon: 'flash',
      color: '#10B981',
      description: 'Monitor your finances in real-time'
    },
    {
      id: 'accurate',
      title: 'Accurate Records',
      icon: 'checkmark-circle',
      color: '#3B82F6',
      description: 'Maintain accurate financial records'
    },
    {
      id: 'insights',
      title: 'Smart Insights',
      icon: 'bulb',
      color: '#F59E0B',
      description: 'Get valuable financial insights'
    },
    {
      id: 'secure',
      title: 'Secure & Private',
      icon: 'shield-checkmark',
      color: '#8B5CF6',
      description: 'Your financial data is secure'
    }
  ];


  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#5B21B6" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="wallet" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.headerTitle}>Finance</Text>
        </View>
        <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="wallet" size={64} color="white" />
          </View>
          <Text style={styles.heroTitle}>Financial Management</Text>
          <Text style={styles.heroSubtitle}>
            Complete financial control for your practice
          </Text>
          <Text style={styles.heroDescription}>
            Track income, manage payments, and get valuable insights into your practice's financial health with ClinTrack's comprehensive financial management tools.
          </Text>
        </View>

        {/* Financial Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Features</Text>
          <Text style={styles.sectionSubtitle}>Everything you need to manage your finances</Text>
          
          {financeFeatures.map((feature) => (
            <View key={feature.id} style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}15` }]}>
                <Ionicons name={feature.icon} size={28} color={feature.color} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
                <View style={styles.featureList}>
                  {feature.features.map((item, index) => (
                    <View key={index} style={styles.featureListItem}>
                      <Ionicons name="checkmark" size={16} color={feature.color} />
                      <Text style={styles.featureListText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Why Choose Our Financial Tools?</Text>
          <View style={styles.benefitsGrid}>
            {financialBenefits.map((benefit) => (
              <View key={benefit.id} style={styles.benefitCard}>
                <Ionicons name={benefit.icon} size={32} color={benefit.color} />
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitText}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </View>


        {/* Financial Tips Section */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={28} color="#F59E0B" />
            <Text style={styles.tipsTitle}>Financial Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.tipText}>Track all payments regularly to maintain accurate records</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.tipText}>Review monthly reports to understand revenue trends</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.tipText}>Follow up on pending payments to improve cash flow</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.tipText}>Use analytics to make informed financial decisions</Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Manage Your Finances?</Text>
          <Text style={styles.ctaText}>Start tracking your income and payments today</Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={handleBack}
          >
            <Text style={styles.ctaButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    backgroundColor: '#6B46C1',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  heroDescription: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
    maxWidth: 320,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureListText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  benefitsSection: {
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  benefitCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  benefitText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  tipsSection: {
    backgroundColor: '#FEF3C7',
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  ctaSection: {
    backgroundColor: '#6B46C1',
    padding: 40,
    margin: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  ctaTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    color: '#6B46C1',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

