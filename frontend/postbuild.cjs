// postbuild.js - Netlify post-build optimizations
const fs = require('fs');
const path = require('path');

console.log('🔧 Running post-build optimizations for Netlify...');
const distDir = path.join(__dirname, 'dist');

// Create _redirects file for SPA routing if it doesn't exist
const redirectsPath = path.join(distDir, '_redirects');
if (!fs.existsSync(redirectsPath)) {
  console.log('📝 Creating Netlify _redirects file...');
  fs.writeFileSync(redirectsPath, '/* /index.html 200');
  console.log('✅ Created _redirects file for SPA routing');
}

// Create _headers file for security headers
const headersPath = path.join(distDir, '_headers');
if (!fs.existsSync(headersPath)) {
  console.log('📝 Creating Netlify _headers file...');
  const headers = `
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self' https://kha-boom-backend.onrender.com https://kha-boom-backend-staging.onrender.com https://fonts.googleapis.com https://fonts.gstatic.com https://api.dicebear.com https://www.google-analytics.com https://*.mongodb.net http://localhost:* https://*.netlify.app https://overbridgenet.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://api.dicebear.com https://kha-boom-backend.onrender.com https://*.netlify.app; manifest-src 'self'; object-src 'none'; media-src 'self'
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS

/*.js
  Cache-Control: public, max-age=31536000
  Content-Type: application/javascript; charset=utf-8

/*.jsx
  Cache-Control: public, max-age=31536000
  Content-Type: application/javascript; charset=utf-8

/*.mjs
  Cache-Control: public, max-age=31536000
  Content-Type: application/javascript; charset=utf-8

/*.cjs
  Cache-Control: public, max-age=31536000
  Content-Type: application/javascript; charset=utf-8

/*.module.js
  Cache-Control: public, max-age=31536000
  Content-Type: application/javascript; charset=utf-8

/*.css
  Cache-Control: public, max-age=31536000
  Content-Type: text/css; charset=utf-8

/*.woff2
  Cache-Control: public, max-age=31536000

/assets/*
  Cache-Control: public, max-age=31536000

/content/*
  Cache-Control: public, max-age=86400
`;
  fs.writeFileSync(headersPath, headers.trim());
  console.log('✅ Created _headers file with security headers and caching rules');
}

// Create a robots.txt file
const robotsPath = path.join(distDir, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  console.log('📝 Creating robots.txt file...');
  const robots = `
User-agent: *
Allow: /

Sitemap: https://khaboom.netlify.app/sitemap.xml
`;
  fs.writeFileSync(robotsPath, robots.trim());
  console.log('✅ Created robots.txt file');
}

// Create a simple sitemap.xml file
const sitemapPath = path.join(distDir, 'sitemap.xml');
if (!fs.existsSync(sitemapPath)) {
  console.log('📝 Creating basic sitemap.xml file...');
  
  const today = new Date().toISOString().split('T')[0];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://khaboom.netlify.app/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://khaboom.netlify.app/courses</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://khaboom.netlify.app/login</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
  
  fs.writeFileSync(sitemapPath, sitemap);
  console.log('✅ Created basic sitemap.xml file');
}

// Create content directories and ensure hero images for all courses
console.log('🖼️ Creating content directories and hero images for courses...');

// Updated list based on actual content directory
const courseDirs = [
  'basic-probability',
  'chaos',
  'circles',
  'codes',
  'combinatorics',
  'complex',
  'data',
  'divisibility',
  'euclidean-geometry',
  'exploding-dots',
  'exponentials',
  'fractals',
  'functions',
  'game-theory',
  'graph-theory',
  'linear-functions',
  'logic',
  'matrices',
  'non-euclidean-geometry',
  'polygons',
  'polyhedra',
  'probability',
  'quadratics',
  'sequences',
  'shapes',
  'statistics',
  'transformations',
  'triangles',
  'vectors'
];

courseDirs.forEach(course => {
  const contentDir = path.join(distDir, 'content', course);
  // Create course content directory if it doesn't exist
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }
  
  // Create hero image
  const heroPath = path.join(contentDir, 'hero.jpg');
  if (!fs.existsSync(heroPath)) {
    // Copy logo.png as a placeholder or create an empty file
    try {
      const logoPath = path.join(distDir, 'logo.png');
      if (fs.existsSync(logoPath)) {
        fs.copyFileSync(logoPath, heroPath);
      } else {
        // Create an empty file as placeholder
        fs.writeFileSync(heroPath, '');
      }
      console.log(`✅ Created hero image for ${course}`);
    } catch (err) {
      console.error(`❌ Failed to create hero image for ${course}:`, err);
    }
  }
  
  // Create a minimal content.md file if it doesn't exist
  const contentPath = path.join(contentDir, 'content.md');
  if (!fs.existsSync(contentPath)) {
    try {
      const minimalContent = `# ${course.charAt(0).toUpperCase() + course.slice(1).replace(/-/g, ' ')}

> title: ${course.charAt(0).toUpperCase() + course.slice(1).replace(/-/g, ' ')}
> description: Learn about ${course.replace(/-/g, ' ')}
> color: #4a90e2

## Introduction

> section: introduction

Welcome to the ${course.replace(/-/g, ' ')} course! This content is coming soon.
`;
      fs.writeFileSync(contentPath, minimalContent);
      console.log(`✅ Created minimal content.md for ${course}`);
    } catch (err) {
      console.error(`❌ Failed to create content.md for ${course}:`, err);
    }
  }
});

console.log('🎉 Post-build optimizations complete!');
