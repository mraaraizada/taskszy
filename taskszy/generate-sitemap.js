#!/usr/bin/env node

/**
 * Dynamic Sitemap Generator for Taskzy
 * Generates sitemap.xml with all routes including dynamic blog posts
 * Run: node generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DOMAIN = 'https://taskzy.com';
const OUTPUT_FILE = path.join(__dirname, 'public', 'sitemap.xml');
const TODAY = new Date().toISOString().split('T')[0];

// Flag to check if running in CI/CD
const isCI = process.env.CI || process.env.GITHUB_ACTIONS;

// Static routes with priority and change frequency
// Note: Hash (#) fragments are not allowed in sitemaps - they're ignored by search engines
const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/blog', priority: '0.8', changefreq: 'weekly' },
  // Add more actual pages here as you create them:
  // { path: '/pricing', priority: '0.9', changefreq: 'monthly' },
  // { path: '/features', priority: '0.9', changefreq: 'monthly' },
  // { path: '/about', priority: '0.7', changefreq: 'monthly' },
];

// Generate sitemap XML
function generateSitemap(routes) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

  routes.forEach(route => {
    xml += `
  <url>
    <loc>${DOMAIN}${route.path}</loc>
    <lastmod>${route.lastmod || TODAY}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  });

  xml += '\n\n</urlset>\n';
  return xml;
}

// Main execution
async function main() {
  console.log('🗺️  Generating sitemap.xml...\n');
  
  const allRoutes = [...staticRoutes];
  
  // TODO: Add logic to fetch dynamic blog posts from Firebase
  // Example:
  // const blogPosts = await fetchBlogPosts();
  // blogPosts.forEach(post => {
  //   allRoutes.push({
  //     path: `/blog/${post.slug}`,
  //     priority: '0.7',
  //     changefreq: 'monthly',
  //     lastmod: post.updatedAt || TODAY
  //   });
  // });
  
  const sitemap = generateSitemap(allRoutes);
  
  // Write sitemap to file
  fs.writeFileSync(OUTPUT_FILE, sitemap, 'utf8');
  
  console.log(`✅ Sitemap generated successfully!`);
  console.log(`📍 Location: ${OUTPUT_FILE}`);
  console.log(`📊 Total URLs: ${allRoutes.length}`);
  console.log(`📅 Last updated: ${TODAY}\n`);
  
  if (!isCI) {
    console.log('💡 Tip: Sitemap auto-updates on every build');
    console.log('📝 Submit to Google: https://search.google.com/search-console\n');
  }
}

main().catch(err => {
  console.error('❌ Error generating sitemap:', err);
  process.exit(1);
});
