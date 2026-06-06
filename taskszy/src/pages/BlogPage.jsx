// Blog List Page - Display all blog posts
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getAllBlogs, formatDate } from '../lib/blogService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogs() {
      setLoading(true);
      const data = await getAllBlogs();
      setBlogs(data);
      setLoading(false);
    }
    fetchBlogs();
  }, []);

  return (
    <>
      <Helmet>
        <title>Taskzy Blog - Project Management Tips & Insights</title>
        <meta 
          name="description" 
          content="Expert insights on project management, team collaboration, workflow automation, and productivity tips for agencies and growing businesses." 
        />
        <meta name="keywords" content="project management blog, team collaboration tips, workflow automation, productivity insights, agency management" />
        <link rel="canonical" href="https://taskzy.com/blog" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Taskzy Blog - Project Management Tips & Insights" />
        <meta property="og:description" content="Expert insights on project management, team collaboration, and productivity." />
        <meta property="og:url" content="https://taskzy.com/blog" />
        <meta property="og:type" content="website" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Taskzy Blog - Project Management Tips" />
        <meta name="twitter:description" content="Expert insights on project management and team collaboration." />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Taskzy Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Expert insights on project management, team collaboration, workflow automation, 
              and productivity tips for modern teams.
            </p>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-20">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  No blog posts yet
                </h2>
                <p className="text-gray-600">
                  Check back soon for expert insights and tips!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

function BlogCard({ blog }) {
  return (
    <Link 
      to={`/blog/${blog.slug}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
    >
      {/* Image */}
      {blog.image && (
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img 
            src={blog.image} 
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="p-6">
        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(blog.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {blog.readTime || '5 min read'}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
          {blog.title}
        </h3>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3">
          {blog.excerpt}
        </p>

        {/* Author & CTA */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            By {blog.author || 'Taskzy Team'}
          </span>
          <span className="text-blue-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Read More
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
