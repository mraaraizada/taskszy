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
            
            console.log('📦 Image compressed:', {
              originalSize: `${(file.size / 1024).toFixed(2)} KB`,
              compressedSize: `${(compressedFile.size / 1024).toFixed(2)} KB`,
              reduction: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`,
              originalDimensions: `${img.width}x${img.height}`,
              newDimensions: `${width}x${height}`,
            });
            
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
 * Compress carousel images (optimized for dashboard carousels)
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} Compressed image file
 */
export async function compressCarouselImage(file) {
  return compressImage(file, {
    maxWidth: 1200,  // Carousel images can be larger
    maxHeight: 800,
    quality: 0.85,
  });
}
