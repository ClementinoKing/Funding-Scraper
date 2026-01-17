import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks - split react packages more granularly
          if (id.includes('node_modules')) {
            // Split react-dom separately as it's large
            if (id.includes('react-dom')) {
              return 'react-dom-vendor'
            }
            // Split react-router separately
            if (id.includes('react-router')) {
              return 'react-router-vendor'
            }
            // Core react
            if (id.includes('react/') || id.includes('react\\')) {
              return 'react-core-vendor'
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-vendor'
            }
            // UI libraries
            if (id.includes('lucide-react')) {
              return 'ui-vendor'
            }
            if (id.includes('recharts')) {
              return 'chart-vendor'
            }
            if (id.includes('sonner')) {
              return 'ui-vendor'
            }
            // Other node_modules go into a vendor chunk
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})
