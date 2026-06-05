const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting TasksZy build process...\n');

// Helper function to run commands
function run(command, cwd = process.cwd()) {
  console.log(`📦 Running: ${command}`);
  execSync(command, { stdio: 'inherit', cwd });
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
  console.log('\n📦 Step 1: Building root website...');
  run('npm ci');
  run('npm run build');
  
  // Step 2: Build app
  console.log('\n📦 Step 2: Building app...');
  run('npm ci', './app');
  run('npm run build', './app');
  
  // Step 3: Build admin dashboard
  console.log('\n📦 Step 3: Building admin dashboard...');
  run('npm ci', './adminzdashboard');
  run('npm run build', './adminzdashboard');
  
  // Step 4: Clean and create build directory
  console.log('\n🗑️  Step 4: Creating clean build directory...');
  if (fs.existsSync('./build')) {
    fs.rmSync('./build', { recursive: true, force: true });
  }
  fs.mkdirSync('./build', { recursive: true });
  fs.mkdirSync('./build/app', { recursive: true });
  fs.mkdirSync('./build/adminzdashboard', { recursive: true });
  
  // Step 5: Copy dist files
  console.log('\n📋 Step 5: Copying build outputs...');
  copyDir('./dist', './build');
  copyDir('./app/dist', './build/app');
  copyDir('./adminzdashboard/dist', './build/adminzdashboard');
  
  // Step 6: Create _redirects file
  console.log('\n📝 Step 6: Creating _redirects file...');
  const redirectsContent = `/app/* /app/index.html 200
/adminzdashboard/* /adminzdashboard/index.html 200
/* /index.html 200
`;
  fs.writeFileSync('./build/_redirects', redirectsContent, 'utf8');
  console.log('✅ _redirects file created');
  
  // Step 7: Verify
  console.log('\n✅ Build complete! Verifying structure...');
  console.log('📂 Build structure:');
  console.log('   build/');
  console.log('   ├── index.html (root website)');
  console.log('   ├── _redirects (SPA routing)');
  console.log('   ├── app/');
  console.log('   │   └── index.html (main app)');
  console.log('   └── adminzdashboard/');
  console.log('       └── index.html (admin dashboard)');
  
  // Verify files exist
  const filesToCheck = [
    './build/index.html',
    './build/_redirects',
    './build/app/index.html',
    './build/adminzdashboard/index.html'
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
    console.log('\n🎉 Build successful! Ready to deploy.');
    process.exit(0);
  } else {
    console.error('\n❌ Build completed with errors.');
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
