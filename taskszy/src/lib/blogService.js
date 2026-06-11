// Blog Service - Handles blog posts data from Firebase Firestore
import { db } from './firebase';
import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';

// Get all published blog posts
export async function getAllBlogs() {
  try {
    const blogsRef = collection(db, 'blogs');
    const q = query(
      blogsRef,
      where('published', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    const blogs = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      blogs.push({
        id: doc.id,
        ...data,
        // Convert Firestore timestamp to Date
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || null,
      });
    });
    
    return blogs;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    // Return sample blogs as fallback
    return getSampleBlogs();
  }
}

// Get single blog post by slug
export async function getBlogBySlug(slug) {
  try {
    const blogsRef = collection(db, 'blogs');
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
    
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || null,
    };
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    return null;
  }
}

// Format date for display
export function formatDate(date) {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Get related posts (excluding current post)
export async function getRelatedBlogs(currentSlug, limitCount = 3) {
  try {
    const blogsRef = collection(db, 'blogs');
    const q = query(
      blogsRef,
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount + 1) // Get one extra in case current post is included
    );
    
    const snapshot = await getDocs(q);
    
    const blogs = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Exclude current post
      if (data.slug !== currentSlug) {
        blogs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || null,
        });
      }
    });
    
    return blogs.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    return [];
  }
}

// Alias for compatibility
export const getRecentBlogs = getRelatedBlogs;

// Sample blog posts as fallback (when Firebase is not available)
function getSampleBlogs() {
  return [
    {
      id: '1',
      slug: 'getting-started-with-taskzy',
      title: 'Getting Started with Taskzy: A Complete Guide',
      excerpt: 'Learn how to set up your workspace, invite team members, and start managing projects efficiently with Taskzy.',
      content: `
        <h2>Welcome to Taskzy!</h2>
        <p>Taskzy is a complete workspace management platform designed to help teams collaborate, track tasks, and manage budgets all in one place.</p>
        
        <h2>Setting Up Your Workspace</h2>
        <p>Follow these steps to get started:</p>
        <ol>
          <li>Create your account and select a plan</li>
          <li>Set up your workspace name and logo</li>
          <li>Invite your team members</li>
          <li>Create your first project</li>
        </ol>
        
        <h2>Key Features</h2>
        <p>Taskzy offers a comprehensive suite of tools including task management, team collaboration, financial tracking, and performance analytics.</p>
      `,
      author: 'Taskzy Team',
      createdAt: new Date('2026-06-01'),
      readTime: '5 min read',
      image: '/dashboard.png',
      keywords: ['Getting Started', 'Tutorial'],
      published: true,
    },
    {
      id: '2',
      slug: 'boost-team-productivity',
      title: '10 Ways to Boost Team Productivity with Taskzy',
      excerpt: 'Discover proven strategies to enhance your team\'s productivity using Taskzy\'s powerful features.',
      content: `
        <h2>Maximize Your Team's Potential</h2>
        <p>Productivity is key to success. Here are 10 ways Taskzy helps boost team productivity.</p>
        
        <h2>1. Centralized Task Management</h2>
        <p>Keep all tasks in one place with unlimited task management capabilities.</p>
        
        <h2>2. Clear Role Assignments</h2>
        <p>Assign roles and responsibilities clearly to avoid confusion.</p>
        
        <h2>3. Real-time Collaboration</h2>
        <p>Collaborate in real-time with your team members.</p>
      `,
      author: 'Taskzy Team',
      createdAt: new Date('2026-05-28'),
      readTime: '7 min read',
      image: '/analytics_17257787.png',
      keywords: ['Productivity', 'Tips'],
      published: true,
    },
    {
      id: '3',
      slug: 'financial-management-for-agencies',
      title: 'Financial Management Best Practices for Agencies',
      excerpt: 'Master financial tracking and budget management for your agency with Taskzy\'s built-in financial tools.',
      content: `
        <h2>Financial Management Made Easy</h2>
        <p>Managing finances is crucial for agency success. Learn how to track budgets, expenses, and payments efficiently.</p>
        
        <h2>Budget Planning</h2>
        <p>Create and track budgets for each project to ensure profitability.</p>
        
        <h2>Payment Tracking</h2>
        <p>Monitor incoming and outgoing payments with ease.</p>
        
        <h2>Financial Reports</h2>
        <p>Generate comprehensive financial reports to understand your agency's financial health.</p>
      `,
      author: 'Taskzy Team',
      createdAt: new Date('2026-05-25'),
      readTime: '6 min read',
      image: '/credit-card.png',
      keywords: ['Finance', 'Agency Management'],
      published: true,
    },
  ];
}
