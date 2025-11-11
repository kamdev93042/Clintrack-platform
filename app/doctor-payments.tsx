import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaymentService from '../services/paymentService';
import AuthService from '../services/authService';

const MARKED_PAID_STORAGE_KEY = 'clintrack_marked_paid_patients';

export default function DoctorPaymentsScreen() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalDue: 0,
    overduePatientsCount: 0,
    collected: 0,
    collectionRate: 0
  });
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const recentlyMarkedPaidRef = useRef<Set<string>>(new Set());

  // Load marked paid patients from storage on mount
  useEffect(() => {
    loadMarkedPaidPatients();
    initializeAuth();
  }, []);

  const loadMarkedPaidPatients = async () => {
    try {
      const stored = await AsyncStorage.getItem(MARKED_PAID_STORAGE_KEY);
      if (stored) {
        const patientIds = JSON.parse(stored);
        recentlyMarkedPaidRef.current = new Set(patientIds);
        console.log('✅ Loaded marked paid patients from storage:', patientIds.length);
      }
    } catch (error) {
      console.error('Error loading marked paid patients:', error);
    }
  };

  const saveMarkedPaidPatients = async () => {
    try {
      const patientIds = Array.from(recentlyMarkedPaidRef.current);
      await AsyncStorage.setItem(MARKED_PAID_STORAGE_KEY, JSON.stringify(patientIds));
      console.log('✅ Saved marked paid patients to storage:', patientIds.length);
    } catch (error) {
      console.error('Error saving marked paid patients:', error);
    }
  };

  // Reload data when screen comes into focus (refresh when navigating back to this screen)
  // Note: This will refresh data when user navigates back to this screen
  useFocusEffect(
    useCallback(() => {
      // Skip initial load - useEffect handles that
      if (!loading) {
        console.log('🔄 Payments screen focused - reloading marked paid patients and data...');
        // Reload marked paid patients from storage first
        loadMarkedPaidPatients();
        // Then reload payments data
        const timer = setTimeout(() => {
          loadPaymentsData(false); // Silent reload - no loading indicator
        }, 800); // Increased delay to ensure backend has saved
        return () => clearTimeout(timer);
      }
    }, [loading])
  );

  const initializeAuth = async () => {
    try {
      await AuthService.initializeAuth();
      await loadPaymentsData();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setLoading(false);
    }
  };

  const loadPaymentsData = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const result = await PaymentService.getPayments();
      
      console.log('Payments data result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        // Set statistics
        if (result.data.statistics) {
          console.log('Setting statistics:', result.data.statistics);
          setStatistics(result.data.statistics);
        } else {
          // Reset to defaults if no statistics
          console.log('No statistics found, using defaults');
          setStatistics({
            totalDue: 0,
            overduePatientsCount: 0,
            collected: 0,
            collectionRate: 0
          });
        }
        
        // Set pending payments - filter out recently marked paid patients PERMANENTLY
        if (result.data.pendingPayments && Array.isArray(result.data.pendingPayments)) {
          console.log('Setting pending payments:', result.data.pendingPayments.length);
          console.log('Recently marked paid patients:', Array.from(recentlyMarkedPaidRef.current));
          
          // Filter out patients that were recently marked as paid
          const filtered = result.data.pendingPayments.filter((p: any) => {
            const patientIdStr = String(p.patientId);
            const isMarkedPaid = recentlyMarkedPaidRef.current.has(patientIdStr);
            
            if (isMarkedPaid) {
              console.log(`  - PERMANENTLY filtering out marked paid patient: ${patientIdStr} (${p.patientName})`);
              return false; // Never show this patient again
            }
            
            return true;
          });
          
          // After filtering, check if any marked paid patients are no longer in server response
          // Only remove from ref if patient is confirmed gone from backend for multiple reload cycles
          // For now, keep all marked paid patients in ref to prevent reappearing
          const markedPaidIds = Array.from(recentlyMarkedPaidRef.current);
          markedPaidIds.forEach((markedId) => {
            const stillInServer = result.data.pendingPayments.some((p: any) => String(p.patientId) === markedId);
            if (!stillInServer) {
              // Patient is confirmed removed from backend
              console.log(`✅ Patient ${markedId} confirmed removed from backend`);
              // Keep in ref for a long time to prevent any reappearing issues
              // Only remove after 2 minutes to be absolutely safe
              setTimeout(async () => {
                // Final check - only remove if patient is confirmed gone for 2 minutes
                recentlyMarkedPaidRef.current.delete(markedId);
                await saveMarkedPaidPatients(); // Update storage
                console.log(`🗑️ Removed patient ${markedId} from ref (2min after backend confirmed removal)`);
              }, 120000); // 2 minutes - keep in ref to prevent reappearing
            } else {
              console.log(`⚠️ Patient ${markedId} still in server response - keeping in ref permanently`);
            }
          });
          
          console.log(`Filtered pending payments: ${result.data.pendingPayments.length} → ${filtered.length}`);
          setPendingPayments(filtered);
        } else {
          console.log('No pending payments found or invalid format');
          setPendingPayments([]);
        }
      } else {
        console.error('Failed to load payments data:', result);
        // Don't show alert on initial load errors, just log
        if (!loading) {
          Alert.alert('Error', result.message || 'Failed to load payments data');
        }
      }
    } catch (error: any) {
      console.error('Error loading payments data:', error);
      if (!loading) {
        Alert.alert('Error', `Failed to load payments data: ${error?.message || 'Unknown error'}`);
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleHomePress = () => {
    // Navigate to dashboard - it will auto-refresh via useFocusEffect
    router.push('/doctor-dashboard');
  };

  const handlePatientsPress = () => {
    router.push('/doctor-patient');
  };

  const handleIncomePress = () => {
    router.push('/doctor-income');
  };

  const handlePaymentsPress = () => {
    // Already on payments screen
  };

  const handleProfilePress = () => {
    router.push('/doctor-profile');
  };

  // Format currency with Indian number format
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleSendReminder = async (patientId: string, patientName: string) => {
    Alert.alert(
      'Send Reminder',
      `Send payment reminder to ${patientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: async () => {
            try {
              const result = await PaymentService.sendPaymentReminder(patientId);
              if (result.success) {
                Alert.alert('Success', `Payment reminder sent to ${patientName}`);
              } else {
                Alert.alert('Error', result.message || 'Failed to send reminder');
              }
            } catch (error) {
              console.error('Error sending reminder:', error);
              Alert.alert('Error', 'Failed to send payment reminder');
            }
          }
        }
      ]
    );
  };

  const handleMarkPaid = async (patientId: string, patientName: string, amount: number) => {
    console.log('🔵 handleMarkPaid called with:', { patientId, patientName, amount });
    
    // Store original state in case user cancels
    const originalPendingPayments = [...pendingPayments];
    const originalStatistics = { ...statistics };
    
    // Optimistically remove patient from pending list IMMEDIATELY (before Alert)
    console.log('🔄 Removing patient from pending list optimistically (IMMEDIATE)...');
    setPendingPayments(prevPayments => {
      const patientIdStr = String(patientId);
      const filtered = prevPayments.filter(p => {
        const pIdStr = String(p.patientId);
        const shouldKeep = pIdStr !== patientIdStr;
        console.log(`  - Patient ${pIdStr} === ${patientIdStr}? ${pIdStr === patientIdStr}, keeping: ${shouldKeep}`);
        return shouldKeep;
      });
      console.log(`  - Before: ${prevPayments.length} payments, After: ${filtered.length} payments`);
      return filtered;
    });
    
    // Optimistically update statistics IMMEDIATELY (before Alert)
    console.log('🔄 Updating statistics optimistically (IMMEDIATE)...');
    setStatistics(prevStats => {
      const newTotalDue = Math.max(0, prevStats.totalDue - amount);
      const newCollected = prevStats.collected + amount;
      const totalAmount = newTotalDue + newCollected;
      const newCollectionRate = totalAmount > 0 
        ? Math.round((newCollected / totalAmount) * 100) 
        : 0;
      
      console.log(`  - Old totalDue: ${prevStats.totalDue}, New: ${newTotalDue}`);
      console.log(`  - Old collected: ${prevStats.collected}, New: ${newCollected}`);
      console.log(`  - New collection rate: ${newCollectionRate}%`);
      
      return {
        ...prevStats,
        totalDue: newTotalDue,
        collected: newCollected,
        collectionRate: newCollectionRate,
      };
    });
    
    // Show confirmation Alert AFTER optimistic update
    Alert.alert(
      'Mark as Paid',
      `Mark ${patientName}'s payment (${formatCurrency(amount)}) as received?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            console.log('❌ User cancelled - reverting optimistic update');
            // Revert optimistic updates
            setPendingPayments(originalPendingPayments);
            setStatistics(originalStatistics);
          }
        },
        { 
          text: 'Mark Paid', 
          onPress: async () => {
            console.log('✅ User confirmed mark paid - processing API call');
            
            try {
              console.log('=== MARK PAID API CALL START ===');
              console.log('Patient ID:', patientId);
              console.log('Patient Name:', patientName);
              console.log('Amount:', amount);
              
              // Mark all as paid (no amount specified means mark all)
              console.log('📡 Calling API to mark payment as paid...');
              const result = await PaymentService.markPaymentAsPaid(patientId);
              
              console.log('=== MARK PAID RESULT ===');
              console.log('Result:', JSON.stringify(result, null, 2));
              
              if (result && result.success) {
                console.log('✅ Payment marked successfully on server');
                console.log('Result data:', result.data);
                
                // Add to recently marked paid set to prevent it from reappearing PERMANENTLY
                recentlyMarkedPaidRef.current.add(String(patientId));
                await saveMarkedPaidPatients(); // Persist to storage
                console.log('✅ Added patient to recently marked paid set (PERMANENT):', String(patientId));
                
                // Wait a bit longer before reloading to ensure backend has fully processed
                setTimeout(() => {
                  // Silently reload data in background to get accurate server state
                  console.log('🔄 Reloading data in background to sync with server...');
                  loadPaymentsData(false).then(() => {
                    console.log('✅ Data reloaded successfully in background');
                    
                    // Verify if patient is still in server response
                    // We'll check this in the next reload cycle
                    // For now, keep patient in ref permanently to prevent reappearing
                    console.log('🔒 Patient will stay filtered until backend confirms removal');
                  }).catch(err => {
                    console.error('❌ Error reloading in background:', err);
                    // Keep optimistic update if reload fails - patient stays in ref
                  });
                }, 1000); // Wait 1 second before reloading to ensure backend processed
              } else {
                // Revert optimistic update on failure
                console.error('❌ Mark paid failed:', result);
                const errorMsg = result?.message || 'No pending payments found or failed to mark as paid';
                
                console.log('🔄 Reloading to revert optimistic update...');
                // Revert to original state
                setPendingPayments(originalPendingPayments);
                setStatistics(originalStatistics);
                
                // Also reload to get correct state
                loadPaymentsData(false).catch(err => {
                  console.error('Error reloading after failure:', err);
                });
                
                Alert.alert('Error', errorMsg);
              }
            } catch (error: any) {
              console.error('❌ Exception marking payment as paid:', error);
              console.error('Error details:', JSON.stringify(error, null, 2));
              console.error('Error stack:', error?.stack);
              
              // Revert optimistic update on error
              console.log('🔄 Reverting optimistic update after error...');
              setPendingPayments(originalPendingPayments);
              setStatistics(originalStatistics);
              
              // Also reload to get correct state
              loadPaymentsData(false).catch(err => {
                console.error('Error reloading after exception:', err);
              });
              
              Alert.alert(
                'Error', 
                `Failed to mark payment as paid: ${error?.response?.data?.message || error?.message || 'Unknown error'}`
              );
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#6B46C1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading payments data...</Text>
        </View>
      ) : (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Payment Statistics Cards */}
        <View style={styles.summaryContainer}>
          {/* Total Due */}
          <View style={styles.summaryCard}>
              <Text style={styles.summaryAmount}>{formatCurrency(statistics.totalDue)}</Text>
            <Text style={styles.summaryLabel}>Total Due</Text>
          </View>

          {/* Overdue Patients */}
          <View style={styles.summaryCard}>
              <Text style={styles.summaryAmount}>{statistics.overduePatientsCount}</Text>
            <Text style={styles.summaryLabel}>Overdue Patients</Text>
          </View>

          {/* Collected */}
          <View style={styles.summaryCard}>
              <Text style={styles.summaryAmount}>{formatCurrency(statistics.collected)}</Text>
            <Text style={styles.summaryLabel}>Collected</Text>
          </View>

          {/* Collection Rate */}
          <View style={styles.summaryCard}>
              <Text style={styles.summaryAmount}>{statistics.collectionRate}%</Text>
            <Text style={styles.summaryLabel}>Collection Rate</Text>
          </View>
        </View>

        {/* Pending Payments Section */}
        <View style={styles.pendingPaymentsSection}>
          <Text style={styles.sectionTitle}>Pending Payments</Text>
          
            {pendingPayments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No pending payments</Text>
                <Text style={styles.emptySubText}>All payments are up to date</Text>
              </View>
            ) : (
              pendingPayments.map((payment, index) => (
                <View key={`${payment.patientId}-${index}`} style={styles.paymentCard}>
              {/* Left colored section */}
              <View style={styles.paymentCardLeft}>
                <View style={styles.paymentCardStripe} />
              </View>
              
              {/* Right content section */}
              <View style={styles.paymentCardRight}>
                <View style={styles.paymentCardHeader}>
                  <Text style={styles.patientName}>{payment.patientName}</Text>
                      <Text style={styles.amountDue}>{formatCurrency(payment.amount)} Due</Text>
                </View>
                
                <Text style={styles.paymentDetails}>
                      {payment.status === 'Overdue' 
                        ? `Overdue by ${payment.overdueDays} days` 
                        : 'Pending payment'} • {payment.sessionsCompleted} sessions completed
                </Text>
                
                <View style={styles.actionsSection}>
                  <Text style={styles.actionsLabel}>Actions:</Text>
                  
                  <TouchableOpacity 
                    style={styles.sendReminderButton}
                        onPress={() => handleSendReminder(payment.patientId, payment.patientName)}
                  >
                    <Text style={styles.sendReminderButtonText}>Send Reminder</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.markPaidButton}
                    onPress={() => {
                      console.log('🔘 Mark Paid button pressed for:', {
                        patientId: payment.patientId,
                        patientName: payment.patientName,
                        amount: payment.amount
                      });
                      handleMarkPaid(String(payment.patientId), payment.patientName, payment.amount);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.markPaidButtonText}>Mark Paid</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
              ))
            )}
        </View>
      </ScrollView>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={handleHomePress}>
          <Ionicons name="home" size={24} color="#6B7280" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handlePatientsPress}>
          <Ionicons name="people" size={24} color="#6B7280" />
          <Text style={styles.navText}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleIncomePress}>
          <Ionicons name="wallet" size={24} color="#6B7280" />
          <Text style={styles.navText}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={handlePaymentsPress}>
          <Ionicons name="card" size={24} color="#3B82F6" />
          <Text style={[styles.navText, styles.navTextActive]}>Payments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfilePress}>
          <Ionicons name="person" size={24} color="#6B7280" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  pendingPaymentsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
  },
  paymentCardLeft: {
    width: 8,
    backgroundColor: '#FEF3C7',
    position: 'relative',
  },
  paymentCardStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#D97706',
  },
  paymentCardRight: {
    flex: 1,
    padding: 16,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  amountDue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
  },
  paymentDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  actionsSection: {
    gap: 8,
  },
  actionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  sendReminderButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  sendReminderButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  markPaidButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  markPaidButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  navText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  navTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
});
