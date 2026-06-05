/**
 * Cloudflare Pages Functions Middleware for SPA Routing
 * 
 * This middleware handles client-side routing for React/Vue/Angular SPAs
 * by serving the appropriate index.html file for application routes.
 * 
 * Routes:
 * - /app/* → Main application SPA
 * - /adminzdashboard/* → Admin dashboard SPA
 * - /* → Root website (static assets)
 */

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const { pathname } = url;

  // Skip middleware for static assets (files with extensions)
  // Examples: .js, .css, .png, .json, .svg, etc.
  if (hasFileExtension(pathname)) {
    return next();
  }

  // Skip middleware for API routes if any
  if (pathname.startsWith('/api/')) {
    return next();
  }

  try {
    // Handle main application routes
    if (pathname.startsWith('/app')) {
      return serveIndexFile(env, '/app/index.html', url.origin);
    }

    // Handle admin dashboard routes
    if (pathname.startsWith('/adminzdashboard')) {
      return serveIndexFile(env, '/adminzdashboard/index.html', url.origin);
    }

    // For root routes, continue with normal asset serving
    // This allows proper handling of the marketing site
    return next();

  } catch (error) {
    // Log error for debugging (visible in Cloudflare dashboard)
    console.error('[Middleware Error]', {
      path: pathname,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    // Fallback: continue with normal processing
    return next();
  }
}

/**
 * Check if pathname represents a file with an extension
 * @param {string} pathname - URL pathname to check
 * @returns {boolean} True if pathname has a file extension
 */
function hasFileExtension(pathname) {
  // Check if path contains a dot AND it's not just a trailing slash or directory
  const lastSegment = pathname.split('/').pop();
  return lastSegment && lastSegment.includes('.') && !pathname.endsWith('/');
}

/**
 * Serve the index.html file for a SPA route
 * @param {Object} env - Cloudflare environment bindings
 * @param {string} indexPath - Path to index.html file
 * @param {string} origin - Origin URL
 * @returns {Promise<Response>} Response containing index.html
 */
async function serveIndexFile(env, indexPath, origin) {
  const indexUrl = new URL(indexPath, origin);
  
  // Fetch the index.html from assets
  const response = await env.ASSETS.fetch(indexUrl);
  
  // Clone the response to add custom headers
  const newResponse = new Response(response.body, response);
  
  // Add cache control headers for HTML files
  newResponse.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  
  return newResponse;
}
