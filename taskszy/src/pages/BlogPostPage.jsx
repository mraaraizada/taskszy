// Single Blog Post Page
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getBlogBySlug, formatDate, getRecentBlogs } from '../lib/blogService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Calendar, Clock, User, ArrowLeft, ArrowRight } from 'lucide-react';

export default function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchBlog() {
      setLoading(true);
      setNotFound(false);
      
      const data = await getBlogBySlug(slug);
      
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      setBlog(data);
      
      // Fetch recent blogs for sidebar
      const recent = await getRecentBlogs(3);
      setRecentBlogs(recent.filter(b => b.slug !== slug));
      
      setLoading(false);
    }
    
    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading article...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Article Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Link 
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const blogUrl = `https://taskzy.com/blog/${blog.slug}`;

  return (
    <>
      <Helmet>
        <title>{blog.seoTitle || blog.title}</title>
        <meta name="description" content={blog.metaDescription || blog.excerpt} />
        <meta name="keywords" content={blog.keywords?.join(', ') || ''} />
        <meta name="author" content={blog.author || 'Taskzy Team'} />
        <link rel="canonical" href={blogUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={blog.seoTitle || blog.title} />
        <meta property="og:description" content={blog.metaDescription || blog.excerpt} />
        <meta property="og:url" content={blogUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={blog.image || 'https://taskzy.com/dashboard.png'} />
        <meta property="article:published_time" content={blog.createdAt?.toISOString()} />
        <meta property="article:author" content={blog.author || 'Taskzy Team'} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.seoTitle || blog.title} />
        <meta name="twitter:description" content={blog.metaDescription || blog.excerpt} />
        <meta name="twitter:image" content={blog.image || 'https://taskzy.com/dashboard.png'} />
        
        {/* Article Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": blog.title,
            "description": blog.excerpt,
            "image": blog.image,
            "author": {
              "@type": "Organization",
              "name": blog.author || "Taskzy Team"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Taskzy",
              "logo": {
                "@type": "ImageObject",
                "url": "https://taskzy.com/logo.png"
              }
            },
            "datePublished": blog.createdAt?.toISOString(),
            "dateModified": blog.updatedAt?.toISOString() || blog.createdAt?.toISOString(),
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": blogUrl
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        
        {/* Article Content */}
        <article className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link 
              to="/blog"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {blog.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b border-gray-200">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {blog.author || 'Taskzy Team'}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(blog.createdAt)}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {blog.readTime || '5 min read'}
              </span>
            </div>

            {/* Featured Image */}
            {blog.image && (
              <div className="mb-12 rounded-xl overflow-hidden">
                <img 
                  src={blog.image} 
                  alt={blog.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-gray-900
                prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-ul:list-disc prose-ol:list-decimal
                prose-li:text-gray-700
                prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:pl-4 prose-blockquote:italic
                prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-gray-900 prose-pre:text-gray-100
                prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Tags */}
            {blog.keywords && blog.keywords.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {blog.keywords.map((keyword, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Related Articles */}
        {recentBlogs.length > 0 && (
          <section className="py-16 px-4 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                More Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {recentBlogs.map((relatedBlog) => (
                  <Link 
                    key={relatedBlog.id}
                    to={`/blog/${relatedBlog.slug}`}
                    className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    {relatedBlog.image && (
                      <div className="h-40 overflow-hidden bg-gray-100">
                        <img 
                          src={relatedBlog.image} 
                          alt={relatedBlog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {relatedBlog.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {relatedBlog.excerpt}
                      </p>
                      <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
                        Read More
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <Footer />
      </div>
    </>
  );
}
