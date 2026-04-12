import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  define: {
    'process.env': {}
  },
  plugins: [
    react(), 
    tailwindcss(),
    tsconfigPaths()
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true, 
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      }
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Permissions-Policy': 'camera=*, microphone=*, display-capture=*, fullscreen=*',
    },
  },
  // Exclude large libraries from pre-bundling - they load on-demand only
  optimizeDeps: {
    exclude: ['jspdf', 'jspdf-autotable']
  },
  // Split large vendor chunks to avoid single huge bundles
  build: {
    // Warn when chunks exceed 500kB (except intentionally large vendor chunks)
    chunkSizeWarningLimit: 500,
    // Target modern browsers for smaller output
    target: 'esnext',
    rollupOptions: {
      output: {
        // Minimum chunk size to reduce tiny fragments
        experimentalMinChunkSize: 10000,
        manualChunks(id) {
            // Isolate the large quotes data file
            if (id.includes('quotes')) {
                return 'data-quotes';
            }

            if (id.includes('node_modules')) {
                // Get package name handles scoped packages
                const parts = id.split('node_modules/')[1].split('/');
                const pkgName = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

                // Core React - separate to keep them cached
                if (pkgName === 'react') return 'vendor-react';
                if (pkgName === 'react-dom') return 'vendor-react-dom';
                // react-router-dom v7 uses react-router internally
                if (pkgName === 'react-router-dom' || pkgName === 'react-router') return 'vendor-react-router';

                // Large libraries - isolate them

                if (pkgName === 'framer-motion') return 'vendor-framer-motion';
                if (pkgName === 'jspdf') return 'vendor-jspdf';
                if (pkgName === 'jspdf-autotable') return 'vendor-jspdf-autotable';
                if (pkgName === 'dompurify') return 'vendor-dompurify';
                if (pkgName === 'lucide-react') return 'vendor-icons';
                if (pkgName === 'exceljs') return 'vendor-excel';

                // @tanstack/react-query
                if (pkgName.startsWith('@tanstack/react-query')) return 'vendor-query';
                
                // Form and State management
                if (['zod', 'zustand', 'react-hook-form', '@hookform/resolvers'].includes(pkgName)) {
                    return 'vendor-forms-state';
                }
                
                // @dnd-kit packages
                if (pkgName === '@dnd-kit/core' || pkgName === '@dnd-kit/sortable' || pkgName === '@dnd-kit/utilities') {
                    return 'vendor-dnd-kit';
                }
                
                // react-dnd packages (used in calendar)
                if (pkgName === 'react-dnd' || pkgName === 'react-dnd-html5-backend') {
                    return 'vendor-dnd';
                }
                
                // Google OAuth (corrected from react-oauth)
                if (pkgName === '@react-oauth/google') return 'vendor-oauth';

                // Utils
                if (['date-fns', 'axios', 'jwt-decode', 'clsx', 'tailwind-merge'].includes(pkgName)) {
                    return 'vendor-utils';
                }

                // Everything else not caught above
                return 'vendor-libs';
            }
        }
      }
    }
  }
})
