import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="doctor-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="doctor-profile" options={{ headerShown: false }} />
        <Stack.Screen name="patients" options={{ headerShown: false }} />
        <Stack.Screen name="doctor-patient" options={{ headerShown: false }} />
        <Stack.Screen name="doctor-patient-profile" options={{ headerShown: false }} />
        <Stack.Screen name="doctor-income" options={{ headerShown: false }} />
        <Stack.Screen name="doctor-payments" options={{ headerShown: false }} />
        <Stack.Screen name="patient-login" options={{ headerShown: false }} />
        <Stack.Screen name="patient-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="clinic-owner-login" options={{ headerShown: false }} />
        <Stack.Screen name="clinic-owner-signup" options={{ headerShown: false }} />
        <Stack.Screen name="clinic-owner-forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="clinic-owner-verify-otp" options={{ headerShown: false }} />
        <Stack.Screen name="clinic-owner-reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="clinic-owner-verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="clinic-owner-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="clinic-owner-profile" options={{ headerShown: false }} />
        <Stack.Screen name="clinic-owner-doctors" options={{ headerShown: false }} />
        <Stack.Screen name="clinic-owner-doctor-details" options={{ headerShown: false }} />
        <Stack.Screen name="clinic-owner-add-doctor" options={{ headerShown: false }} />
        <Stack.Screen name="clinic-owner-patient-profile" options={{ headerShown: false }} />
        <Stack.Screen name="pricing" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
