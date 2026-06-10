import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying deployment structure...\n');

const deployPath = './deploy';

function checkFile(filePath) {
  const fullPath = path.join(deployPath, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`✅ ${filePath} (${sizeMB} MB)`);
  } else {
    console.log(`❌ ${filePath} - MISSING!`);
  }
  
  return exists;
}

console.log('📦 Checking critical files:\n');

const filesToCheck = [
  'index.html',
  'app/index.html',
  'app/xspreadsheet.js',
  'app/xspreadsheet.css',
  'app/58eaeb4e52248a5c75936c6f4c33a370.svg',
  'adminzdashboard/index.html',
  'functions/_middleware.js'
];

let allPresent = true;

filesToCheck.forEach(file => {
  if (!checkFile(file)) {
    allPresent = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPresent) {
  console.log('✅ All critical files present in deploy folder!');
  console.log('\n💡 If files are still not loading in production:');
  console.log('   1. Check Cloudflare Pages deployment logs');
  console.log('   2. Verify files are actually uploaded to Cloudflare');
  console.log('   3. Check browser Network tab for actual request URLs');
} else {
  console.log('❌ Some files are MISSING from deploy folder!');
  console.log('   Run: npm run build:cloudflare');
}

console.log('='.repeat(50) + '\n');

// Also list actual files in deploy/app/
if (fs.existsSync('./deploy/app')) {
  console.log('📂 Actual files in deploy/app/:');
  const appFiles = fs.readdirSync('./deploy/app');
  appFiles.slice(0, 20).forEach(file => {
    const stats = fs.statSync(path.join('./deploy/app', file));
    if (stats.isFile()) {
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`   - ${file} (${sizeMB} MB)`);
    } else {
      console.log(`   - ${file}/ (directory)`);
    }
  });
  if (appFiles.length > 20) {
    console.log(`   ... and ${appFiles.length - 20} more files`);
  }
}
