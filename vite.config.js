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
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor'
            }
            if (id.includes('lucide-react')) {
              return 'ui-vendor'
            }
            if (id.includes('recharts')) {
              return 'chart-vendor'
            }
            // Other node_modules go into a vendor chunk
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
