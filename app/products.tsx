import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    router.back();
  };

  const features = [
    {
      id: 'patient-management',
      title: 'Patient Management',
      icon: 'people',
      color: '#3B82F6',
      description: 'Comprehensive patient management system',
      features: [
        'Add and manage patient profiles',
        'Track patient medical history',
        'Session scheduling and tracking',
        'Digital health records storage',
        'Patient progress monitoring',
        'Quick patient search and filters'
      ]
    },
    {
      id: 'session-tracking',
      title: 'Session Tracking',
      icon: 'calendar',
      color: '#10B981',
      description: 'Efficient session management and tracking',
      features: [
        'Schedule and manage sessions',
        'Track session duration and fees',
        'Add treatment and progress notes',
        'Record pain levels and assessments',
        'Schedule follow-up appointments',
        'Session history and analytics'
      ]
    },
    {
      id: 'media-management',
      title: 'Media Management',
      icon: 'images',
      color: '#F59E0B',
      description: 'Store and manage patient media files',
      features: [
        'Upload photos and videos',
        'Secure cloud storage (AWS S3)',
        'Organize media by sessions',
        'Easy media access and viewing',
        'Patient media gallery',
        'Privacy and security protection'
      ]
    },
    {
      id: 'financial-management',
      title: 'Financial Management',
      icon: 'wallet',
      color: '#EF4444',
      description: 'Complete financial tracking and management',
      features: [
        'Track income and earnings',
        'Monthly and projected income',
        'Payment tracking and history',
        'Pending payments management',
        'Financial analytics and reports',
        'Revenue insights and trends'
      ]
    },
    {
      id: 'clinic-management',
      title: 'Clinic Management',
      icon: 'business',
      color: '#8B5CF6',
      description: 'Multi-doctor clinic management system',
      features: [
        'Manage multiple doctors',
        'Centralized patient database',
        'Doctor performance analytics',
        'Clinic-wide financial overview',
        'Team collaboration tools',
        'Administrative controls'
      ]
    },
    {
      id: 'patient-portal',
      title: 'Patient Portal',
      icon: 'accessibility',
      color: '#06B6D4',
      description: 'Patient self-service portal',
      features: [
        'View medical records',
        'Access session history',
        'View photos and videos',
        'Track treatment progress',
        'Secure login with mobile number',
        '24/7 access to health data'
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      icon: 'stats-chart',
      color: '#EC4899',
      description: 'Comprehensive analytics and insights',
      features: [
        'Income and revenue analytics',
        'Patient statistics',
        'Session trends and patterns',
        'Performance metrics',
        'Custom reports generation',
        'Data visualization'
      ]
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: 'shield-checkmark',
      color: '#14B8A6',
      description: 'Enterprise-grade security',
      features: [
        'Secure authentication',
        'Data encryption',
        'Role-based access control',
        'Privacy protection',
        'Secure cloud storage',
        'Regular security updates'
      ]
    }
  ];

  const platforms = [
    {
      id: 'doctor-platform',
      title: 'For Doctors',
      icon: 'person-add',
      color: '#6B46C1',
      description: 'Complete practice management solution',
      highlights: [
        'Patient management',
        'Session tracking',
        'Income management',
        'Media storage',
        'Analytics dashboard'
      ]
    },
    {
      id: 'clinic-platform',
      title: 'For Clinics',
      icon: 'business',
      color: '#10B981',
      description: 'Multi-doctor clinic management',
      highlights: [
        'Multi-doctor support',
        'Centralized management',
        'Team analytics',
        'Clinic-wide insights',
        'Administrative tools'
      ]
    },
    {
      id: 'patient-platform',
      title: 'For Patients',
      icon: 'accessibility',
      color: '#3B82F6',
      description: 'Patient self-service portal',
      highlights: [
        'View medical records',
        'Session history',
        'Media gallery',
        'Progress tracking',
        'Easy access'
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#5B21B6" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="business" size={24} color="#6B46C1" />
          </View>
          <Text style={styles.headerTitle}>Products & Features</Text>
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
            <Ionicons name="cube" size={64} color="#6B46C1" />
          </View>
          <Text style={styles.heroTitle}>ClinTrack Platform</Text>
          <Text style={styles.heroSubtitle}>
            Your complete healthcare management solution
          </Text>
          <Text style={styles.heroDescription}>
            ClinTrack provides a comprehensive platform for doctors, clinics, and patients to manage healthcare operations efficiently and securely.
          </Text>
        </View>

        {/* Platforms Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Platforms</Text>
          <Text style={styles.sectionSubtitle}>Designed for different healthcare needs</Text>
          
          {platforms.map((platform) => (
            <View key={platform.id} style={styles.platformCard}>
              <View style={[styles.platformIconContainer, { backgroundColor: `${platform.color}15` }]}>
                <Ionicons name={platform.icon} size={32} color={platform.color} />
              </View>
              <View style={styles.platformContent}>
                <Text style={styles.platformTitle}>{platform.title}</Text>
                <Text style={styles.platformDescription}>{platform.description}</Text>
                <View style={styles.highlightsContainer}>
                  {platform.highlights.map((highlight, index) => (
                    <View key={index} style={styles.highlightItem}>
                      <Ionicons name="checkmark-circle" size={16} color={platform.color} />
                      <Text style={styles.highlightText}>{highlight}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <Text style={styles.sectionSubtitle}>Everything you need to manage healthcare operations</Text>
          
          {features.map((feature) => (
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
          <Text style={styles.sectionTitle}>Why Choose ClinTrack?</Text>
          <View style={styles.benefitsGrid}>
            <View style={styles.benefitCard}>
              <Ionicons name="flash" size={32} color="#F59E0B" />
              <Text style={styles.benefitTitle}>Fast & Efficient</Text>
              <Text style={styles.benefitText}>Streamlined workflows for better productivity</Text>
            </View>
            <View style={styles.benefitCard}>
              <Ionicons name="shield-checkmark" size={32} color="#10B981" />
              <Text style={styles.benefitTitle}>Secure & Private</Text>
              <Text style={styles.benefitText}>Enterprise-grade security for your data</Text>
            </View>
            <View style={styles.benefitCard}>
              <Ionicons name="cloud" size={32} color="#3B82F6" />
              <Text style={styles.benefitTitle}>Cloud Storage</Text>
              <Text style={styles.benefitText}>Secure cloud storage for all your files</Text>
            </View>
            <View style={styles.benefitCard}>
              <Ionicons name="phone-portrait" size={32} color="#8B5CF6" />
              <Text style={styles.benefitTitle}>Mobile First</Text>
              <Text style={styles.benefitText}>Access everything from your mobile device</Text>
            </View>
            <View style={styles.benefitCard}>
              <Ionicons name="analytics" size={32} color="#EC4899" />
              <Text style={styles.benefitTitle}>Smart Analytics</Text>
              <Text style={styles.benefitText}>Data-driven insights for better decisions</Text>
            </View>
            <View style={styles.benefitCard}>
              <Ionicons name="headset" size={32} color="#EF4444" />
              <Text style={styles.benefitTitle}>24/7 Support</Text>
              <Text style={styles.benefitText}>Round-the-clock customer support</Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
          <Text style={styles.ctaText}>Join thousands of healthcare professionals using ClinTrack</Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={handleBack}
          >
            <Text style={styles.ctaButtonText}>Get Started Now</Text>
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
  platformCard: {
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
  platformIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  platformContent: {
    flex: 1,
  },
  platformTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  platformDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 6,
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
    textAlign: 'left',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'left',
  },
  featureList: {
    gap: 12,
    width: '100%',
  },
  featureListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'flex-start',
  },
  featureListText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    lineHeight: 20,
    textAlign: 'left',
    flex: 1,
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

