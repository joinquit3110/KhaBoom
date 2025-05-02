// build.js - Custom build script with enhanced logging
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting KHA-BOOM! build process');
console.log(`🔍 Current working directory: ${process.cwd()}`);
console.log(`📅 Build date: ${new Date().toISOString()}`);
console.log(`🔧 Node version: ${process.version}`);
console.log(`🌎 Environment: ${process.env.NODE_ENV || 'development'}`);

// List content directories to process
try {
  console.log('\n📁 Checking content directories...');
  const contentDir = path.join(process.cwd(), '..', 'content');
  if (fs.existsSync(contentDir)) {
    const dirs = fs.readdirSync(contentDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    console.log(`Found ${dirs.length} content directories: ${dirs.join(', ')}`);
  } else {
    console.warn('⚠️ Content directory not found!');
  }
} catch (error) {
  console.error('Error checking content directories:', error);
}

// Build process steps
const steps = [
  {
    name: '📦 Building assets',
    command: 'npm run build:assets',
  },
  {
    name: '🏗️ Building Vite application',
    command: 'npm run build:vite',
  }
];

// Execute build steps
let success = true;
for (const step of steps) {
  try {
    console.log(`\n${step.name}...`);
    const startTime = Date.now();
    execSync(step.command, { stdio: 'inherit' });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ ${step.name} completed in ${duration}s`);
  } catch (error) {
    console.error(`❌ ${step.name} failed:`, error.message);
    success = false;
    process.exit(1);
  }
}

// Verify build output
try {
  console.log('\n🔍 Verifying build output...');
  const distDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    console.log(`Found ${files.length} files in dist directory`);
    
    // Check for critical files
    const criticalFiles = ['index.html', 'assets'];
    const missing = criticalFiles.filter(file => !files.includes(file));
    
    if (missing.length === 0) {
      console.log('✅ All critical files present');
    } else {
      console.warn(`⚠️ Missing critical files: ${missing.join(', ')}`);
    }
    
    // Create a _redirects file for Netlify (SPA routing)
    const redirectsPath = path.join(distDir, '_redirects');
    if (!fs.existsSync(redirectsPath)) {
      console.log('📝 Creating Netlify _redirects file for SPA routing...');
      fs.writeFileSync(redirectsPath, '/* /index.html 200');
      console.log('✅ Created _redirects file');
    }
    
    // Create a netlify.toml in dist if it doesn't exist
    const netlifyTomlDestPath = path.join(distDir, 'netlify.toml');
    const netlifyTomlSrcPath = path.join(process.cwd(), 'netlify.toml');
    if (fs.existsSync(netlifyTomlSrcPath) && !fs.existsSync(netlifyTomlDestPath)) {
      console.log('📝 Copying netlify.toml to dist directory...');
      fs.copyFileSync(netlifyTomlSrcPath, netlifyTomlDestPath);
      console.log('✅ Copied netlify.toml file');
    }
  } else {
    console.error('❌ Dist directory not found!');
    success = false;
  }
} catch (error) {
  console.error('Error verifying build output:', error);
  success = false;
}

// Final status
if (success) {
  console.log('\n🎉 Build completed successfully!');
} else {
  console.error('\n❌ Build failed!');
  process.exit(1);
}