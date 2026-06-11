import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for dynamic meta tag management
 * Optimized for Google ranking
 */
const SEOHelmet = ({
  title = 'Taskzy - Complete Workspace Management Platform',
  description = 'All-in-one workspace management platform for teams. Manage tasks, projects, budgets, workflows & performance. Free 14-day trial.',
  keywords = 'task management, team collaboration, project management, workspace management',
  canonical = 'https://taskzy.com/',
  ogImage = 'https://taskzy.com/dashboard.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  author = 'Taskzy',
  schema = null,
}) => {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Taskzy" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@taskzy" />
      <meta name="twitter:site" content="@taskzy" />
      
      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHelmet;
