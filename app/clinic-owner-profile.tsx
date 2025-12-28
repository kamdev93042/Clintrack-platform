import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ClinicOwnerAuthService from '../services/clinicOwnerAuthService';
import ClinicOwnerService from '../services/clinicOwnerService';

export default function ClinicOwnerProfileScreen() {
  const insets = useSafeAreaInsets();
  const [clinicOwner, setClinicOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // First try to get from API
      const result = await ClinicOwnerService.getProfile();
      
      if (result.success && result.clinicOwner) {
        setClinicOwner(result.clinicOwner);
      } else {
        // Fallback to stored user
        const storedUser = await ClinicOwnerAuthService.getUser();
        if (storedUser) {
          setClinicOwner(storedUser);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to stored user
      const storedUser = await ClinicOwnerAuthService.getUser();
      if (storedUser) {
        setClinicOwner(storedUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    try {
      await ClinicOwnerAuthService.logout();
      router.replace('/');
    } catch (error) {
      // Even if logout fails, navigate to home page
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="business" size={60} color="white" />
            </View>
          </View>

          {/* Clinic Name and Owner Name */}
          {loading ? (
            <ActivityIndicator size="large" color="#6B46C1" />
          ) : (
            <>
              <Text style={styles.clinicName}>
                {clinicOwner?.clinicName || 'Not set'}
              </Text>
              <Text style={styles.ownerName}>
                {clinicOwner?.ownerName || 'Not set'}
              </Text>
            </>
          )}

          {/* Information Fields */}
          <View style={styles.fieldsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6B46C1" />
                <Text style={styles.loadingText}>Loading profile...</Text>
              </View>
            ) : (
              <>
                {/* Clinic Name */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Clinic Name</Text>
                  <View style={styles.fieldValue}>
                    <Text style={styles.fieldText}>
                      {clinicOwner?.clinicName || 'Not set'}
                    </Text>
                  </View>
                </View>

                {/* Owner Name */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Owner Name</Text>
                  <View style={styles.fieldValue}>
                    <Text style={styles.fieldText}>
                      {clinicOwner?.ownerName || 'Not set'}
                    </Text>
                  </View>
                </View>

                {/* Email Address */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  <View style={styles.fieldValue}>
                    <Text style={styles.fieldText}>
                      {clinicOwner?.email || 'Not set'}
                    </Text>
                  </View>
                </View>

                {/* Phone Number */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                  <View style={styles.fieldValue}>
                    <Text style={styles.fieldText}>
                      {clinicOwner?.phoneNumber || 'Not set'}
                    </Text>
                  </View>
                </View>

                {/* Address */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Clinic Address</Text>
                  <View style={[styles.fieldValue, styles.textAreaValue]}>
                    <Text style={styles.fieldText}>
                      {clinicOwner?.address || 'Not set'}
                    </Text>
                  </View>
                </View>

                {/* Pincode */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Pincode</Text>
                  <View style={styles.fieldValue}>
                    <Text style={styles.fieldText}>
                      {clinicOwner?.pinCode || clinicOwner?.pincode || 'Not set'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Settings Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Settings</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/notifications')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color="#F59E0B" />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/clinic-owner-subscription')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="card" size={24} color="#3B82F6" />
              <Text style={styles.settingText}>Subscription</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingLeft}>
              <Ionicons name="log-out" size={24} color="#8B4513" />
              <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
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
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4.65,
    elevation: 8,
  },
  clinicName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
    textAlign: 'center',
  },
  ownerName: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 30,
    textAlign: 'center',
  },
  fieldsContainer: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  fieldValue: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textAreaValue: {
    minHeight: 60,
    justifyContent: 'flex-start',
  },
  fieldText: {
    fontSize: 16,
    color: '#374151',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 15,
  },
  logoutText: {
    color: '#EF4444',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
});

