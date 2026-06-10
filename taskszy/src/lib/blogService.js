// Blog Service - Firestore operations for blog posts
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const BLOG_COLLECTION = 'blogs';

/**
 * Fetch all published blogs
 * @param {number} maxResults - Maximum number of blogs to fetch
 * @returns {Promise<Array>} Array of blog posts
 */
export async function getAllBlogs(maxResults = 50) {
  try {
    const blogsRef = collection(db, BLOG_COLLECTION);
    const q = query(
      blogsRef,
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    
    const snapshot = await getDocs(q);
    const blogs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
    }));
    
    return blogs;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return [];
  }
}

/**
 * Fetch a single blog by slug
 * @param {string} slug - Blog post slug
 * @returns {Promise<Object|null>} Blog post or null
 */
export async function getBlogBySlug(slug) {
  try {
    const blogsRef = collection(db, BLOG_COLLECTION);
    const q = query(
      blogsRef,
      where('slug', '==', slug),
      where('published', '==', true),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
    };
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    return null;
  }
}

/**
 * Fetch recent blogs for homepage/sidebar
 * @param {number} count - Number of blogs to fetch
 * @returns {Promise<Array>} Array of recent blog posts
 */
export async function getRecentBlogs(count = 3) {
  try {
    const blogsRef = collection(db, BLOG_COLLECTION);
    const q = query(
      blogsRef,
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
    }));
  } catch (error) {
    console.error('Error fetching recent blogs:', error);
    return [];
  }
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
