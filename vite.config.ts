import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/',
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Build optimization for better caching and performance
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': [
            'react',
            'react-dom',
            'react-router'
          ],
          'chart-vendor': [
            'recharts'
          ],
          'icon-vendor': [
            'lucide-react'
          ],
          // The app-bar dropdown is the only Radix primitive imported directly.
          // The five other entries that used to sit here named primitives
          // nothing imports, so they contributed no modules and quietly rotted
          // as the shadcn wrappers around them were deleted. vaul (the mobile
          // drawer) is deliberately NOT listed: it is reachable only from the
          // lazily-loaded MoreSheet, and pulling it into an eager vendor chunk
          // measured 6 kB worse gzipped and shipped drawer code to desktop.
          'ui-vendor': [
            '@radix-ui/react-dropdown-menu'
          ],
          'animation-vendor': [
            'motion'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  server: {
    port: 3000
  }
})