import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { splitVendorChunkPlugin } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

// Log build environment to help with debugging
console.log(`Building in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`Using API base: ${process.env.VITE_API_BASE || 'https://kha-boom-backend.onrender.com'}`);

// https://vitejs.dev/config/
export default defineConfig({
  // Define environment variables here
  define: {
    // Use a public API URL that supports CORS instead of localhost
    // For Netlify deployment, we need an API that accepts cross-origin requests
    'import.meta.env.VITE_API_BASE': JSON.stringify(process.env.VITE_API_BASE || 'https://kha-boom-backend.onrender.com'),
  },
  server: {
    // Configure server to handle JSX properly
    fs: {
      strict: false,
    },
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://kha-boom-backend.onrender.com',
        changeOrigin: true,
      },
      '/content': {
        target: 'https://kha-boom-backend.onrender.com',
        changeOrigin: true,
      },
      '/translations': {
        target: 'https://kha-boom-backend.onrender.com',
        changeOrigin: true,
      },
      '/assets': {
        target: 'https://kha-boom-backend.onrender.com',
        changeOrigin: true,
      },
      '/glossary': {
        target: 'https://kha-boom-backend.onrender.com',
        changeOrigin: true,
      },
      '/cache.json': {
        target: 'https://kha-boom-backend.onrender.com',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx'
      }
    }
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
        drop_console: false, // Changed to false to preserve logs
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
    react(),
    splitVendorChunkPlugin(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    process.env.ANALYZE && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  root: './'
});
