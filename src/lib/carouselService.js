import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import carouselE from '../assets/carousel-e.png';
import carouselG from '../assets/carousel-g.png';
import carouselJ from '../assets/carousel-j.png';
import carouselQ from '../assets/carousel-q.png';
import carouselZ from '../assets/carousel-z.png';

const CACHE_KEY = 'login_carousel_images';
const CACHE_TIMESTAMP_KEY = 'login_carousel_timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Default carousel images from local assets
export const DEFAULT_CAROUSEL_IMAGES = [
  carouselE,
  carouselG,
  carouselJ,
  carouselQ,
  carouselZ,
];

/**
 * Get carousel images from cache
 * @returns {Array|null} Cached images or null if cache is invalid/expired
 */
export function getCachedCarouselImages() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cached || !timestamp) {
      console.log('🎠 No carousel cache found');
      return null;
    }
    
    const age = Date.now() - parseInt(timestamp);
    if (age > CACHE_DURATION) {
      console.log('🎠 Carousel cache expired');
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      return null;
    }
    
    const images = JSON.parse(cached);
    console.log('🎠 Loaded carousel images from cache:', images.length);
    return images;
  } catch (error) {
    console.error('❌ Error reading carousel cache:', error);
    return null;
  }
}

/**
 * Save carousel images to cache
 * @param {Array} images - Array of image URLs
 */
export function cacheCarouselImages(images) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(images));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log('💾 Cached carousel images:', images.length);
  } catch (error) {
    console.error('❌ Error caching carousel images:', error);
  }
}

/**
 * Fetch active carousel images from Firebase
 * @param {string} workspaceId - Workspace ID (optional, for future multi-tenant support)
 * @returns {Promise<Array>} Array of image URLs
 */
export async function fetchActiveCarouselImages(workspaceId = null) {
  try {
    console.log('🎠 Fetching active carousel from Firebase...');
    
    // Carousel is public - no auth required for login page
    const carouselRef = collection(db, 'carousels');
    const q = query(carouselRef, where('active', '==', true));
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('🎠 No active carousel found, using default');
      return DEFAULT_CAROUSEL_IMAGES;
    }
    
    // Get the first active carousel
    const carouselDoc = snapshot.docs[0];
    const carouselData = carouselDoc.data();
    
    if (!carouselData.images || carouselData.images.length === 0) {
      console.log('🎠 Active carousel has no images, using default');
      return DEFAULT_CAROUSEL_IMAGES;
    }
    
    console.log('✅ Loaded active carousel:', carouselData.images.length, 'images');
    return carouselData.images;
  } catch (error) {
    // If error occurs, use default images
    console.log('🎠 Could not fetch carousel, using default images');
    return DEFAULT_CAROUSEL_IMAGES;
  }
}

/**
 * Get carousel images with smart loading:
 * 1. Try cache first
 * 2. If no cache, return default images
 * 3. Fetch from Firebase in background and update cache
 * 
 * @param {Function} onUpdate - Callback when images are updated from Firebase
 * @returns {Array} Initial images to display
 */
export function getCarouselImages(onUpdate) {
  // Try cache first
  const cached = getCachedCarouselImages();
  
  if (cached && cached.length > 0) {
    console.log('🎠 Using cached carousel images');
    
    // Still fetch from Firebase in background to update cache
    setTimeout(() => {
      fetchActiveCarouselImages().then(images => {
        // Only update if images are different
        if (JSON.stringify(images) !== JSON.stringify(cached)) {
          console.log('🎠 Carousel updated from Firebase');
          cacheCarouselImages(images);
          if (onUpdate) onUpdate(images);
        }
      });
    }, 2000); // Wait 2 seconds before background update
    
    return cached;
  }
  
  // No cache, return default and fetch from Firebase
  console.log('🎠 Using default carousel images');
  
  // Fetch from Firebase after a delay
  setTimeout(() => {
    fetchActiveCarouselImages().then(images => {
      console.log('🎠 Carousel loaded from Firebase');
      cacheCarouselImages(images);
      if (onUpdate) onUpdate(images);
    });
  }, 3000); // Wait 3 seconds before fetching
  
  return DEFAULT_CAROUSEL_IMAGES;
}

/**
 * Clear carousel cache (useful for testing or manual refresh)
 */
export function clearCarouselCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  console.log('🗑️ Carousel cache cleared');
}
