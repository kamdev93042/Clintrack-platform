import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Modal, TextInput, Alert, Image, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import ClinicOwnerPatientService from '../services/clinicOwnerPatientService';
import ClinicOwnerAuthService from '../services/clinicOwnerAuthService';
import ClinicOwnerSessionService from '../services/clinicOwnerSessionService';
import MediaService from '../services/mediaService';

export default function ClinicOwnerPatientProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  
  // Get screen dimensions for responsive gallery (with state for dynamic updates)
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });
    
    return () => subscription?.remove();
  }, []);
  
  // Calculate gallery item size for mobile (3 items per row)
  const getGalleryItemSize = () => {
    const screenWidth = dimensions.width;
    if (Platform.OS === 'web') {
      return (screenWidth - 20) / 3;
    }
    // For mobile: 3 items per row with proper spacing
    // Account for padding (8px on each side = 16px total) and margins (2px between items = 4px total for 2 gaps)
    const availableWidth = screenWidth - 16 - 4; // 16px padding, 4px margins
    return Math.floor(availableWidth / 3);
  };
  
  const galleryItemSize = getGalleryItemSize();
  
  // Patient data state
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  
  // Add New Session Modal State
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [sessionDate, setSessionDate] = useState('');
  const [duration, setDuration] = useState('45');
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [painLevel, setPainLevel] = useState('');
  const [showPainLevelModal, setShowPainLevelModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Field-level error states
  const [sessionErrors, setSessionErrors] = useState<{[key: string]: string}>({});
  
  // Media state
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<any[]>([]);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [viewingMedia, setViewingMedia] = useState<any[]>([]);
  const [viewingMediaWithType, setViewingMediaWithType] = useState<{ url: string; type: 'photo' | 'video' }[]>([]);
  const [viewingMediaType, setViewingMediaType] = useState<'photos' | 'videos' | 'mixed'>('photos');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [playingVideos, setPlayingVideos] = useState<{ [key: number]: boolean }>({});
  const videoRefs = useRef<{ [key: number]: Video | null }>({});
  const mediaScrollViewRef = useRef<ScrollView>(null);
  const isScrollingProgrammatically = useRef(false);
  
  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Helper function to format date as dd-mm-yyyy
  const formatDate = (date: Date): string => {
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  };
  
  // Helper function to get days in month
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  // Helper function to get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  // Helper function to generate calendar days
  const getCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };
  
  // Handle date selection
  const handleDateSelect = (day: number) => {
    if (day === null) return;
    
    const selected = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    setSelectedDate(selected);
    
    const formattedDate = formatDate(selected);
    setSessionDate(formattedDate);
    setShowDatePicker(false);
    clearSessionError('sessionDate');
    
    // Reset selection
    setSelectedDate(null);
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCalendarMonth(newDate);
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCalendarMonth(newDate);
  };
  
  // Open date picker
  const openDatePicker = () => {
    setCalendarMonth(new Date());
    setSelectedDate(null);
    setShowDatePicker(true);
  };
  
  // Load patient data on component mount
  useEffect(() => {
    if (id) {
      initializeAuth();
    }
  }, [id]);

  // Ensure ScrollView scrolls to correct position when modal first opens
  useEffect(() => {
    if (showMediaViewer && viewingMedia.length > 0 && mediaScrollViewRef.current) {
      // Only scroll to position 0 when modal first opens
      const screenWidth = Dimensions.get('window').width;
      setTimeout(() => {
        if (mediaScrollViewRef.current) {
          mediaScrollViewRef.current.scrollTo({
            x: 0,
            animated: false,
          });
        }
      }, 100);
    }
  }, [showMediaViewer]);

  const initializeAuth = async () => {
    try {
      await ClinicOwnerAuthService.initializeAuth();
      await loadPatient();
      await loadSessions();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setLoading(false);
    }
  };

  const loadPatient = async () => {
    try {
      setLoading(true);
      const result = await ClinicOwnerPatientService.getPatientDetails(id);
      
      if (result.success) {
        setPatient(result.data.patient);
      } else {
        Alert.alert('Error', result.message);
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load patient details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    if (!id) return;
    
    try {
      setLoadingSessions(true);
      const result = await ClinicOwnerSessionService.getSessionsByPatient(id, { limit: 50 });
      
      if (result.success) {
        const sessionsData = result.data.sessions || [];
        console.log('📋 Loaded sessions:', sessionsData.length);
        // Log media info for each session
        sessionsData.forEach((session: any, index: number) => {
          const photosCount = session.media?.photos?.length || 0;
          const videosCount = session.media?.videos?.length || 0;
          console.log(`  Session ${index + 1}: ${photosCount} photos, ${videosCount} videos`);
        });
        setSessions(sessionsData);
      } else {
        console.error('Failed to load sessions:', result.message);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };
  
  const handleBack = () => {
    router.back();
  };

  const handleHomePress = () => {
    router.push('/clinic-owner-dashboard');
  };

  const handlePatientsPress = () => {
    router.push('/clinic-owner-dashboard');
  };

  const handleDoctorsPress = () => {
    router.push('/clinic-owner-doctors');
  };

  const handleProfilePress = () => {
    router.push('/clinic-owner-profile');
  };

  const handleAddNewSession = () => {
    // Set today's date as default
    const today = new Date();
    setCalendarMonth(today);
    setSelectedDate(today);
    setSessionDate(formatDate(today));
    setShowAddSessionModal(true);
  };

  const handleCloseAddSession = () => {
    setShowAddSessionModal(false);
    // Reset form
    setSessionDate('');
    setDuration('45');
    setTreatmentNotes('');
    setProgressNotes('');
    setPainLevel('');
    setSelectedPhotos([]);
    setSelectedVideos([]);
    // Clear errors
    setSessionErrors({});
  };
  
  // Validation functions
  const validateDuration = (durationStr: string): string => {
    if (!durationStr) return 'Duration is required';
    const duration = parseInt(durationStr);
    if (isNaN(duration)) return 'Duration must be a number';
    if (duration < 1) return 'Duration must be at least 1 minute';
    if (duration > 600) return 'Duration cannot exceed 600 minutes';
    return '';
  };

  // Clear error for a specific field
  const clearSessionError = (fieldName: string) => {
    setSessionErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  // Handle backend validation errors
  const handleBackendSessionErrors = (error: any) => {
    const newErrors: {[key: string]: string} = {};
    
    // Check if error has validation errors array
    if (error?.errors && Array.isArray(error.errors)) {
      error.errors.forEach((err: any) => {
        const field = err.path || err.param || err.field;
        const message = err.msg || err.message || 'Invalid value';
        
        // Map backend field names to frontend field names
        const fieldMap: {[key: string]: string} = {
          'sessionDate': 'sessionDate',
          'durationMinutes': 'duration',
          'duration': 'duration',
          'treatmentNotes': 'treatmentNotes',
          'progressNotes': 'progressNotes',
        };
        
        const frontendField = fieldMap[field] || field;
        newErrors[frontendField] = message;
      });
    } else if (error?.message) {
      // If single error message, try to extract field name
      const message = error.message.toLowerCase();
      if (message.includes('date') || message.includes('session date')) {
        newErrors.sessionDate = error.message;
      } else if (message.includes('duration')) {
        newErrors.duration = error.message;
      } else if (message.includes('treatment')) {
        newErrors.treatmentNotes = error.message;
      } else if (message.includes('progress')) {
        newErrors.progressNotes = error.message;
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setSessionErrors(newErrors);
    }
  };

  const handleSaveSession = async () => {
    // Clear previous errors
    setSessionErrors({});
    
    // Validate required fields
    const newErrors: {[key: string]: string} = {};
    
    if (!sessionDate) {
      newErrors.sessionDate = 'Session date is required';
    }
    
    const durationError = validateDuration(duration);
    if (durationError) newErrors.duration = durationError;
    
    if (!treatmentNotes.trim()) {
      newErrors.treatmentNotes = 'Treatment notes are required';
    }
    
    if (!progressNotes.trim()) {
      newErrors.progressNotes = 'Progress notes are required';
    }
    
    // If there are validation errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setSessionErrors(newErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      // Convert date from DD-MM-YYYY to ISO format
      let formattedSessionDate;
      if (sessionDate) {
        const [day, month, year] = sessionDate.split('-');
        formattedSessionDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
      } else {
        formattedSessionDate = new Date().toISOString();
      }

      const sessionData: any = {
        sessionDate: formattedSessionDate,
        durationMinutes: parseInt(duration),
        treatmentNotes: treatmentNotes,
        progressNotes: progressNotes,
      };

      // Optional fields
      if (painLevel) {
        sessionData.painLevel = parseInt(painLevel);
      }
      if (patient?.sessionFee) {
        sessionData.feeCharged = patient.sessionFee;
      }

      // Prepare files for upload
      const files: { photos: any[]; videos: any[] } = {
        photos: selectedPhotos,
        videos: selectedVideos,
      };

      const result = await ClinicOwnerSessionService.createSession(id, sessionData, files as any);
      
      if (result.success) {
        console.log('✅ Session created successfully:', result.session);
        // Log media info from created session
        if (result.session?.media) {
          const photosCount = result.session.media.photos?.length || 0;
          const videosCount = result.session.media.videos?.length || 0;
          console.log(`📸 Created session has ${photosCount} photos and ${videosCount} videos`);
        }
        Alert.alert('Success', 'Session has been saved successfully.');
        handleCloseAddSession();
        
        // Reload patient data and sessions to update counts
        await loadPatient();
        await loadSessions();
      } else {
        // Handle backend validation errors
        if (result.message) {
          handleBackendSessionErrors({ message: result.message });
        } else {
          Alert.alert('Error', result.message || 'Failed to save session. Please try again.');
        }
      }
    } catch (error: any) {
      // Handle API errors
      if (error?.response?.data) {
        handleBackendSessionErrors(error.response.data);
      } else if (error?.message) {
        handleBackendSessionErrors({ message: error.message });
      } else {
        Alert.alert('Error', 'Failed to save session. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickPhotos = async () => {
    try {
      console.log('🖼️ handlePickPhotos called');
      
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need permission to access your photos.');
        return;
      }

      // Open image picker directly
      // Handle both MediaType (new) and MediaTypeOptions (deprecated) for compatibility
      let mediaTypes: any;
      if ((ImagePicker as any).MediaType) {
        mediaTypes = (ImagePicker as any).MediaType.Images;
      } else if ((ImagePicker as any).MediaTypeOptions) {
        mediaTypes = (ImagePicker as any).MediaTypeOptions.Images;
      } else {
        // Fallback for web or other platforms - use string literal
        mediaTypes = 'images';
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypes,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: 0, // 0 means no limit, allows multiple selection
      });

      console.log('📸 Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const images = result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: asset.type || 'image',
          name: `photo_${Date.now()}_${index}.jpg`,
          width: asset.width,
          height: asset.height,
        }));
        
        console.log('✅ Selected images:', images.length);
        setSelectedPhotos(prev => [...prev, ...images]);
      } else {
        console.log('❌ User canceled image selection');
      }
    } catch (error) {
      console.error('❌ Error picking photos:', error);
      Alert.alert('Error', 'Failed to pick photos. Please try again.');
    }
  };

  const handlePickVideos = async () => {
    try {
      console.log('🎥 handlePickVideos called');
      
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need permission to access your videos.');
        return;
      }

      // Open video picker directly
      // Handle both MediaType (new) and MediaTypeOptions (deprecated) for compatibility
      let mediaTypes: any;
      if ((ImagePicker as any).MediaType) {
        mediaTypes = (ImagePicker as any).MediaType.Videos;
      } else if ((ImagePicker as any).MediaTypeOptions) {
        mediaTypes = (ImagePicker as any).MediaTypeOptions.Videos;
      } else {
        // Fallback for web or other platforms - use string literal
        mediaTypes = 'videos';
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypes,
        allowsEditing: false,
        quality: 1,
        selectionLimit: 0, // 0 means no limit, allows multiple selection
      });

      console.log('📹 Video picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videos = result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: asset.type || 'video',
          name: `video_${Date.now()}_${index}.mp4`,
          duration: asset.duration,
          width: asset.width,
          height: asset.height,
        }));
        
        console.log('✅ Selected videos:', videos.length);
        setSelectedVideos(prev => [...prev, ...videos]);
      } else {
        console.log('❌ User canceled video selection');
      }
    } catch (error) {
      console.error('❌ Error picking videos:', error);
      Alert.alert('Error', 'Failed to pick videos. Please try again.');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = (index: number) => {
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleViewMedia = (mediaUrls: string[], startIndex: number = 0, type: 'photos' | 'videos' = 'photos') => {
    setViewingMedia(mediaUrls);
    setViewingMediaType(type);
    setCurrentMediaIndex(startIndex);
    setShowMediaViewer(true);
  };

  const handleViewSessionMedia = (session: any) => {
    // Combine photos and videos for viewing
    const allMedia: { url: string; type: 'photo' | 'video' }[] = [];
    
    // Check both photoUrls (from formatted session) and media.photos (from raw session)
    const photoUrls = session.photoUrls || session.media?.photos || [];
    const videoUrls = session.videoUrls || session.media?.videos || [];
    
    if (photoUrls && Array.isArray(photoUrls) && photoUrls.length > 0) {
      photoUrls.forEach((url: string) => {
        if (url && typeof url === 'string') {
          allMedia.push({ url, type: 'photo' });
        }
      });
    }
    
    if (videoUrls && Array.isArray(videoUrls) && videoUrls.length > 0) {
      videoUrls.forEach((url: string) => {
        if (url && typeof url === 'string') {
          allMedia.push({ url, type: 'video' });
        }
      });
    }
    
    console.log('📸 Viewing media:', {
      photoUrls: photoUrls,
      videoUrls: videoUrls,
      allMediaCount: allMedia.length
    });
    
    if (allMedia.length > 0) {
      setViewingMediaWithType(allMedia);
      setViewingMedia(allMedia.map(m => m.url));
      setViewingMediaType('mixed');
      setCurrentMediaIndex(0);
      setShowMediaGallery(true);
    } else {
      Alert.alert('No Media', 'No photos or videos found for this session.');
    }
  };

  const handleOpenMediaViewer = (index: number) => {
    setCurrentMediaIndex(index);
    setShowMediaViewer(true);
    setShowMediaGallery(false);
    
    // Scroll to selected item when modal opens
    setTimeout(() => {
      const screenWidth = Dimensions.get('window').width;
      mediaScrollViewRef.current?.scrollTo({
        x: index * screenWidth,
        animated: false,
      });
    }, 100);
  };

  const handleCloseMediaViewer = () => {
    // Pause all videos
    Object.values(videoRefs.current).forEach((ref) => {
      if (ref) {
        ref.pauseAsync();
      }
    });
    setPlayingVideos({});
    videoRefs.current = {};
    setShowMediaViewer(false);
    setShowMediaGallery(true); // Go back to gallery
  };

  const handlePreviousMedia = () => {
    if (currentMediaIndex > 0) {
      const newIndex = currentMediaIndex - 1;
      const screenWidth = Dimensions.get('window').width;
      const scrollX = newIndex * screenWidth;
      
      console.log('◀️ Previous media:', { currentIndex: currentMediaIndex, newIndex, scrollX, screenWidth });
      
      // Pause current video if playing
      if (videoRefs.current[currentMediaIndex]) {
        videoRefs.current[currentMediaIndex]?.pauseAsync();
        setPlayingVideos(prev => ({ ...prev, [currentMediaIndex]: false }));
      }
      
      // Set flag to prevent onScroll from updating during programmatic scroll
      isScrollingProgrammatically.current = true;
      
      // Update index first
      setCurrentMediaIndex(newIndex);
      
      // Scroll to previous item with animation
      if (mediaScrollViewRef.current) {
        mediaScrollViewRef.current.scrollTo({
          x: scrollX,
          animated: true,
        });
        
        // Reset flag after scroll completes
        setTimeout(() => {
          isScrollingProgrammatically.current = false;
        }, 300);
      } else {
        isScrollingProgrammatically.current = false;
      }
    }
  };

  const handleNextMedia = () => {
    if (currentMediaIndex < viewingMedia.length - 1) {
      const newIndex = currentMediaIndex + 1;
      const screenWidth = Dimensions.get('window').width;
      const scrollX = newIndex * screenWidth;
      
      console.log('▶️ Next media:', { currentIndex: currentMediaIndex, newIndex, scrollX, screenWidth });
      
      // Pause current video if playing
      if (videoRefs.current[currentMediaIndex]) {
        videoRefs.current[currentMediaIndex]?.pauseAsync();
        setPlayingVideos(prev => ({ ...prev, [currentMediaIndex]: false }));
      }
      
      // Set flag to prevent onScroll from updating during programmatic scroll
      isScrollingProgrammatically.current = true;
      
      // Update index first
      setCurrentMediaIndex(newIndex);
      
      // Scroll to next item with animation
      if (mediaScrollViewRef.current) {
        mediaScrollViewRef.current.scrollTo({
          x: scrollX,
          animated: true,
        });
        
        // Reset flag after scroll completes
        setTimeout(() => {
          isScrollingProgrammatically.current = false;
        }, 300);
      } else {
        isScrollingProgrammatically.current = false;
      }
    }
  };


  const painLevels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

  const handlePainLevelSelect = (level: string) => {
    setPainLevel(level);
    setShowPainLevelModal(false);
  };





  // Format session data for display
  const formatSessionsForDisplay = (sessions: any[]) => {
    // Sort sessions by date (most recent first)
    const sortedSessions = [...sessions].sort((a, b) => {
      const dateA = new Date(a.sessionDate).getTime();
      const dateB = new Date(b.sessionDate).getTime();
      return dateB - dateA; // Descending order (newest first)
    });

    return sortedSessions.map((session: any, index: number) => {
      const sessionDate = new Date(session.sessionDate);
      const today = new Date();
      const diffTime = today.getTime() - sessionDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let dateLabel = 'Today';
      if (diffDays === 1) {
        dateLabel = 'Yesterday';
      } else if (diffDays > 1 && diffDays <= 7) {
        dateLabel = `${diffDays} days ago`;
      } else {
        dateLabel = sessionDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }

      // Handle both old format (numbers) and new format (arrays of URLs)
      const photos = session.media?.photos;
      const videos = session.media?.videos;
      const photosCount = Array.isArray(photos) ? photos.length : (photos || 0);
      const videosCount = Array.isArray(videos) ? videos.length : (videos || 0);
      const photoUrls = Array.isArray(photos) ? photos : [];
      const videoUrls = Array.isArray(videos) ? videos : [];

      // Debug logging for media
      if (photosCount > 0 || videosCount > 0) {
        console.log(`📸 Session ${sortedSessions.length - index} media:`, {
          photosCount,
          videosCount,
          photoUrls: photoUrls.length,
          videoUrls: videoUrls.length,
          hasMedia: !!session.media
        });
      }

      return {
        id: session._id || session.id,
        sessionNumber: sortedSessions.length - index,
        date: dateLabel,
        treatment: session.treatmentNotes,
        progress: session.progressNotes,
        duration: `${session.durationMinutes || 'N/A'} minutes`,
        status: 'Completed',
        photos: photosCount,
        videos: videosCount,
        photoUrls: photoUrls,
        videoUrls: videoUrls,
        painLevel: session.painLevel,
        fee: session.feeCharged,
        nextAppointment: session.nextAppointment
      };
    });
  };

  const sessionHistory = formatSessionsForDisplay(sessions);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading patient details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Patient not found</Text>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#6B46C1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{patient.name} - Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Patient Information */}
        <View style={styles.patientInfoSection}>
          <View style={styles.patientInfoRow}>
            <View style={styles.patientInfoColumn}>
              <Text style={styles.patientInfoLabel}>Age: {patient.age}</Text>
              <Text style={styles.patientInfoLabel}>Phone: +91 {patient.phoneNumber.slice(0, 5)} {patient.phoneNumber.slice(5)}</Text>
              <Text style={styles.patientInfoLabel}>Start Date: {new Date(patient.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            </View>
            <View style={styles.patientInfoColumn}>
              <Text style={styles.patientInfoLabel}>Gender: {patient.gender}</Text>
              <Text style={styles.patientInfoLabel}>Condition: {patient.medicalCondition}</Text>
              <Text style={styles.patientInfoLabel}>Session Fee: ₹{patient.sessionFee}</Text>
            </View>
          </View>
          {patient.email && (
            <View style={styles.patientInfoRow}>
              <Text style={styles.patientInfoLabel}>Email: {patient.email}</Text>
            </View>
          )}
          {patient.additionalNotes && (
            <View style={styles.patientInfoRow}>
              <Text style={styles.patientInfoLabel}>Notes: {patient.additionalNotes}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsSection}>
          <TouchableOpacity style={styles.addSessionButton} onPress={handleAddNewSession}>
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.addSessionButtonText}>Add New Session</Text>
          </TouchableOpacity>
        </View>

        {/* Session Statistics */}
        <View style={styles.sessionStatsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{patient.totalSessions}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>₹{patient.totalAmountPaid}</Text>
            <Text style={styles.statLabel}>Total Paid</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {patient.lastSessionDate ? new Date(patient.lastSessionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Last Session</Text>
          </View>
        </View>

        {/* Session History */}
        <View style={styles.sessionHistorySection}>
          <View style={styles.sessionHistoryHeader}>
            <Ionicons name="bar-chart" size={20} color="#6B46C1" />
            <Text style={styles.sessionHistoryTitle}>Session History</Text>
          </View>
          
          {patient.totalSessions === 0 ? (
            <View style={styles.emptySessionsContainer}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptySessionsText}>No sessions recorded yet</Text>
              <Text style={styles.emptySessionsSubtext}>Add your first session to start tracking progress</Text>
            </View>
          ) : (
            sessionHistory.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionCardHeader}>
                <Text style={styles.sessionTitle}>
                  Session #{session.sessionNumber} - {session.date}
                </Text>
                <View style={styles.completedTag}>
                  <Text style={styles.completedTagText}>{session.status}</Text>
                </View>
              </View>
              
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionDetailLabel}>Treatment: {session.treatment}</Text>
                <Text style={styles.sessionDetailLabel}>Progress: {session.progress}</Text>
                <Text style={styles.sessionDetailLabel}>Duration: {session.duration}</Text>
              </View>
              
              {(session.photos > 0 || session.videos > 0) && (
                <View style={styles.mediaButtons}>
                  {(session.photos > 0 || session.videos > 0) && (
                    <TouchableOpacity 
                      style={styles.viewMediaButton}
                      onPress={() => handleViewSessionMedia(session)}
                    >
                      <Ionicons name="images" size={16} color="white" />
                      <Text style={styles.mediaButtonText}>
                        {session.photos > 0 && `${session.photos} Photo${session.photos > 1 ? 's' : ''}`}
                        {session.photos > 0 && session.videos > 0 && ' • '}
                        {session.videos > 0 && `${session.videos} Video${session.videos > 1 ? 's' : ''}`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            ))
          )}
        </View>
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
        <TouchableOpacity style={styles.navItem} onPress={handleDoctorsPress}>
          <Ionicons name="medical" size={24} color="#6B7280" />
          <Text style={styles.navText}>Doctors</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfilePress}>
          <Ionicons name="person" size={24} color="#6B7280" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Add New Session Modal */}
      <Modal
        visible={showAddSessionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseAddSession}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addSessionModal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Session</Text>
              <TouchableOpacity onPress={handleCloseAddSession} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Session Date */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Session Date</Text>
                <TouchableOpacity 
                  style={[styles.dateInputContainer, sessionErrors.sessionDate && styles.inputError]}
                  onPress={() => {
                    openDatePicker();
                    clearSessionError('sessionDate');
                  }}
                >
                  <TextInput
                    style={styles.dateInput}
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor="#9CA3AF"
                    value={sessionDate}
                    editable={false}
                  />
                  <Ionicons name="calendar" size={20} color="#6B7280" />
                </TouchableOpacity>
                {sessionErrors.sessionDate && <Text style={styles.fieldErrorText}>{sessionErrors.sessionDate}</Text>}
              </View>

              {/* Duration */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Duration (minutes)</Text>
                <TextInput
                  style={[styles.input, sessionErrors.duration && styles.inputError]}
                  placeholder="45"
                  placeholderTextColor="#9CA3AF"
                  value={duration}
                  onChangeText={(text) => {
                    setDuration(text);
                    clearSessionError('duration');
                  }}
                  keyboardType="numeric"
                />
                {sessionErrors.duration && <Text style={styles.fieldErrorText}>{sessionErrors.duration}</Text>}
              </View>

              {/* Treatment Notes */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Treatment Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea, sessionErrors.treatmentNotes && styles.inputError]}
                  placeholder="Describe treatments given, exercises performed..."
                  placeholderTextColor="#9CA3AF"
                  value={treatmentNotes}
                  onChangeText={(text) => {
                    setTreatmentNotes(text);
                    clearSessionError('treatmentNotes');
                  }}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {sessionErrors.treatmentNotes && <Text style={styles.fieldErrorText}>{sessionErrors.treatmentNotes}</Text>}
              </View>

              {/* Progress Notes */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Progress Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea, sessionErrors.progressNotes && styles.inputError]}
                  placeholder="Patient's progress, improvements, pain levels..."
                  placeholderTextColor="#9CA3AF"
                  value={progressNotes}
                  onChangeText={(text) => {
                    setProgressNotes(text);
                    clearSessionError('progressNotes');
                  }}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {sessionErrors.progressNotes && <Text style={styles.fieldErrorText}>{sessionErrors.progressNotes}</Text>}
              </View>

              {/* Session Photos */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Session Photos (Optional)</Text>
                <TouchableOpacity style={styles.uploadArea} onPress={handlePickPhotos}>
                  <Ionicons name="camera" size={32} color="#6B7280" />
                  <Text style={styles.uploadText}>Tap to add photos</Text>
                </TouchableOpacity>
                {selectedPhotos.length > 0 && (
                  <View style={styles.mediaPreviewContainer}>
                    <Text style={styles.mediaPreviewLabel}>{selectedPhotos.length} photo(s) selected</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewScroll}>
                      {selectedPhotos.map((photo, index) => (
                        <View key={index} style={styles.mediaPreviewItem}>
                          <Image source={{ uri: photo.uri }} style={styles.mediaPreviewImage} />
                          <TouchableOpacity 
                            style={styles.removeMediaButton}
                            onPress={() => handleRemovePhoto(index)}
                          >
                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Session Videos */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Session Videos (Optional)</Text>
                <TouchableOpacity style={styles.uploadArea} onPress={handlePickVideos}>
                  <Ionicons name="videocam" size={32} color="#6B7280" />
                  <Text style={styles.uploadText}>Tap to add videos</Text>
                </TouchableOpacity>
                {selectedVideos.length > 0 && (
                  <View style={styles.mediaPreviewContainer}>
                    <Text style={styles.mediaPreviewLabel}>{selectedVideos.length} video(s) selected</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewScroll}>
                      {selectedVideos.map((video, index) => (
                        <View key={index} style={styles.mediaPreviewItem}>
                          <View style={styles.videoPreviewContainer}>
                            <Ionicons name="videocam" size={32} color="#6B7280" />
                            <Text style={styles.videoPreviewText}>Video {index + 1}</Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.removeMediaButton}
                            onPress={() => handleRemoveVideo(index)}
                          >
                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Pain Level */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Pain Level (1-10)</Text>
                <TouchableOpacity 
                  style={styles.dropdownContainer}
                  onPress={() => setShowPainLevelModal(true)}
                >
                  <Text style={[styles.dropdownText, painLevel ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder]}>
                    {painLevel || "Select"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.saveButton, submitting && styles.saveButtonDisabled]} 
                  onPress={handleSaveSession}
                  disabled={submitting}
                >
                  <Text style={styles.saveButtonText}>
                    {submitting ? 'Saving Session...' : 'Save Session'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleCloseAddSession}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Pain Level Modal */}
      <Modal
        visible={showPainLevelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPainLevelModal(false)}
      >
        <View style={styles.painLevelModalOverlay}>
          <View style={styles.painLevelModal}>
            <View style={styles.painLevelModalHeader}>
              <Text style={styles.painLevelModalTitle}>Select Pain Level</Text>
              <TouchableOpacity onPress={() => setShowPainLevelModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.painLevelModalContent}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={styles.painLevelOption}
                  onPress={() => {
                    setPainLevel(level.toString());
                    setShowPainLevelModal(false);
                  }}
                >
                  <Text style={styles.painLevelOptionText}>{level}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Media Gallery Modal */}
      <Modal
        visible={showMediaGallery}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowMediaGallery(false)}
      >
        <SafeAreaView style={styles.galleryContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          {/* Gallery Header */}
          <View style={styles.galleryHeader}>
            <TouchableOpacity 
              style={styles.galleryBackButton}
              onPress={() => setShowMediaGallery(false)}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.galleryTitle}>Media Gallery</Text>
            <View style={styles.galleryHeaderSpacer} />
          </View>
          
          {/* Gallery Grid */}
          <ScrollView style={styles.galleryScrollView} contentContainerStyle={styles.galleryGrid}>
            {viewingMediaWithType.map((media, index) => {
              const isVideo = media.type === 'video';
              return (
                <TouchableOpacity
                  key={`gallery-${index}-${media.url.substring(0, 20)}`}
                  style={[
                    styles.galleryItem,
                    {
                      width: galleryItemSize,
                      height: galleryItemSize,
                    }
                  ]}
                  onPress={() => {
                    console.log('📸 Gallery item tapped:', index);
                    handleOpenMediaViewer(index);
                  }}
                  activeOpacity={0.7}
                >
                  {isVideo ? (
                    <View style={styles.galleryVideoContainer}>
                      <Video
                        source={{ uri: media.url }}
                        style={styles.galleryVideoThumbnail}
                        resizeMode={ResizeMode.COVER}
                        useNativeControls={false}
                        shouldPlay={false}
                        isMuted={true}
                      />
                      <View style={styles.galleryVideoOverlay}>
                        <Ionicons name="play-circle" size={40} color="white" />
                      </View>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: media.url }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Media Viewer Modal */}
      <Modal
        visible={showMediaViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseMediaViewer}
      >
        <View style={styles.mediaViewerOverlay}>
          {/* Header with Counter and Close Button */}
          <View style={styles.mediaViewerHeaderContainer}>
            <View style={styles.mediaViewerCounter}>
              <Text style={styles.mediaViewerCounterText}>
                {currentMediaIndex + 1} / {viewingMedia.length}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.mediaViewerCloseButton}
              onPress={handleCloseMediaViewer}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Media Content - Centered and Smaller */}
          {viewingMedia.length > 0 && (
            <View style={styles.mediaViewerContent}>
              {/* Left Navigation Button */}
              {currentMediaIndex > 0 && (
                <TouchableOpacity 
                  style={styles.mediaNavButtonLeft}
                  onPress={handlePreviousMedia}
                >
                  <Ionicons name="chevron-back" size={32} color="white" />
                </TouchableOpacity>
              )}
              
              {/* Right Navigation Button */}
              {currentMediaIndex < viewingMedia.length - 1 && (
                <TouchableOpacity 
                  style={styles.mediaNavButtonRight}
                  onPress={handleNextMedia}
                >
                  <Ionicons name="chevron-forward" size={32} color="white" />
                </TouchableOpacity>
              )}
              
              <ScrollView
                ref={mediaScrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                style={{ flex: 1 }}
                contentContainerStyle={{ 
                  flexDirection: 'row',
                }}
                onScroll={(e) => {
                  // Ignore scroll events during programmatic scrolling
                  if (isScrollingProgrammatically.current) {
                    return;
                  }
                  
                  const offsetX = e.nativeEvent.contentOffset.x;
                  const screenWidth = Dimensions.get('window').width;
                  const newIndex = Math.round(offsetX / screenWidth);
                  
                  // Only update if index actually changed
                  if (newIndex !== currentMediaIndex && newIndex >= 0 && newIndex < viewingMedia.length) {
                    const prevIndex = currentMediaIndex;
                    setCurrentMediaIndex(newIndex);
                    
                    // Pause previous video when scrolling
                    if (prevIndex !== newIndex && videoRefs.current[prevIndex]) {
                      videoRefs.current[prevIndex]?.pauseAsync();
                      setPlayingVideos(prev => ({ ...prev, [prevIndex]: false }));
                    }
                  }
                }}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                  // Reset flag when user finishes scrolling manually
                  isScrollingProgrammatically.current = false;
                  
                  const offsetX = e.nativeEvent.contentOffset.x;
                  const screenWidth = Dimensions.get('window').width;
                  const index = Math.round(offsetX / screenWidth);
                  
                  if (index >= 0 && index < viewingMedia.length && index !== currentMediaIndex) {
                    const prevIndex = currentMediaIndex;
                    setCurrentMediaIndex(index);
                    
                    // Pause previous video when scrolling
                    if (prevIndex !== index && videoRefs.current[prevIndex]) {
                      videoRefs.current[prevIndex]?.pauseAsync();
                      setPlayingVideos(prev => ({ ...prev, [prevIndex]: false }));
                    }
                  }
                }}
              >
                {viewingMedia.map((url, index) => {
                  if (!url || typeof url !== 'string') {
                    return null;
                  }
                  
                  const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') || 
                                  url.includes('.mkv') || url.includes('.webm') || url.includes('video');
                  const isPlaying = playingVideos[index] || false;
                  
                  return (
                    <View 
                      key={`media-${index}-${url.substring(0, 20)}`} 
                      style={styles.mediaViewerItem}
                    >
                      {isVideo ? (
                        <View style={styles.videoViewerContainer}>
                          <Video
                            ref={(ref) => {
                              videoRefs.current[index] = ref;
                            }}
                            source={{ uri: url }}
                            style={styles.videoPlayer}
                            useNativeControls={false}
                            resizeMode={ResizeMode.CONTAIN}
                            shouldPlay={isPlaying && index === currentMediaIndex}
                            isLooping={false}
                            volume={1.0}
                            isMuted={false}
                            onError={(error: any) => {
                              console.error('Video playback error:', error);
                              console.error('Video URL:', url);
                              const errorMsg = error?.message || error || 'Unknown error';
                              Alert.alert('Error', `Failed to play video: ${errorMsg}`);
                            }}
                            onLoad={() => {
                              console.log('✅ Video loaded successfully:', url.substring(0, 50) + '...');
                            }}
                            onPlaybackStatusUpdate={(status) => {
                              if (status.isLoaded) {
                                if (status.didJustFinish) {
                                  setPlayingVideos(prev => ({ ...prev, [index]: false }));
                                }
                                if (status.isPlaying && !playingVideos[index]) {
                                  setPlayingVideos(prev => ({ ...prev, [index]: true }));
                                }
                                if (!status.isPlaying && playingVideos[index] && !status.didJustFinish) {
                                  // Video was paused manually
                                  setPlayingVideos(prev => ({ ...prev, [index]: false }));
                                }
                              }
                            }}
                          />
                          
                          {/* Tap overlay for pause/play */}
                          <TouchableOpacity 
                            style={styles.videoTapOverlay}
                            activeOpacity={1}
                            onPress={async () => {
                              console.log('📺 Video screen tapped, isPlaying:', isPlaying);
                              try {
                                const videoRef = videoRefs.current[index];
                                if (!videoRef) {
                                  console.error('❌ Video ref not found');
                                  return;
                                }
                                
                                if (isPlaying) {
                                  // If playing, pause it
                                  console.log('⏸️ Pausing video', index);
                                  await videoRef.pauseAsync();
                                  setPlayingVideos(prev => ({ ...prev, [index]: false }));
                                } else {
                                  // If paused, play it
                                  console.log('▶️ Playing video', index);
                                  await videoRef.setVolumeAsync(1.0);
                                  await videoRef.playAsync();
                                  setPlayingVideos(prev => ({ ...prev, [index]: true }));
                                }
                              } catch (error) {
                                console.error('❌ Error toggling video playback:', error);
                              }
                            }}
                          >
                            {!isPlaying && (
                              <View style={styles.videoPlayButtonOverlay}>
                                <Ionicons name="play-circle" size={60} color="white" />
                              </View>
                            )}
                          </TouchableOpacity>
                          
                          {/* Custom controls when playing */}
                          {isPlaying && (
                            <View style={styles.videoControlsOverlay}>
                              <TouchableOpacity 
                                style={styles.videoPauseButton}
                                onPress={async () => {
                                  console.log('⏸️ Pause button pressed');
                                  try {
                                    const videoRef = videoRefs.current[index];
                                    if (videoRef) {
                                      await videoRef.pauseAsync();
                                      setPlayingVideos(prev => ({ ...prev, [index]: false }));
                                    }
                                  } catch (error) {
                                    console.error('❌ Error pausing video:', error);
                                  }
                                }}
                              >
                                <Ionicons name="pause-circle" size={50} color="white" />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      ) : (
                        <View style={styles.imageViewerContainer}>
                          <Image 
                            source={{ uri: url }} 
                            style={styles.mediaViewerImage}
                            resizeMode="contain"
                            onError={(error) => {
                              console.error('Image load error:', error);
                              console.error('Image URL:', url);
                            }}
                            onLoad={() => {
                              console.log('✅ Image loaded successfully:', url.substring(0, 50) + '...');
                            }}
                          />
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
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
              <Text style={styles.dateModalTitle}>Select Session Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerContent}>
              {/* Calendar Header - Month Navigation */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNavButton}>
                  <Ionicons name="chevron-back" size={24} color="#6B46C1" />
                </TouchableOpacity>
                <Text style={styles.calendarMonthText}>
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavButton}>
                  <Ionicons name="chevron-forward" size={24} color="#6B46C1" />
                </TouchableOpacity>
              </View>
              
              {/* Calendar Weekday Headers */}
              <View style={styles.calendarWeekdays}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} style={styles.calendarWeekday}>{day}</Text>
                ))}
              </View>
              
              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {getCalendarDays().map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      day === null && styles.calendarDayEmpty,
                      day !== null && selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === calendarMonth.getMonth() && styles.calendarDaySelected,
                      day !== null && day === new Date().getDate() && calendarMonth.getMonth() === new Date().getMonth() && calendarMonth.getFullYear() === new Date().getFullYear() && styles.calendarDayToday
                    ]}
                    onPress={() => day !== null && handleDateSelect(day)}
                    disabled={day === null}
                  >
                    {day !== null && (
                      <Text style={[
                        styles.calendarDayText,
                        day === new Date().getDate() && calendarMonth.getMonth() === new Date().getMonth() && calendarMonth.getFullYear() === new Date().getFullYear() && styles.calendarDayTextToday,
                        selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === calendarMonth.getMonth() && styles.calendarDayTextSelected
                      ]}>
                        {day}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
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
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  patientInfoSection: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  patientInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  patientInfoColumn: {
    flex: 1,
  },
  patientInfoLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  actionButtonsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  addSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B46C1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  addSessionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionHistorySection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sessionHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  sessionHistoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B46C1',
    flex: 1,
  },
  completedTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionDetails: {
    gap: 4,
  },
  sessionDetailLabel: {
    fontSize: 14,
    color: '#374151',
  },
  mediaButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  viewMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B46C1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  mediaButtonText: {
    color: 'white',
    fontSize: 12,
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
  // Add New Session Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  addSessionModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: 600,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
    color: '#374151',
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  fieldErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  dropdownText: {
    fontSize: 16,
    color: '#374151',
  },
  dropdownTextSelected: {
    color: '#374151',
  },
  dropdownTextPlaceholder: {
    color: '#9CA3AF',
  },
  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  // Pain Level Modal Styles
  painLevelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  painLevelModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 20,
    maxHeight: '60%',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  painLevelModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  painLevelModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  painLevelModalContent: {
    maxHeight: 300,
  },
  painLevelOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  painLevelOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  painLevelItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  painLevelItemSelected: {
    backgroundColor: '#EBF4FF',
  },
  painLevelItemText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  painLevelItemTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
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
    maxHeight: '60%',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
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
  todayButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  todayButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Calendar Styles
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  calendarWeekday: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 2,
  },
  calendarDayEmpty: {
    opacity: 0,
  },
  calendarDayToday: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  calendarDaySelected: {
    backgroundColor: '#6B46C1',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  calendarDayTextToday: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  calendarDayTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  dateOptionButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateOptionText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  // Loading and Error States
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '600',
  },
  // Session Statistics
  sessionStatsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B46C1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Empty Sessions
  emptySessionsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptySessionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySessionsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Button States
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  // Media Preview Styles
  mediaPreviewContainer: {
    marginTop: 12,
  },
  mediaPreviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  mediaPreviewScroll: {
    flexDirection: 'row',
  },
  mediaPreviewItem: {
    marginRight: 12,
    position: 'relative',
  },
  mediaPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  videoPreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreviewText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  removeMediaButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  // Media Viewer Styles
  mediaViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaViewerHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  mediaViewerCloseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaViewerCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mediaViewerCounterText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  mediaViewerContainer: {
    flex: 1,
    width: '100%',
  },
  mediaViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  mediaViewerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  mediaViewerContent: {
    flex: 1,
    width: '100%',
  },
  mediaViewerItem: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexShrink: 0,
    flexGrow: 0,
    position: 'relative',
  },
  imageViewerContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    alignSelf: 'center',
  },
  mediaViewerImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    resizeMode: 'contain',
  },
  videoViewerContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    position: 'relative',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  mediaNavButtonLeft: {
    position: 'absolute',
    left: 20,
    top: '50%',
    transform: [{ translateY: -25 }],
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mediaNavButtonRight: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -25 }],
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  videoTapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  videoPlayButtonOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
    padding: 10,
  },
  videoControlsOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  videoPauseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    padding: 10,
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
  },
  videoViewerText: {
    fontSize: 16,
    color: 'white',
    marginTop: 12,
  },
  videoViewerUrl: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  mediaViewerEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaViewerEmptyText: {
    fontSize: 16,
    color: 'white',
  },
  // Gallery Styles
  galleryContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.OS === 'web' ? 16 : 20,
    paddingVertical: Platform.OS === 'web' ? 12 : 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  galleryBackButton: {
    padding: 8,
    borderRadius: 20,
  },
  galleryTitle: {
    fontSize: Platform.OS === 'web' ? 18 : 20,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  galleryHeaderSpacer: {
    width: 40,
  },
  galleryScrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Platform.OS === 'web' ? 2 : 8,
    justifyContent: 'flex-start',
    paddingBottom: Platform.OS === 'web' ? 2 : 20, // Extra bottom padding on mobile
  },
  galleryItem: {
    margin: Platform.OS === 'web' ? 2 : 2,
    borderRadius: Platform.OS === 'web' ? 4 : 6,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryVideoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#000000',
  },
  galleryVideoThumbnail: {
    width: '100%',
    height: '100%',
  },
  galleryVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});