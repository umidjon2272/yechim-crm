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
      // Dev-only: proxies to backend/mock-server so cookies stay same-origin.
      // Point this at a real backend later by changing the target, or remove
      // the proxy and set VITE_API_BASE_URL to the real API's absolute URL.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
