// Cloudflare Pages Function for SPA routing
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Skip if requesting actual files (has extension)
  if (pathname.includes('.') && !pathname.endsWith('/')) {
    return context.next();
  }

  try {
    // Handle /app routes - serve app/index.html for any /app/* route
    if (pathname.startsWith('/app')) {
      const appIndexUrl = new URL('/app/index.html', url.origin);
      return context.env.ASSETS.fetch(appIndexUrl);
    }

    // Handle /adminzdashboard routes - serve adminzdashboard/index.html
    if (pathname.startsWith('/adminzdashboard')) {
      const adminIndexUrl = new URL('/adminzdashboard/index.html', url.origin);
      return context.env.ASSETS.fetch(adminIndexUrl);
    }

    // For root routes, continue normal processing
    return context.next();
  } catch (error) {
    // If something goes wrong, try to serve the original request
    return context.next();
  }
}
