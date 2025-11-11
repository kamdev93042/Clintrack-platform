import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

class MediaService {
  /**
   * Request camera/gallery permissions
   */
  async requestImagePermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need permission to access your photos.');
      return false;
    }
    return true;
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermissions() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need permission to access your camera.');
      return false;
    }
    return true;
  }

  /**
   * Pick images from gallery or camera
   * @param {Object} options - { allowsMultiple: true/false, source: 'gallery' | 'camera' }
   * @returns {Array} Array of image objects with uri, type, name
   */
  async pickImages(options = {}) {
    try {
      const { allowsMultiple = true, source = 'gallery' } = options;

      if (source === 'camera') {
        const hasPermission = await this.requestCameraPermissions();
        if (!hasPermission) return [];

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
          allowsMultiple: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          return result.assets.map(asset => ({
            uri: asset.uri,
            type: asset.type || 'image',
            name: `photo_${Date.now()}.jpg`,
            width: asset.width,
            height: asset.height,
          }));
        }
      } else {
        const hasPermission = await this.requestImagePermissions();
        if (!hasPermission) return [];

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
          allowsMultiple: allowsMultiple,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          return result.assets.map((asset, index) => ({
            uri: asset.uri,
            type: asset.type || 'image',
            name: `photo_${Date.now()}_${index}.jpg`,
            width: asset.width,
            height: asset.height,
          }));
        }
      }

      return [];
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
      return [];
    }
  }

  /**
   * Pick videos from gallery
   * @returns {Array} Array of video objects with uri, type, name
   */
  async pickVideos() {
    try {
      const hasPermission = await this.requestImagePermissions();
      if (!hasPermission) return [];

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
        allowsMultiple: true,
        videoMaxDuration: 300, // 5 minutes max
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: asset.type || 'video',
          name: `video_${Date.now()}_${index}.mp4`,
          duration: asset.duration,
          width: asset.width,
          height: asset.height,
        }));
      }

      return [];
    } catch (error) {
      console.error('Error picking videos:', error);
      Alert.alert('Error', 'Failed to pick videos. Please try again.');
      return [];
    }
  }

  /**
   * Show image picker options (Camera or Gallery)
   * @returns {Promise} Resolves with selected images
   */
  async showImagePickerOptions() {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Image Source',
        'Choose where to pick images from',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve([]) },
          { 
            text: 'Camera', 
            onPress: async () => {
              const images = await this.pickImages({ allowsMultiple: false, source: 'camera' });
              resolve(images);
            }
          },
          { 
            text: 'Gallery', 
            onPress: async () => {
              const images = await this.pickImages({ allowsMultiple: true, source: 'gallery' });
              resolve(images);
            }
          },
        ],
        { cancelable: true }
      );
    });
  }
}

export default new MediaService();
