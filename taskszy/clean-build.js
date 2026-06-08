import { rmSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Clean Build Script for Cloudflare Deployment
 * Removes all build artifacts and dist folders before deployment
 */

const dirsToClean = [
  // Main build directories
  'dist',
  'build',
  'deploy',
  
  // App build directories
  'app/dist',
  'app/build',
  
  // Admin dashboard build directories
  'adminzdashboard/dist',
  'adminzdashboard/build',
  
  // Node modules cache (optional - uncomment if needed)
  // 'node_modules/.vite',
  // 'app/node_modules/.vite',
  // 'adminzdashboard/node_modules/.vite',
];

console.log('🧹 Cleaning build artifacts for Cloudflare deployment...\n');

let cleanedCount = 0;

dirsToClean.forEach(dir => {
  const fullPath = join(process.cwd(), dir);
  
  if (existsSync(fullPath)) {
    try {
      rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Cleaned: ${dir}`);
      cleanedCount++;
    } catch (error) {
      console.error(`❌ Failed to clean ${dir}:`, error.message);
    }
  } else {
    console.log(`⏭️  Skipped: ${dir} (doesn't exist)`);
  }
});

console.log(`\n✨ Cleaning complete! Removed ${cleanedCount} directories.`);
console.log('📦 Ready for fresh build and deployment.\n');
