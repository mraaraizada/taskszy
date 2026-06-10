import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Taskszy Multi-Project Build...\n');
console.log('📦 Building 3 projects:');
console.log('   1. Root Website (Marketing/Landing)');
console.log('   2. Main App (Task Management)');
console.log('   3. Admin Dashboard (System Admin)\n');

// Helper function to run commands
function run(command, cwd = process.cwd()) {
  console.log(`📦 Running: ${command}`);
  execSync(command, { 
    stdio: 'inherit', 
    cwd,
    env: process.env // Pass all environment variables to child processes
  });
}

// Helper function to copy directory recursively
function copyDir(src, dest) {
  console.log(`📁 Copying ${src} -> ${dest}`);
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // Step 1: Build root website
  console.log('\n📦 Step 1/3: Building Taskszy Website (Marketing/Landing)...');
  run('npm ci');
  run('npm run build');
  
  // Step 2: Build app
  console.log('\n📦 Step 2/3: Building Taskszy App (Task Management)...');
  run('npm ci', './app');
  run('npm run build', './app');
  
  // Step 3: Build admin dashboard
  console.log('\n📦 Step 3/3: Building Taskszy Admin Dashboard (System Admin)...');
  run('npm ci', './adminzdashboard');
  run('npm run build', './adminzdashboard');
  
  // Step 4: Clean and create deploy directory
  console.log('\n🗑️  Step 4: Creating clean deploy directory...');
  if (fs.existsSync('./deploy')) {
    fs.rmSync('./deploy', { recursive: true, force: true });
  }
  fs.mkdirSync('./deploy', { recursive: true });
  fs.mkdirSync('./deploy/app', { recursive: true });
  fs.mkdirSync('./deploy/adminzdashboard', { recursive: true });
  
  // Step 5: Copy dist files
  console.log('\n📋 Step 5: Copying build outputs...');
  copyDir('./dist', './deploy');
  copyDir('./app/dist', './deploy/app');
  copyDir('./adminzdashboard/dist', './deploy/adminzdashboard');
  
  // Step 5.5: Explicitly copy xspreadsheet files from app/public to deploy/app
  console.log('\n📄 Step 5.5: Copying xspreadsheet static files...');
  const xspreadsheetFiles = ['xspreadsheet.js', 'xspreadsheet.css'];
  for (const file of xspreadsheetFiles) {
    const srcPath = path.join('./app/public', file);
    const destPath = path.join('./deploy/app', file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`   ✅ Copied ${file} to deploy/app/`);
    } else {
      console.log(`   ⚠️  ${file} not found in app/public/`);
    }
  }
  
  // Step 6: Copy functions folder
  console.log('\n📝 Step 6: Copying functions for SPA routing...');
  if (fs.existsSync('./functions')) {
    const deployFunctionsPath = path.join('./deploy', 'functions');
    copyDir('./functions', deployFunctionsPath);
    console.log('✅ Functions folder copied');
  } else {
    console.log('⚠️  No functions folder found');
  }
  
  // Step 7: Remove _redirects files if they exist (we use functions instead)
  console.log('\n🗑️  Step 7: Cleaning up conflicting redirect files...');
  const redirectsPath = path.join('./deploy', '_redirects');
  if (fs.existsSync(redirectsPath)) {
    fs.unlinkSync(redirectsPath);
    console.log('✅ Removed _redirects file (using functions middleware instead)');
  }
  
  // Step 8: Verify
  console.log('\n✅ Build complete! Verifying structure...');
  console.log('📂 Deploy structure:');
  console.log('   deploy/');
  console.log('   ├── index.html (root website)');
  console.log('   ├── functions/_middleware.js (SPA routing)');
  console.log('   ├── app/');
  console.log('   │   └── index.html (main app)');
  console.log('   └── adminzdashboard/');
  console.log('       └── index.html (admin dashboard)');
  
  // Verify files exist
  const filesToCheck = [
    './deploy/index.html',
    './deploy/functions/_middleware.js',
    './deploy/app/index.html',
    './deploy/adminzdashboard/index.html'
  ];
  
  let allGood = true;
  for (const file of filesToCheck) {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - MISSING!`);
      allGood = false;
    }
  }
  
  if (allGood) {
    console.log('\n🎉 Taskszy Multi-Project Build Complete!');
    console.log('\n📊 Build Summary:');
    console.log('   ✅ Taskszy Website (Marketing/Landing)');
    console.log('   ✅ Taskszy App (Task Management)');
    console.log('   ✅ Taskszy Admin Dashboard (System Admin)');
    console.log('   ✅ Functions Middleware (SPA Routing)');
    console.log('\n🚀 Ready to deploy to Cloudflare Pages!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npx wrangler pages deploy deploy --project-name=taskszy');
    console.log('   2. Or push to GitHub to trigger automatic deployment');
    process.exit(0);
  } else {
    console.error('\n❌ Build completed with errors.');
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
