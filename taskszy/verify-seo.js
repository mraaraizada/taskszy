#!/usr/bin/env node

/**
 * SEO Verification Script for Taskzy
 * Verifies all SEO requirements are met before deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Taskzy SEO Verification\n');
console.log('Checking all SEO requirements...\n');

let passed = 0;
let failed = 0;
const errors = [];

// Helper function to check file exists
function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: FOUND`);
    passed++;
    return true;
  } else {
    console.log(`❌ ${description}: NOT FOUND`);
    errors.push(`Missing: ${description} at ${filePath}`);
    failed++;
    return false;
  }
}

// Helper function to check file content
function checkFileContent(filePath, searchTerm, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchTerm)) {
      console.log(`✅ ${description}: FOUND`);
      passed++;
      return true;
    } else {
      console.log(`❌ ${description}: NOT FOUND`);
      errors.push(`Missing content: ${description} in ${filePath}`);
      failed++;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: ERROR READING FILE`);
    errors.push(`Error reading ${filePath}: ${error.message}`);
    failed++;
    return false;
  }
}

console.log('📄 1. Checking Sitemap.xml...');
checkFileExists('./public/sitemap.xml', 'Sitemap.xml in public folder');
checkFileContent('./public/sitemap.xml', 'https://taskzy.com', 'Sitemap contains domain URL');
checkFileContent('./public/sitemap.xml', '<urlset', 'Sitemap has valid XML structure');
console.log('');

console.log('🤖 2. Checking Robots.txt...');
checkFileExists('./public/robots.txt', 'Robots.txt in public folder');
checkFileContent('./public/robots.txt', 'Sitemap: https://taskzy.com/sitemap.xml', 'Robots.txt points to sitemap');
checkFileContent('./public/robots.txt', 'User-agent: *', 'Robots.txt allows search engines');
console.log('');

console.log('📊 3. Checking Schema Markup...');
checkFileExists('./index.html', 'index.html file');
checkFileContent('./index.html', 'application/ld+json', 'Schema markup present');
checkFileContent('./index.html', '@type": "SoftwareApplication"', 'SoftwareApplication schema');
checkFileContent('./index.html', '@type": "Organization"', 'Organization schema');
checkFileContent('./index.html', '@type": "WebSite"', 'WebSite schema');
console.log('');

console.log('🏷️ 4. Checking Meta Tags...');
checkFileContent('./index.html', '<meta name="description"', 'Meta description tag');
checkFileContent('./index.html', '<meta name="keywords"', 'Meta keywords tag');
checkFileContent('./index.html', 'property="og:title"', 'Open Graph title');
checkFileContent('./index.html', 'property="og:description"', 'Open Graph description');
checkFileContent('./index.html', 'property="og:image"', 'Open Graph image');
checkFileContent('./index.html', 'name="twitter:card"', 'Twitter card');
checkFileContent('./index.html', '<link rel="canonical"', 'Canonical URL');
console.log('');

console.log('🔧 5. Checking Build Configuration...');
checkFileExists('./vite.config.js', 'Vite config file');
checkFileContent('./vite.config.js', 'build:', 'Build configuration present');
checkFileContent('./vite.config.js', 'minify:', 'Minification enabled');
checkFileContent('./vite.config.js', 'rollupOptions:', 'Code splitting configured');
console.log('');

console.log('📱 6. Checking Mobile Responsiveness...');
checkFileContent('./index.html', 'width=device-width', 'Viewport meta tag');
checkFileExists('./tailwind.config.js', 'Tailwind config file');
checkFileContent('./tailwind.config.js', 'mobile', 'Mobile breakpoints defined');
console.log('');

console.log('⚡ 7. Checking Performance Optimizations...');
checkFileContent('./vite.config.js', 'manualChunks', 'Code splitting for vendors');
checkFileContent('./index.html', 'preconnect', 'Preconnect hints for performance');
console.log('');

// Summary
console.log('═'.repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('═'.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Score: ${passed}/${passed + failed} (${Math.round((passed / (passed + failed)) * 100)}%)`);
console.log('');

if (failed > 0) {
  console.log('❌ ERRORS FOUND:');
  errors.forEach((error, index) => {
    console.log(`   ${index + 1}. ${error}`);
  });
  console.log('');
  console.log('🔧 Please fix the errors above before deploying.');
  process.exit(1);
} else {
  console.log('🎉 ALL SEO REQUIREMENTS MET!');
  console.log('✅ Ready for production deployment');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('   1. Run: npm run build');
  console.log('   2. Run: npm run build:cloudflare');
  console.log('   3. Deploy to Cloudflare Pages');
  console.log('   4. Submit sitemap to Google Search Console');
  console.log('   5. Test with Google Rich Results Test');
  console.log('');
  process.exit(0);
}
