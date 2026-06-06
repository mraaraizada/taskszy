#!/usr/bin/env node

/**
 * Dynamic Sitemap Generator for Taskzy
 * Generates sitemap.xml with static pages + dynamic blog posts from Firebase
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration - using environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('🗺️  Taskzy Sitemap Generator\n');

// Initialize Firebase
let app, db;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase initialized');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.log('⚠️  Generating sitemap with static pages only...\n');
}

// Static pages
const staticPages = [
  { loc: 'https://taskzy.com/', changefreq: 'weekly', priority: '1.0' },
  { loc: 'https://taskzy.com/#features', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://taskzy.com/#pricing', changefreq: 'monthly', priority: '0.9' },
  { loc: 'https://taskzy.com/#faq', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://taskzy.com/#testimonials', changefreq: 'monthly', priority: '0.7' },
  { loc: 'https://taskzy.com/app/', changefreq: 'weekly', priority: '0.8' },
  { loc: 'https://taskzy.com/blog', changefreq: 'daily', priority: '0.9' }
];

async function getBlogPosts() {
  if (!db) {
    return [];
  }

  try {
    console.log('📝 Fetching blog posts from Firestore...');
    const blogsRef = collection(db, 'blogs');
    const q = query(blogsRef, where('published', '==', true));
    const snapshot = await getDocs(q);
    
    const blogs = snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date();
      
      return {
        loc: `https://taskzy.com/blog/${data.slug}`,
        lastmod: createdAt.toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.8'
      };
    });
    
    console.log(`✅ Found ${blogs.length} published blog posts`);
    return blogs;
  } catch (error) {
    console.error('❌ Error fetching blogs:', error.message);
    return [];
  }
}

function generateSitemapXML(pages) {
  const today = new Date().toISOString().split('T')[0];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

`;

  pages.forEach(page => {
    xml += `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod || today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>

`;
  });

  xml += `</urlset>`;
  
  return xml;
}

async function main() {
  try {
    // Fetch blog posts
    const blogPages = await getBlogPosts();
    
    // Combine static + dynamic pages
    const allPages = [...staticPages, ...blogPages];
    
    // Generate XML
    const sitemapXML = generateSitemapXML(allPages);
    
    // Write to public folder
    const publicPath = path.join(__dirname, 'public', 'sitemap.xml');
    fs.writeFileSync(publicPath, sitemapXML, 'utf8');
    console.log(`✅ Sitemap saved to: ${publicPath}`);
    
    // Also write to deploy folder if it exists
    const deployPath = path.join(__dirname, 'deploy', 'sitemap.xml');
    if (fs.existsSync(path.join(__dirname, 'deploy'))) {
      fs.writeFileSync(deployPath, sitemapXML, 'utf8');
      console.log(`✅ Sitemap also saved to: ${deployPath}`);
    }
    
    console.log('\n📊 Sitemap Statistics:');
    console.log(`   Total URLs: ${allPages.length}`);
    console.log(`   Static Pages: ${staticPages.length}`);
    console.log(`   Blog Posts: ${blogPages.length}`);
    console.log('\n🎉 Sitemap generation complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Deploy your site');
    console.log('   2. Submit sitemap to Google Search Console');
    console.log('   3. URL: https://taskzy.com/sitemap.xml');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Sitemap generation failed:', error);
    process.exit(1);
  }
}

main();
