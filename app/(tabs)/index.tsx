import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Modal, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthService from '../../services/authService';
import PatientAuthService from '../../services/patientAuthService';
import ClinicOwnerAuthService from '../../services/clinicOwnerAuthService';
import SupportContactForm from '../../components/SupportContactForm';

export default function HomeScreen() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // Check for existing sessions on app startup
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      // Check all three user types
      const [doctorAuth, patientAuth, clinicOwnerAuth] = await Promise.all([
        AuthService.isAuthenticated(),
        PatientAuthService.isAuthenticated(),
        ClinicOwnerAuthService.isAuthenticated(),
      ]);

      // Redirect to appropriate dashboard if user is already logged in
      if (doctorAuth) {
        router.replace('/doctor-dashboard');
        return;
      }
      if (patientAuth) {
        router.replace('/patient-dashboard');
        return;
      }
      if (clinicOwnerAuth) {
        router.replace('/clinic-owner-dashboard');
        return;
      }

      // No user is logged in, show home screen
      setCheckingAuth(false);
    } catch (error) {
      console.error('Error checking existing session:', error);
      // On error, show home screen anyway
      setCheckingAuth(false);
    }
  };

  const handleRoleSelection = (role: string) => {
    if (role === 'doctor') {
      // Navigate to login screen for doctors
      router.push('/login');
    } else if (role === 'patient') {
      // Navigate to patient login screen
      router.push('/patient-login');
    } else if (role === 'clinic-owner') {
      // Navigate to clinic owner login screen
      router.push('/clinic-owner-login');
    }
  };

  const handleMenuPress = () => {
    setSidebarVisible(true);
  };

  const handleCloseSidebar = () => {
    setSidebarVisible(false);
  };

  const handleLoginRegister = () => {
    setSidebarVisible(false);
    // Stay on homepage to allow role selection first
    // Users can then select their role and proceed to login
  };

  const handlePricingPress = () => {
    setSidebarVisible(false);
    router.push('/pricing');
  };

  // Show loading screen while checking authentication
  if (checkingAuth) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#6B46C1" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#6B46C1" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="business" size={24} color="#6B46C1" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.appName}>ClinTrack</Text>
            <Text style={styles.appSubtitle}>Complete healthcare ecosystem</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>ClinTrack</Text>
          <Text style={styles.subtitle}>Your Complete healthcare Hub</Text>
        </View>

        <View style={styles.roleSection}>
          <Text style={styles.roleTitle}>Choose Your Role</Text>
          
          {/* Doctor Card */}
          <TouchableOpacity 
            style={styles.roleCard} 
            onPress={() => handleRoleSelection('doctor')}
          >
            <View style={styles.roleIcon}>
              <Ionicons name="person-add" size={32} color="#F59E0B" />
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleName}>Doctor</Text>
              <Text style={styles.roleDescription}>Manage patients & sessions</Text>
            </View>
          </TouchableOpacity>

          {/* Patient Card */}
          <TouchableOpacity 
            style={styles.roleCard} 
            onPress={() => handleRoleSelection('patient')}
          >
            <View style={styles.roleIcon}>
              <Ionicons name="accessibility" size={32} color="#3B82F6" />
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleName}>Patient</Text>
              <Text style={styles.roleDescription}>View your progress & sessions</Text>
            </View>
          </TouchableOpacity>

          {/* Clinic Owner Card */}
          <TouchableOpacity 
            style={styles.roleCard} 
            onPress={() => handleRoleSelection('clinic-owner')}
          >
            <View style={styles.roleIcon}>
              <Ionicons name="business" size={32} color="#EF4444" />
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleName}>Clinic Owner</Text>
              <Text style={styles.roleDescription}>Manage doctors & clinic data</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sidebar */}
      {sidebarVisible && (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity 
            style={styles.sidebarBackdrop} 
            activeOpacity={1} 
            onPress={handleCloseSidebar}
          />
          <View style={styles.sidebar}>
            {/* Sidebar Header */}
            <View style={[styles.sidebarHeader, { paddingTop: insets.top + 20 }]}>
              <View style={styles.sidebarLogoContainer}>
                <View style={styles.sidebarLogo}>
                  <Ionicons name="business" size={24} color="#6B46C1" />
                </View>
                <View style={styles.sidebarHeaderText}>
                  <Text style={styles.sidebarAppName}>ClinTrack</Text>
                  <Text style={styles.sidebarAppSubtitle}>Complete healthcare ecosystem</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleCloseSidebar} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="home" size={24} color="#8B4513" />
                <Text style={styles.menuItemText}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="cube" size={24} color="#8B4513" />
                <Text style={styles.menuItemText}>Products</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="wallet" size={24} color="#F59E0B" />
                <Text style={styles.menuItemText}>Finance</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handlePricingPress}>
                <Ionicons name="pricetag" size={24} color="#3B82F6" />
                <Text style={styles.menuItemText}>Pricing</Text>
              </TouchableOpacity>

              {/* Login/Register Button */}
              <TouchableOpacity style={styles.loginRegisterButton} onPress={handleLoginRegister}>
                <Ionicons name="person" size={20} color="white" />
                <Text style={styles.loginRegisterText}>Login/Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Floating Support Button */}
      <TouchableOpacity
        style={styles.supportButton}
        onPress={() => setSupportModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#6B46C1" />
      </TouchableOpacity>

      {/* Support Contact Form Modal */}
      <SupportContactForm
        visible={supportModalVisible}
        onClose={() => setSupportModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6B46C1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#5B21B6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 45,
    height: 45,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerText: {
    flexDirection: 'column',
  },
  appName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    color: 'white',
    fontSize: 13,
    opacity: 0.9,
    marginTop: 2,
  },
  menuButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  mainTitle: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  roleSection: {
    width: '100%',
    alignItems: 'center',
  },
  roleTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 30,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    width: '100%',
    maxWidth: 350,
  },
  roleIcon: {
    marginRight: 16,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleDescription: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  // Sidebar Styles
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 1000,
    elevation: 1000,
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sidebar: {
    width: Dimensions.get('window').width * 0.75,
    height: '100%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    justifyContent: 'flex-start',
    marginLeft: 'auto',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#5B21B6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 80,
  },
  sidebarLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarLogo: {
    width: 45,
    height: 45,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidebarHeaderText: {
    flexDirection: 'column',
  },
  sidebarAppName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sidebarAppSubtitle: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
  },
  closeButton: {
    padding: 8,
  },
  menuItems: {
    paddingHorizontal: 20,
    paddingTop: 30,
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuItemText: {
    color: '#374151',
    fontSize: 16,
    marginLeft: 15,
  },
  loginRegisterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B46C1',
    marginTop: 20,
    marginHorizontal: 0,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    minHeight: 50,
    shadowColor: '#6B46C1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginRegisterText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
    opacity: 0.9,
  },
  supportButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 1000,
  },
});
