/**
 * KhaBoom Frontend Vite Configuration
 * Simplified for Netlify compatibility
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log build environment to help with debugging
console.log(`Building in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`Using API base: ${process.env.VITE_API_BASE || 'https://kha-boom-backend.onrender.com'}`);

// https://vitejs.dev/config/
export default defineConfig({
  // Define environment variables here
  define: {
    // Use a public API URL that supports CORS instead of localhost
    'import.meta.env.VITE_API_BASE': JSON.stringify(process.env.VITE_API_BASE || 'https://kha-boom-backend.onrender.com'),
  },
  server: {
    // Configure server to handle JSX properly
    fs: {
      strict: false,
    },
    port: 3000,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/javascript; charset=utf-8',
    },
  },
  build: {
    // Ensure modules are handled correctly
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    outDir: 'dist',
    cssCodeSplit: true,
    reportCompressedSize: false, // Improves build speed
    sourcemap: false, // Disable for production
    minify: 'terser',
    terserOptions: {
      compress: {
        // Preserve console.logs for better debugging in production
        drop_console: false,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Ensure correct MIME types in output
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion'],
          'utility-vendor': ['axios'],
        },
        // Configure correct output formats and ensure proper extensions
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: '[name].[hash].js',
        entryFileNames: '[name].[hash].js',
        // Force all JSX files to be transformed into JS files
        format: 'es'
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react(),
    {
      name: 'fix-jsx-mime-type',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Fix MIME type for JSX files
          if (req.url.endsWith('.jsx') || req.url.includes('.jsx?')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          }
          next();
        });
      },
      // Add a hook to ensure correct MIME types in the built files
      writeBundle() {
        // Create a .htaccess file to ensure JSX files are served with correct MIME type
        const htaccessContent = `
# Proper MIME type for all files
<IfModule mod_mime.c>
  # JavaScript
  AddType application/javascript js
  AddType application/javascript jsx
  AddType application/javascript mjs
  AddType application/javascript ts
  AddType application/javascript tsx
  
  # Add proper types for module scripts
  <FilesMatch "\\.(jsx|mjs|js|ts|tsx)$">
    Header set Content-Type "application/javascript; charset=utf-8"
  </FilesMatch>
</IfModule>

# Force MIME types even if server doesn't have mod_mime
<IfModule !mod_mime.c>
  <FilesMatch "\\.(jsx|js|mjs|ts|tsx)$">
    ForceType application/javascript
  </FilesMatch>
</IfModule>
        `;
        
        // Write the .htaccess file to the dist directory
        if (!fs.existsSync('dist')) {
          fs.mkdirSync('dist', { recursive: true });
        }
        fs.writeFileSync(path.join('dist', '.htaccess'), htaccessContent);
        
        console.log('✅ Added .htaccess file for proper MIME types');
        
        // Create a custom server routing file for Netlify
        const redirectsContent = `
# Proper MIME types for JavaScript modules
/*.js
  Content-Type: application/javascript; charset=utf-8

/*.jsx
  Content-Type: application/javascript; charset=utf-8

/*.mjs
  Content-Type: application/javascript; charset=utf-8

/*.ts
  Content-Type: application/javascript; charset=utf-8

/*.tsx
  Content-Type: application/javascript; charset=utf-8

# Handle SPA routing
/*
  Rewrite /index.html
  Status: 200
`;

        fs.writeFileSync(path.join('dist', '_redirects'), redirectsContent);
        console.log('✅ Added _redirects file for Netlify MIME type handling');
      }
    }
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  root: './'
});
