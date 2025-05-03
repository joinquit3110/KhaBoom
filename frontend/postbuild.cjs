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
  Access-Control-Allow-Origin: https://kha-boom-backend.onrender.com
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS

/*.js
  Cache-Control: public, max-age=31536000
  Content-Type: application/javascript; charset=utf-8

/*.css
  Cache-Control: public, max-age=31536000
  Content-Type: text/css; charset=utf-8

/*.woff2
  Cache-Control: public, max-age=31536000

/assets/*
  Cache-Control: public, max-age=31536000
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

console.log('🎉 Post-build optimizations complete!');
