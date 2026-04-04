import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    // Optimize chunk splitting for better caching and performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries to leverage browser caching
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-ui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
          ],
          'vendor-icons': ['lucide-react'],
          'vendor-utils': ['axios', 'clsx'],
        },
      },
    },
    // Increase chunk warning limit since we're optimizing
    chunkSizeWarningLimit: 1000,
    // Use default esbuild minifier (fast and efficient)
    minify: 'esbuild',
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Enable compression for dev server
    middlewareMode: false,
  },
})
