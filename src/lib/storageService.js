import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);

/**
 * Upload an image file to Firebase Storage
 * @param {File} file - The image file to upload
 * @param {string} path - Storage path (e.g., 'workspaces/workspace123/logo.jpg')
 * @returns {Promise<string>} - Download URL of the uploaded image
 */
export async function uploadImage(file, path) {
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 5MB');
  }

  try {
    const storageRef = ref(storage, path);
    
    // Add cache control metadata for better performance
    const metadata = {
      cacheControl: 'public, max-age=604800', // Cache for 7 days
      contentType: file.type
    };
    
    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {

    throw new Error('Failed to upload image: ' + error.message);
  }
}

/**
 * Upload workspace logo
 * @param {File} file - The logo image file
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<string>} - Download URL
 */
export async function uploadWorkspaceLogo(file, workspaceId) {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `workspaces/${workspaceId}/logo_${timestamp}.${extension}`;
  return uploadImage(file, path);
}

/**
 * Upload user profile avatar
 * @param {File} file - The avatar image file
 * @param {string} userId - User ID
 * @returns {Promise<string>} - Download URL
 */
export async function uploadUserAvatar(file, userId) {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `users/${userId}/avatar_${timestamp}.${extension}`;
  return uploadImage(file, path);
}

/**
 * Upload team member avatar
 * @param {File} file - The avatar image file
 * @param {string} workspaceId - Workspace ID
 * @param {string} memberId - Member ID
 * @returns {Promise<string>} - Download URL
 */
export async function uploadMemberAvatar(file, workspaceId, memberId) {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const path = `workspaces/${workspaceId}/members/${memberId}/avatar_${timestamp}.${extension}`;
  return uploadImage(file, path);
}

/**
 * Delete an image from Firebase Storage
 * @param {string} url - The download URL or storage path
 */
export async function deleteImage(url) {
  try {
    // Extract path from URL if it's a download URL
    let path = url;
    if (url.includes('firebasestorage.googleapis.com')) {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+?)\?/);
      if (pathMatch) {
        path = decodeURIComponent(pathMatch[1]);
      }
    }
    
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {

    // Don't throw - deletion failures shouldn't block the app
  }
}
