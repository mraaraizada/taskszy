// Static Blog Service - No Firebase needed!
import blogsData from '../data/blogs.json';

// Helper to convert string dates to Date objects
function parseBlog(blog) {
  return {
    ...blog,
    createdAt: blog.createdAt ? new Date(blog.createdAt) : new Date(),
    updatedAt: blog.updatedAt ? new Date(blog.updatedAt) : new Date(),
  };
}

// Get all published blogs
export async function getAllBlogs() {
  // Filter only published blogs and sort by date
  const blogs = blogsData.blogs
    .filter(blog => blog.published)
    .map(parseBlog)
    .sort((a, b) => b.createdAt - a.createdAt);
  
  return blogs;
}

// Get single blog by slug
export async function getBlogBySlug(slug) {
  const blog = blogsData.blogs.find(
    b => b.slug === slug && b.published
  );
  
  return blog ? parseBlog(blog) : null;
}

// Get recent blogs (for sidebar)
export async function getRecentBlogs(limit = 3) {
  const blogs = blogsData.blogs
    .filter(blog => blog.published)
    .map(parseBlog)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
  
  return blogs;
}

// Alias for compatibility
export const getRelatedBlogs = getRecentBlogs;

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
