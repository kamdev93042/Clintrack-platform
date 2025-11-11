import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Custom Doctor Icon Component
export const DoctorIcon = ({ size = 32, color = "#F59E0B" }) => (
  <View style={styles.iconContainer}>
    <Ionicons name="medical" size={size * 0.6} color={color} />
    <Ionicons name="person" size={size * 0.8} color={color} style={styles.personOverlay} />
  </View>
);

// Custom Patient Icon Component
export const PatientIcon = ({ size = 32, color = "#3B82F6" }) => (
  <View style={styles.iconContainer}>
    <Ionicons name="accessibility" size={size} color={color} />
  </View>
);

// Custom Clinic Owner Icon Component
export const ClinicOwnerIcon = ({ size = 32, color = "#EF4444" }) => (
  <View style={styles.iconContainer}>
    <Ionicons name="business" size={size} color={color} />
    <Ionicons name="medical" size={size * 0.4} color={color} style={styles.medicalOverlay} />
  </View>
);

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personOverlay: {
    position: 'absolute',
    top: -2,
  },
  medicalOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
});
