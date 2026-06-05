/**
 * Image Compression Utility
 * Compresses images before uploading to Firebase Storage
 */

/**
 * Compress an image file
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width (default: 800)
 * @param {number} options.maxHeight - Maximum height (default: 800)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
 * @returns {Promise<File>} Compressed image file
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Create new file from blob
            const compressedFile = new File(
              [blob],
              file.name,
              {
                type: 'image/jpeg', // Always convert to JPEG for better compression
                lastModified: Date.now(),
              }
            );

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Compress an avatar image (optimized for profile pictures)
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} Compressed image file
 */
export async function compressAvatar(file) {
  return compressImage(file, {
    maxWidth: 400,  // Avatars don't need to be large
    maxHeight: 400,
    quality: 0.85,  // Slightly higher quality for profile pictures
  });
}

/**
 * Compress a logo image
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} Compressed image file
 */
export async function compressLogo(file) {
  return compressImage(file, {
    maxWidth: 600,
    maxHeight: 600,
    quality: 0.9, // Higher quality for logos
  });
}

/**
 * Compress a general image (for tags, categories, etc.)
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} Compressed image file
 */
export async function compressGeneralImage(file) {
  return compressImage(file, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
  });
}
