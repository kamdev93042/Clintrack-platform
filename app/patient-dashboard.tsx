import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, ActivityIndicator, Image, Linking, Modal, Dimensions, TouchableWithoutFeedback, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PatientAuthService from '../services/patientAuthService';
import SupportContactForm from '../components/SupportContactForm';


export default function PatientDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('overview');
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [videosLoading, setVideosLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const videoRef = useRef<Video>(null);
  const [videoStatus, setVideoStatus] = useState<any>({});
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showPlayPauseButton, setShowPlayPauseButton] = useState(false);
  const hideButtonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Load images when images tab is accessed
  useEffect(() => {
    if (activeTab === 'images' && images.length === 0 && !imagesLoading) {
      loadImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Load videos when videos tab is accessed
  useEffect(() => {
    if (activeTab === 'videos' && videos.length === 0 && !videosLoading) {
      loadVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Reset loading state when a new image is selected
  useEffect(() => {
    if (selectedImage) {
      setImageLoading(true);
    } else {
      setImageLoading(false);
    }
  }, [selectedImage]);

  // Reset video state when video modal closes/opens
  useEffect(() => {
    if (selectedVideo) {
      // When video opens, set to playing and hide button
      setIsVideoPlaying(true);
      setShowPlayPauseButton(false);
    } else {
      // When video closes, reset state
      setIsVideoPlaying(false);
      setShowPlayPauseButton(false);
      if (hideButtonTimeoutRef.current) {
        clearTimeout(hideButtonTimeoutRef.current);
      }
    }
  }, [selectedVideo]);

  const toggleVideoPlayPause = async () => {
    try {
      if (!videoRef.current) return;
      
      if (isVideoPlaying) {
        // Pause video and show pause button
        await videoRef.current.pauseAsync();
        setIsVideoPlaying(false);
        setShowPlayPauseButton(true);
      } else {
        // Play video and hide button immediately
        await videoRef.current.playAsync();
        setIsVideoPlaying(true);
        setShowPlayPauseButton(false);
      }
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  // Format time from seconds to MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current time and duration from video status
  const getVideoTime = () => {
    if (videoStatus.isLoaded) {
      const currentTime = videoStatus.positionMillis / 1000; // Convert to seconds
      const duration = videoStatus.durationMillis / 1000; // Convert to seconds
      return {
        current: formatTime(currentTime),
        total: formatTime(duration),
        currentSeconds: currentTime,
        totalSeconds: duration
      };
    }
    return {
      current: '00:00',
      total: '00:00',
      currentSeconds: 0,
      totalSeconds: 0
    };
  };

  const initializeAuth = async () => {
    try {
      await PatientAuthService.initializeAuth();
      await loadPatientData();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setLoading(false);
    }
  };

  const loadPatientData = async () => {
    try {
      // First try to get user from AsyncStorage (faster)
      const storedUser = await PatientAuthService.getUser();
      if (storedUser) {
        // If stored user has basic info, use it but also fetch full data
        setPatientData(storedUser);
        setLoading(false);
        
        // Fetch full patient data in background
        const result = await PatientAuthService.getCurrentPatient();
        if (result.success) {
          setPatientData(result.patient);
        }
        
        // Load media counts immediately so they show on dashboard
        loadMediaCounts();
        return;
      }
      
      // Fallback to API if no stored user
      const result = await PatientAuthService.getCurrentPatient();
      if (result.success) {
        setPatientData(result.patient);
      } else {
        Alert.alert('Error', result.message || 'Failed to load patient data');
      }
      
      // Load media counts immediately so they show on dashboard
      loadMediaCounts();
    } catch (error) {
      console.error('Failed to load patient data:', error);
      Alert.alert('Error', 'Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  // Load media counts (images and videos) for dashboard display
  const loadMediaCounts = async () => {
    try {
      // Load both images and videos in parallel to get counts
      const [imagesResult, videosResult] = await Promise.all([
        PatientAuthService.getPatientImages(),
        PatientAuthService.getPatientVideos()
      ]);
      
      if (imagesResult.success) {
        setImages(imagesResult.images || []);
      }
      
      if (videosResult.success) {
        setVideos(videosResult.videos || []);
      }
    } catch (error) {
      console.error('Failed to load media counts:', error);
      // Don't show alert for media count errors, just log them
    }
  };

  const loadImages = async () => {
    setImagesLoading(true);
    try {
      const result = await PatientAuthService.getPatientImages();
      if (result.success) {
        setImages(result.images || []);
      }
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setImagesLoading(false);
    }
  };

  const loadVideos = async () => {
    setVideosLoading(true);
    try {
      const result = await PatientAuthService.getPatientVideos();
      if (result.success) {
        setVideos(result.videos || []);
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setVideosLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('Logout button pressed');
    try {
      // Clear state first
      setPatientData(null);
      setImages([]);
      setVideos([]);
      
      // Clear local data and logout
      console.log('Starting logout process...');
      await PatientAuthService.logout();
      console.log('Patient auth service logout successful');
      
      // Navigate to homepage
      console.log('Navigating to homepage...');
      // Use replace to reset navigation stack
      router.replace('/(tabs)');
      console.log('Navigation command sent');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local data and redirect
      setPatientData(null);
      setImages([]);
      setVideos([]);
      try {
        await PatientAuthService.logout();
      } catch (e) {
        console.error('Error during cleanup:', e);
      }
      router.replace('/(tabs)');
    }
  };

  const renderOverview = () => {
    if (!patientData) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading patient data...</Text>
        </View>
      );
    }

    return (
      <View>
        {/* Patient Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={32} color="#6B46C1" />
            </View>
            <View style={styles.infoHeaderText}>
              <Text style={styles.patientName}>{patientData.name}</Text>
              <Text style={styles.patientSubtext}>Patient ID: {patientData.id?.substring(0, 8) || patientData._id?.substring(0, 8) || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.infoDivider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Mobile</Text>
              <Text style={styles.infoValue}>{patientData.phoneNumber || patientData.mobileNumber}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{patientData.age} years</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{patientData.gender}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="medical-outline" size={20} color="#6B7280" />
              <Text style={styles.infoLabel}>Doctor</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {patientData.doctor?.name || patientData.doctorName || 'N/A'}
              </Text>
            </View>
          </View>
          
          <View style={styles.doctorInfoCard}>
            <Ionicons name="medical" size={24} color="#6B46C1" />
            <View style={styles.doctorInfoText}>
              <Text style={styles.doctorName}>
                {patientData.doctor?.name || patientData.doctorName || 'Dr. Unknown'}
              </Text>
              <Text style={styles.doctorSpecialization}>
                {patientData.doctor?.specialization || patientData.doctorSpecialization || 'General Practitioner'}
              </Text>
            </View>
          </View>
        </View>

      {/* Media Section */}
      <View style={styles.mediaCard}>
        <View style={styles.mediaSectionHeader}>
          <Ionicons name="images-outline" size={22} color="#6B46C1" />
          <Text style={styles.mediaSectionTitle}>Media</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="videocam" size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>{videos.length}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="images" size={24} color="#EF4444" />
            <Text style={styles.statNumber}>{images.length}</Text>
            <Text style={styles.statLabel}>Images</Text>
          </View>
        </View>
      </View>
    </View>
    );
  };


  const renderVideos = () => {
    if (videosLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      );
    }

    if (videos.length === 0) {
      return (
        <View>
          <Text style={styles.sectionTitle}>Videos</Text>
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No videos available</Text>
            <Text style={styles.emptySubtext}>Videos uploaded by your doctor will appear here</Text>
          </View>
        </View>
      );
    }

    return (
      <View>
        <Text style={styles.sectionTitle}>Videos ({videos.length})</Text>
        {videos.map((video) => (
          <TouchableOpacity 
            key={video.id} 
            style={styles.contentCard}
            onPress={() => {
              if (video.url) {
                setSelectedVideo(video.url);
              }
            }}
          >
            <View style={styles.videoThumbnail}>
              <Ionicons name="play-circle" size={48} color="white" />
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.contentTitle}>{video.title}</Text>
              <View style={styles.videoMeta}>
                <Text style={styles.contentDate}>
                  {new Date(video.date).toLocaleDateString()}
                </Text>
                <Text style={styles.videoDuration}>{video.duration || 'N/A'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };


  const renderImages = () => {
    if (imagesLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading images...</Text>
        </View>
      );
    }

    if (images.length === 0) {
      return (
        <View>
          <Text style={styles.sectionTitle}>Medical Images</Text>
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No images available</Text>
            <Text style={styles.emptySubtext}>Images uploaded by your doctor will appear here</Text>
          </View>
        </View>
      );
    }

    return (
      <View>
        <Text style={styles.sectionTitle}>Medical Images ({images.length})</Text>
        <View style={styles.imagesGrid}>
          {images.map((image) => (
            <TouchableOpacity 
              key={image.id} 
              style={styles.imageCard}
            onPress={async () => {
              if (image.url) {
                console.log('Opening image:', image.url);
                setSelectedImage(image.url);
              }
            }}
            >
              {image.url ? (
                <Image 
                  source={{ uri: image.url }} 
                  style={styles.imageThumbnail}
                  resizeMode="cover"
                  onError={(error) => {
                    console.error('Thumbnail load error:', error.nativeEvent.error);
                    console.error('Failed URL:', image.url);
                  }}
                />
              ) : (
                <View style={styles.imageThumbnail}>
                  <Ionicons name="image" size={32} color="#9CA3AF" />
                </View>
              )}
              <Text style={styles.imageTitle} numberOfLines={1}>
                {image.title || 'Session Image'}
              </Text>
              <Text style={styles.imageDate}>
                {new Date(image.date).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6B46C1" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6B46C1" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="accessibility" size={20} color="#6B46C1" />
          </View>
          <Text style={styles.headerTitle}>Patient Portal</Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            console.log('TouchableOpacity pressed');
            handleLogout();
          }} 
          style={styles.logoutButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
              onPress={() => setActiveTab('videos')}
            >
              <Text style={[styles.tabText, activeTab === 'videos' && styles.tabTextActive]}>
                Videos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'images' && styles.tabActive]}
              onPress={() => setActiveTab('images')}
            >
              <Text style={[styles.tabText, activeTab === 'images' && styles.tabTextActive]}>
                Images
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'videos' && renderVideos()}
          {activeTab === 'images' && renderImages()}
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          {selectedImage && (
            <View style={styles.modalImageContainer}>
              <Image 
                source={{ uri: selectedImage }} 
                style={[styles.modalImage, imageLoading && styles.modalImageHidden]}
                resizeMode="contain"
                onError={(error) => {
                  console.error('Image load error:', error.nativeEvent?.error || error);
                  console.error('Failed to load URL:', selectedImage);
                  Alert.alert('Error', 'Could not load image. Please check your connection and try again.');
                  setSelectedImage(null);
                }}
                onLoadStart={() => {
                  console.log('Starting to load image:', selectedImage);
                  setImageLoading(true);
                }}
                onLoadEnd={() => {
                  console.log('Image loaded successfully');
                  // Small delay to ensure smooth transition
                  setTimeout(() => {
                    setImageLoading(false);
                  }, 100);
                }}
              />
              {imageLoading && (
                <View style={styles.modalLoaderContainer}>
                  <ActivityIndicator size="large" color="#6B46C1" />
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Video Modal - Fullscreen Player */}
      <Modal
        visible={selectedVideo !== null}
        transparent={false}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          if (videoRef.current) {
            videoRef.current.pauseAsync();
          }
          setSelectedVideo(null);
        }}
      >
        <StatusBar hidden={true} />
        <View style={styles.videoModalOverlay}>
          <TouchableOpacity 
            style={styles.videoModalCloseButton}
            onPress={() => {
              if (videoRef.current) {
                videoRef.current.pauseAsync();
              }
              setSelectedVideo(null);
            }}
          >
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>
          {selectedVideo && (
            <Pressable 
              style={styles.videoPlayerContainer}
              onPress={toggleVideoPlayPause}
            >
              <Video
                ref={videoRef}
                source={{ uri: selectedVideo }}
                style={styles.fullscreenVideo}
                useNativeControls={false}
                resizeMode={ResizeMode.COVER}
                shouldPlay={isVideoPlaying}
                isLooping={false}
                volume={1.0}
                isMuted={false}
                onError={(error: any) => {
                  console.error('Video playback error:', error);
                  Alert.alert('Error', 'Failed to play video. Please check your connection and try again.');
                }}
                onLoad={() => {
                  console.log('Video loaded successfully');
                  // Auto-play when video loads, no button shown
                  setIsVideoPlaying(true);
                  setShowPlayPauseButton(false);
                }}
                onPlaybackStatusUpdate={(status) => {
                  setVideoStatus(status);
                  // Update playing state based on status
                  if (status.isLoaded) {
                    setIsVideoPlaying(status.isPlaying);
                    if (status.isPlaying) {
                      // Hide button when playing
                      setShowPlayPauseButton(false);
                      if (hideButtonTimeoutRef.current) {
                        clearTimeout(hideButtonTimeoutRef.current);
                      }
                    } else {
                      // Show pause button only when paused
                      setShowPlayPauseButton(true);
                    }
                  }
                }}
              />
              {/* Center Pause Button Overlay - Only shown when paused */}
              {showPlayPauseButton && !isVideoPlaying && (
                <View style={styles.centerPlayPauseButton}>
                  <TouchableOpacity
                    style={styles.playPauseButtonCircle}
                    onPress={toggleVideoPlayPause}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name="play" 
                      size={64} 
                      color="white" 
                    />
                  </TouchableOpacity>
                </View>
              )}
              {/* Bottom Video Duration Controls */}
              {selectedVideo && videoStatus.isLoaded && (
                <View style={styles.videoDurationContainer}>
                  <View style={styles.videoDurationContent}>
                    <Text style={styles.videoTimeText}>
                      {getVideoTime().current} / {getVideoTime().total}
                    </Text>
                  </View>
                </View>
              )}
            </Pressable>
          )}
        </View>
      </Modal>

      {/* Floating Support Button */}
      <TouchableOpacity
        style={styles.supportButton}
        onPress={() => setSupportModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
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
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6B46C1',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  tabsContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#6B46C1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  contentContainer: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoHeaderText: {
    flex: 1,
  },
  patientName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  patientSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  doctorInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  doctorInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  doctorSpecialization: {
    fontSize: 14,
    color: '#6B7280',
  },
  mediaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mediaSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  mediaSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
  },
  contentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contentHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  contentDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  contentDetails: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  contentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  badge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#6B46C1',
    fontWeight: '500',
  },
  videoThumbnail: {
    width: '100%',
    height: 150,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  videoInfo: {
    flex: 1,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  videoDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  noteContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginTop: 10,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageThumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  imageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  imageDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  modalImageContainer: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height - 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalImage: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height - 100,
  },
  modalImageHidden: {
    opacity: 0,
  },
  modalLoaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoModalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoModalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    padding: 12,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  centerPlayPauseButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  playPauseButtonCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  videoDurationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    zIndex: 5,
  },
  videoDurationContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTimeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  supportButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6B46C1',
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