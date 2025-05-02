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

// Ensure Vite is installed and available - more aggressive approach
console.log('⚙️ Installing Vite explicitly...');

// Always install Vite and React plugin to ensure they're available
try {
  // We'll install these packages explicitly with exact paths
  execSync('npm install --no-save vite@latest @vitejs/plugin-react@latest', { stdio: 'inherit' });
  console.log('✅ Vite and React plugin installed successfully!');
  
  // Verify the installation by checking node_modules
  const vitePath = path.join(process.cwd(), 'node_modules', 'vite');
  const exists = fs.existsSync(vitePath);
  console.log(`Vite installation check: ${exists ? 'FOUND' : 'NOT FOUND'} at ${vitePath}`);
  
  if (!exists) {
    throw new Error('Vite was installed but not found in expected location');
  }
} catch (error) {
  console.error('❌ Vite installation failed:', error.message);
  process.exit(1);
}

// Execute build steps directly without relying on package.json scripts
let success = true;

// Step 1: Build assets (skip in CI environment)
console.log('\n📦 Building assets...');
if (process.env.CI === 'true') {
  console.log('Skipping assets build in CI environment');
} else {
  try {
    execSync('npx @mathigon/studio/bin/cli.js --assets --locales en', { stdio: 'inherit' });
  } catch (error) {
    console.warn('⚠️ Asset build failed, but continuing:', error.message);
  }
}

// Step 2: Run Vite build directly using npx (more reliable than path resolution)
console.log('\n🏗️ Building Vite application...');
try {
  const startTime = Date.now();
  
  // Locate the Vite executable directly in node_modules
  const vitePath = path.join(process.cwd(), 'node_modules', '.bin', 'vite');
  console.log(`Looking for Vite at: ${vitePath}`);
  
  // Check if the binary exists
  if (fs.existsSync(vitePath)) {
    console.log(`Vite binary found at: ${vitePath}`);
    // Execute it directly
    execSync(`"${vitePath}" build`, { stdio: 'inherit' });
  } else {
    console.log('Vite binary not found, using npx as fallback');
    // Use npx as a fallback
    execSync('npx --no vite build', { stdio: 'inherit' });
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Vite build completed in ${duration}s`);
} catch (error) {
  console.error(`❌ Vite build failed:`, error.message);
  console.log('Checking for node_modules content...');
  try {
    // Log node_modules content to help debug
    const nodeModules = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModules)) {
      const dirs = fs.readdirSync(nodeModules).filter(d => !d.startsWith('.'));
      console.log(`Node modules found: ${dirs.join(', ').substring(0, 200)}${dirs.length > 10 ? '...' : ''}`);
    } else {
      console.log('node_modules directory not found!');
    }
  } catch (e) {
    console.error('Error checking node_modules:', e.message);
  }
  success = false;
  process.exit(1);
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