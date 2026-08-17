import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    // Silences Dart Sass's "legacy-js-api" deprecation warning - cosmetic
    // only, the `sass` package (not `sass-embedded`) supports this API.
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Dev-only fallback for relative /api calls.
      '/api': {
        target: 'https://yechim-backend.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
