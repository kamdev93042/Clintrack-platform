import ApiService from './api';
import { Platform } from 'react-native';

class SessionService {
  // Helper function to convert URI to Blob (for web platform)
  async uriToBlob(uri, mimeType) {
    if (Platform.OS === 'web') {
      // For web, fetch the file and convert to Blob
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob;
    }
    // For native platforms, return the object format
    return {
      uri: uri,
      type: mimeType,
      name: `file_${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`
    };
  }

  // Create a new session for a patient (with file uploads)
  async createSession(patientId, sessionData, files = { photos: [], videos: [] }) {
    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      
      // Add session data fields
      if (sessionData.sessionDate) {
        formData.append('sessionDate', sessionData.sessionDate);
      }
      if (sessionData.durationMinutes) {
        formData.append('durationMinutes', sessionData.durationMinutes.toString());
      }
      if (sessionData.treatmentNotes) {
        formData.append('treatmentNotes', sessionData.treatmentNotes);
      }
      if (sessionData.progressNotes) {
        formData.append('progressNotes', sessionData.progressNotes);
      }
      if (sessionData.feeCharged) {
        formData.append('feeCharged', sessionData.feeCharged.toString());
      }
      
      // Add photos (images)
      if (files.photos && files.photos.length > 0) {
        console.log('📤 Adding photos to FormData:', files.photos.length);
        
        for (let index = 0; index < files.photos.length; index++) {
          const photo = files.photos[index];
          
          // Determine file extension and mime type
          const fileExtension = photo.name?.split('.').pop() || 'jpg';
          let mimeType = 'image/jpeg'; // default
          
          if (fileExtension === 'png') {
            mimeType = 'image/png';
          } else if (fileExtension === 'gif') {
            mimeType = 'image/gif';
          } else if (fileExtension === 'webp') {
            mimeType = 'image/webp';
          }
          
          const fileName = photo.name || `photo_${Date.now()}_${index}.${fileExtension}`;
          
          console.log(`  Photo ${index + 1}:`, {
            uri: photo.uri?.substring(0, 50) + '...',
            type: mimeType,
            name: fileName,
            platform: Platform.OS
          });
          
          // For web, convert URI to Blob; for native, use object format
          if (Platform.OS === 'web') {
            try {
              const blob = await this.uriToBlob(photo.uri, mimeType);
              formData.append('photos', blob, fileName);
            } catch (error) {
              console.error(`Error converting photo ${index + 1} to blob:`, error);
              // Fallback: try to create a File object
              const response = await fetch(photo.uri);
              const blob = await response.blob();
              const file = new File([blob], fileName, { type: mimeType });
              formData.append('photos', file);
            }
          } else {
            // Native platforms (iOS/Android) - use object format
            formData.append('photos', {
              uri: photo.uri,
              type: mimeType,
              name: fileName,
            });
          }
        }
      }
      
      // Add videos
      if (files.videos && files.videos.length > 0) {
        console.log('📤 Adding videos to FormData:', files.videos.length);
        
        for (let index = 0; index < files.videos.length; index++) {
          const video = files.videos[index];
          
          const fileExtension = video.name?.split('.').pop() || 'mp4';
          let mimeType = 'video/mp4'; // default
          
          if (fileExtension === 'mov') {
            mimeType = 'video/quicktime';
          } else if (fileExtension === 'avi') {
            mimeType = 'video/x-msvideo';
          } else if (fileExtension === 'mkv') {
            mimeType = 'video/x-matroska';
          } else if (fileExtension === 'webm') {
            mimeType = 'video/webm';
          }
          
          const fileName = video.name || `video_${Date.now()}_${index}.${fileExtension}`;
          
          console.log(`  Video ${index + 1}:`, {
            uri: video.uri?.substring(0, 50) + '...',
            type: mimeType,
            name: fileName,
            platform: Platform.OS
          });
          
          // For web, convert URI to Blob; for native, use object format
          if (Platform.OS === 'web') {
            try {
              const blob = await this.uriToBlob(video.uri, mimeType);
              formData.append('videos', blob, fileName);
            } catch (error) {
              console.error(`Error converting video ${index + 1} to blob:`, error);
              // Fallback: try to create a File object
              const response = await fetch(video.uri);
              const blob = await response.blob();
              const file = new File([blob], fileName, { type: mimeType });
              formData.append('videos', file);
            }
          } else {
            // Native platforms (iOS/Android) - use object format
            formData.append('videos', {
              uri: video.uri,
              type: mimeType,
              name: fileName,
            });
          }
        }
      }
      
      console.log('Creating session with FormData:', {
        patientId,
        fields: Object.keys(sessionData),
        photosCount: files.photos?.length || 0,
        videosCount: files.videos?.length || 0,
      });
      
      const response = await ApiService.postFormData(`/sessions/${patientId}`, formData);
      return {
        success: true,
        message: response.message,
        session: response.session,
      };
    } catch (error) {
      console.error('Error creating session:', error);
      return {
        success: false,
        message: error?.response?.data?.message || error.message || 'Failed to create session',
      };
    }
  }

  // Get all sessions for a patient
  async getSessionsByPatient(patientId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.page) queryParams.append('page', options.page);
      if (options.limit) queryParams.append('limit', options.limit);

      const endpoint = `/sessions/patient/${patientId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await ApiService.get(endpoint);
      
      return {
        success: true,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get sessions',
      };
    }
  }

  // Get a single session by ID
  async getSession(sessionId) {
    try {
      const response = await ApiService.get(`/sessions/${sessionId}`);
      return {
        success: true,
        message: response.message,
        session: response.session,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get session',
      };
    }
  }

  // Update a session
  async updateSession(sessionId, sessionData) {
    try {
      const response = await ApiService.put(`/sessions/${sessionId}`, sessionData);
      return {
        success: true,
        message: response.message,
        session: response.session,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update session',
      };
    }
  }

  // Delete a session
  async deleteSession(sessionId) {
    try {
      const response = await ApiService.delete(`/sessions/${sessionId}`);
      return {
        success: true,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete session',
      };
    }
  }

  // Get session statistics for a patient
  async getSessionStats(patientId) {
    try {
      const response = await ApiService.get(`/sessions/patient/${patientId}/stats`);
      return {
        success: true,
        message: response.message,
        stats: response.stats,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to get session statistics',
      };
    }
  }
}

export default new SessionService();

