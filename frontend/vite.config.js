/**
 * KhaBoom Frontend Vite Configuration
 * Simplified for Netlify compatibility
 */

const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

// Log build environment to help with debugging
console.log(`Building in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`Using API base: ${process.env.VITE_API_BASE || 'https://kha-boom-backend.onrender.com'}`);

// https://vitejs.dev/config/
module.exports = defineConfig({
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
        // Configure correct output formats
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: '[name].[hash].js',
        entryFileNames: '[name].[hash].js',
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react()
  ],
  root: './'
});
