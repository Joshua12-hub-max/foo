import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic', // Automatic JSX runtime
    }), 
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
    },
  },
  // Split large vendor chunks to avoid single huge bundles
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Get package name for node_modules paths (handles scoped packages)
            const parts = id.split('node_modules/')[1].split('/');
            const pkgName = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

            // Group big libraries into their own chunks where appropriate
            if (['react', 'react-dom', 'react-router-dom'].includes(pkgName)) {
              return 'vendor-react';
            }
            if (['framer-motion', 'jspdf', 'dompurify'].includes(pkgName)) {
              return `vendor-${pkgName.replace('/', '_')}`;
            }

            // Put other node_modules into a generic vendor chunk
            return 'vendor';
          }
        }
      }
    }
  }
})
