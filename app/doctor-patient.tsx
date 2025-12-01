import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PatientService from '../services/patientService';
import AuthService from '../services/authService';

export default function DoctorPatientScreen() {
  const insets = useSafeAreaInsets();
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [medicalCondition, setMedicalCondition] = useState('');
  const [sessionFee, setSessionFee] = useState('800');
  const [startDate, setStartDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // New state for API integration
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const genders = ['Male', 'Female', 'Other'];

  // Load patients on component mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await AuthService.initializeAuth();
      await loadPatients();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setLoading(false);
    }
  };

  const loadPatients = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const result = await PatientService.getPatients({
        page,
        limit: 10,
        search: search || undefined
      });
      
      if (result.success) {
        setPatients(result.data.patients);
        setCurrentPage(result.data.pagination.currentPage);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleHomePress = () => {
    router.push('/doctor-dashboard');
  };

  const handlePatientsPress = () => {
    // Already on patients screen
  };

  const handleIncomePress = () => {
    router.push('/doctor-income');
  };

  const handlePaymentsPress = () => {
    router.push('/doctor-payments');
  };

  const handleProfilePress = () => {
    router.push('/doctor-profile');
  };

  const handleAddPatient = () => {
    setShowAddPatientModal(true);
  };

  const handleCloseAddPatient = () => {
    setShowAddPatientModal(false);
    // Reset form
    setPatientName('');
    setAge('');
    setGender('');
    setPhoneNumber('');
    setEmail('');
    setMedicalCondition('');
    setSessionFee('800');
    setStartDate('');
    setAdditionalNotes('');
  };

  const handleSubmitPatient = async () => {
    if (!patientName || !age || !gender || !phoneNumber || !medicalCondition) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (phoneNumber.length !== 10) {
      Alert.alert('Error', 'Phone number must be exactly 10 digits.');
      return;
    }
    
    setSubmitting(true);
    try {
      // Convert DD-MM-YYYY format to ISO date format
      let formattedStartDate;
      if (startDate) {
        const [day, month, year] = startDate.split('-');
        formattedStartDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
      } else {
        formattedStartDate = new Date().toISOString();
      }

      const patientData = {
        name: patientName,
        age: parseInt(age),
        gender,
        phoneNumber,
        medicalCondition,
        sessionFee: parseFloat(sessionFee) || 800,
        startDate: formattedStartDate,
        additionalNotes: additionalNotes || undefined,
        email: email || undefined
      };

      const result = await PatientService.addPatient(patientData);
      
      if (result.success) {
        Alert.alert('Success', `${patientName} has been added to your patient list.`);
        handleCloseAddPatient();
        // Reload patients list
        await loadPatients();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add patient. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenderSelect = (selectedGender: string) => {
    setGender(selectedGender);
    setShowGenderModal(false);
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    setStartDate(`${day.toString().padStart(2, '0')}-${(currentMonth + 1).toString().padStart(2, '0')}-${currentYear}`);
    setShowDatePicker(false);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setStartDate(`${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`);
    setShowDatePicker(false);
  };

  const handleClearDate = () => {
    setStartDate('');
    setShowDatePicker(false);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  const handlePatientPress = (patientId: string) => {
    router.push(`/doctor-patient-profile?id=${patientId}`);
  };

  const handleToggleStatus = async (patientId: string, currentStatus: string, e: any) => {
    // Prevent card press event
    e.stopPropagation();
    
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const result = await PatientService.updatePatient(patientId, { status: newStatus });
      
      if (result.success) {
        // Update local state
        setPatients(prevPatients => 
          prevPatients.map(patient => 
            patient._id === patientId 
              ? { ...patient, status: newStatus }
              : patient
          )
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update patient status. Please try again.');
    }
  };

  // Helper function to format patient data for display
  const formatPatientForDisplay = (patient: any) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    const getStatusInfo = (status: string) => {
      switch (status) {
        case 'active':
          return { text: 'Active', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' };
        case 'inactive':
          return { text: 'Inactive', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
        case 'discharged':
          return { text: 'Discharged', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' };
        default:
          return { text: 'Active', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' };
      }
    };

    const statusInfo = getStatusInfo(patient.status);
    const lastSessionText = patient.lastSessionDate 
      ? `Last session: ${formatDate(patient.lastSessionDate)}`
      : 'No sessions yet';

    return {
      id: patient._id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: `+91 ${patient.phoneNumber.slice(0, 5)} ${patient.phoneNumber.slice(5)}`,
      condition: patient.medicalCondition,
      lastSession: lastSessionText,
      fee: `₹${patient.sessionFee}`,
      startDate: formatDate(patient.startDate),
      status: statusInfo.text,
      statusColor: statusInfo.bgColor,
      textColor: statusInfo.color,
      totalSessions: patient.totalSessions,
      totalAmountPaid: patient.totalAmountPaid
    };
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#6B46C1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patients</Text>
        <TouchableOpacity onPress={handleAddPatient} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Patients List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading patients...</Text>
          </View>
        ) : patients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No patients found</Text>
            <Text style={styles.emptySubtitle}>Add your first patient to get started</Text>
          </View>
        ) : (
          patients.map((patient) => {
            const formattedPatient = formatPatientForDisplay(patient);
            const isActive = patient.status === 'active';
            return (
              <TouchableOpacity 
                key={formattedPatient.id} 
                style={styles.patientCard}
                onPress={() => handlePatientPress(formattedPatient.id)}
              >
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{formattedPatient.name}</Text>
                  <Text style={styles.patientDetails}>
                    Age: {formattedPatient.age} • {formattedPatient.condition}
                  </Text>
                  <Text style={styles.sessionInfo}>
                    {formattedPatient.lastSession} • Fee: {formattedPatient.fee}
                  </Text>
                  <View style={styles.actionRow}>
                    <Ionicons name="hand-left" size={16} color="#F59E0B" />
                    <Text style={styles.actionText}>Tap to view details & add session</Text>
                  </View>
                </View>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>Active</Text>
                  <TouchableOpacity 
                    style={[
                      styles.toggleSwitch, 
                      isActive ? styles.toggleSwitchActive : styles.toggleSwitchInactive
                    ]}
                    onPress={(e) => handleToggleStatus(formattedPatient.id, patient.status, e)}
                    activeOpacity={0.7}
                  >
                    {/* Active: thumb on left, bars on right */}
                    {isActive ? (
                      <View style={styles.toggleSwitchInner}>
                        <View style={[styles.toggleThumb, styles.toggleThumbActiveMargin]}>
                          <Ionicons name="checkmark" size={14} color="#10B981" />
                        </View>
                        <View style={styles.toggleBarsContainerRight}>
                          <View style={[styles.toggleBar, styles.toggleBarActive]} />
                          <View style={[styles.toggleBar, styles.toggleBarActive]} />
                          <View style={[styles.toggleBar, styles.toggleBarActive]} />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.toggleSwitchInner}>
                        {/* Inactive: bars on left, thumb on right */}
                        <View style={styles.toggleBarsContainerLeft}>
                          <View style={styles.toggleBar} />
                          <View style={styles.toggleBar} />
                          <View style={styles.toggleBar} />
                        </View>
                        <View style={[styles.toggleThumb, styles.toggleThumbInactiveMargin]}>
                          <Ionicons name="close" size={14} color="#6B7280" />
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.toggleLabel}>Inactive</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={handleHomePress}>
          <Ionicons name="home" size={24} color="#6B7280" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} onPress={handlePatientsPress}>
          <Ionicons name="people" size={24} color="#3B82F6" />
          <Text style={[styles.navText, styles.navTextActive]}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleIncomePress}>
          <Ionicons name="wallet" size={24} color="#6B7280" />
          <Text style={styles.navText}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handlePaymentsPress}>
          <Ionicons name="card" size={24} color="#6B7280" />
          <Text style={styles.navText}>Payments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfilePress}>
          <Ionicons name="person" size={24} color="#6B7280" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Add Patient Modal */}
      <Modal
        visible={showAddPatientModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseAddPatient}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addPatientModal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Patient</Text>
              <TouchableOpacity onPress={handleCloseAddPatient} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.formContainer}>
                {/* Patient Name */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Patient Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter patient name"
                    placeholderTextColor="#9CA3AF"
                    value={patientName}
                    onChangeText={setPatientName}
                    autoCapitalize="words"
                  />
                </View>

                {/* Age and Gender Row */}
                <View style={styles.rowContainer}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Age</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Age"
                      placeholderTextColor="#9CA3AF"
                      value={age}
                      onChangeText={setAge}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputContainer, styles.halfWidth, styles.dropdownContainer]}>
                    <Text style={styles.inputLabel}>Gender</Text>
                    <TouchableOpacity 
                      style={styles.input}
                      onPress={() => setShowGenderModal(!showGenderModal)}
                    >
                      <Text style={[styles.inputText, gender ? styles.inputTextSelected : styles.inputTextPlaceholder]}>
                        {gender || "Select"}
                      </Text>
                      <Ionicons name={showGenderModal ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    
                  </View>
                </View>

                {/* Phone Number */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+91 XXXXX XXXXX"
                    placeholderTextColor="#9CA3AF"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="patient@email.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Medical Condition */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Medical Condition</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Lower Back Pain, Shoulder Injury"
                    placeholderTextColor="#9CA3AF"
                    value={medicalCondition}
                    onChangeText={setMedicalCondition}
                    autoCapitalize="words"
                  />
                </View>

                {/* Session Fee and Start Date Row */}
                <View style={styles.rowContainer}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.inputLabel}>Session Fee (₹)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="800"
                      placeholderTextColor="#9CA3AF"
                      value={sessionFee}
                      onChangeText={setSessionFee}
                      keyboardType="numeric"
                    />
                  </View>
        <View style={[styles.inputContainer, styles.halfWidth, styles.dropdownContainer]}>
          <Text style={styles.inputLabel}>Start Date</Text>
          <TouchableOpacity 
            style={styles.dateInputContainer}
            onPress={() => setShowDatePicker(!showDatePicker)}
          >
            <Text style={[styles.dateInput, startDate ? styles.dateInputSelected : styles.dateInputPlaceholder]}>
              {startDate || "dd-mm-yyyy"}
            </Text>
            <Ionicons name={showDatePicker ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
                  </View>
                </View>

                {/* Additional Notes */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Additional Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Any additional information about the patient..."
                    placeholderTextColor="#9CA3AF"
                    value={additionalNotes}
                    onChangeText={setAdditionalNotes}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.addButton, submitting && styles.addButtonDisabled]} 
                    onPress={handleSubmitPatient}
                    disabled={submitting}
                  >
                    <Text style={styles.addButtonText}>
                      {submitting ? 'Adding Patient...' : 'Add Patient'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={handleCloseAddPatient}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View style={styles.genderModalOverlay}>
          <View style={styles.genderModal}>
            <View style={styles.genderModalHeader}>
              <Text style={styles.genderModalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {genders.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.genderItem,
                  gender === item && styles.genderItemSelected
                ]}
                onPress={() => handleGenderSelect(item)}
              >
                <Text style={[
                  styles.genderItemText,
                  gender === item && styles.genderItemTextSelected
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModal}>
            <View style={styles.dateModalHeader}>
              <Text style={styles.dateModalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerContent}>
              {/* Calendar Header */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => handleMonthChange('prev')} style={styles.navButton}>
                  <Ionicons name="chevron-back" size={16} color="#6B46C1" />
                </TouchableOpacity>
                <Text style={styles.monthYearText}>
                  {getMonthName(currentMonth)}, {currentYear}
                </Text>
                <TouchableOpacity onPress={() => handleMonthChange('next')} style={styles.navButton}>
                  <Ionicons name="chevron-forward" size={16} color="#6B46C1" />
                </TouchableOpacity>
              </View>

              {/* Days of Week */}
              <View style={styles.daysOfWeek}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {(() => {
                  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
                  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
                  const days = [];
                  
                  // Previous month days
                  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                  const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);
                  
                  for (let i = firstDay - 1; i >= 0; i--) {
                    days.push(
                      <TouchableOpacity key={`prev-${i}`} style={styles.calendarDayDisabled}>
                        <Text style={styles.calendarDayTextDisabled}>
                          {daysInPrevMonth - i}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                  
                  // Current month days
                  for (let day = 1; day <= daysInMonth; day++) {
                    const isSelected = selectedDate.getDate() === day && 
                                     selectedDate.getMonth() === currentMonth && 
                                     selectedDate.getFullYear() === currentYear;
                    const isToday = new Date().getDate() === day && 
                                   new Date().getMonth() === currentMonth && 
                                   new Date().getFullYear() === currentYear;
                    
                    days.push(
                      <TouchableOpacity 
                        key={day} 
                        style={[
                          styles.calendarDay,
                          isSelected && styles.calendarDaySelected,
                          isToday && styles.calendarDayToday
                        ]}
                        onPress={() => handleDateSelect(day)}
                      >
                        <Text style={[
                          styles.calendarDayText,
                          isSelected && styles.calendarDayTextSelected,
                          isToday && !isSelected && styles.calendarDayTextToday
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                  
                  // Next month days
                  const remainingDays = 42 - days.length; // 6 rows * 7 days
                  for (let day = 1; day <= remainingDays; day++) {
                    days.push(
                      <TouchableOpacity key={`next-${day}`} style={styles.calendarDayDisabled}>
                        <Text style={styles.calendarDayTextDisabled}>{day}</Text>
                      </TouchableOpacity>
                    );
                  }
                  
                  return days;
                })()}
              </View>

              {/* Calendar Footer */}
              <View style={styles.calendarFooter}>
                <TouchableOpacity onPress={handleClearDate} style={styles.footerButton}>
                  <Text style={styles.footerButtonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleToday} style={styles.footerButton}>
                  <Text style={styles.footerButtonText}>Today</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>


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
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  patientInfo: {
    flex: 1,
    marginRight: 15,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
  },
  patientDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  sessionInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#3B82F6',
    marginLeft: 5,
    textDecorationLine: 'underline',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginHorizontal: 6,
  },
  toggleSwitch: {
    width: 52,
    height: 28,
    borderRadius: 14,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  toggleSwitchActive: {
    backgroundColor: '#10B981',
  },
  toggleSwitchInactive: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleSwitchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
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
  toggleThumbActiveMargin: {
    marginRight: 2,
  },
  toggleThumbInactiveMargin: {
    marginLeft: 2,
  },
  toggleBarsContainerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  toggleBarsContainerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  toggleBar: {
    width: 3,
    height: 10,
    backgroundColor: '#9CA3AF',
    borderRadius: 1.5,
    marginHorizontal: 1.5,
  },
  toggleBarActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPatientModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    width: '90%',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    maxHeight: 500,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    flex: 1,
  },
  inputTextSelected: {
    color: '#374151',
  },
  inputTextPlaceholder: {
    color: '#9CA3AF',
  },
  dateInputContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInput: {
    fontSize: 16,
    flex: 1,
  },
  dateInputSelected: {
    color: '#374151',
  },
  dateInputPlaceholder: {
    color: '#9CA3AF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#6B46C1',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B46C1',
    fontSize: 16,
    fontWeight: '600',
  },
  // Dropdown Container
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  // Gender Modal Styles
  genderModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    width: '80%',
    maxWidth: 300,
  },
  genderModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  genderModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  genderItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  genderItemSelected: {
    backgroundColor: '#6B46C1',
  },
  genderItemText: {
    fontSize: 16,
    color: '#374151',
  },
  genderItemTextSelected: {
    color: 'white',
  },
  // Date Picker Modal Styles
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    width: '90%',
    maxWidth: 350,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  datePickerContent: {
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navButton: {
    padding: 4,
  },
  monthYearText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  daysOfWeek: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayOfWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  calendarDay: {
    width: '14.28%',
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  calendarDaySelected: {
    backgroundColor: '#6B46C1',
    borderRadius: 16,
  },
  calendarDayToday: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  calendarDayDisabled: {
    width: '14.28%',
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  calendarDayText: {
    fontSize: 12,
    color: '#374151',
  },
  calendarDayTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  calendarDayTextToday: {
    color: '#6B46C1',
    fontWeight: 'bold',
  },
  calendarDayTextDisabled: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  footerButtonText: {
    fontSize: 12,
    color: '#6B46C1',
    fontWeight: '600',
  },
  // Loading and Empty States
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
});
