import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/content': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/translations': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/assets': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/course': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/cache.json': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
