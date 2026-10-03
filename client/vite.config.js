import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api and /uploads are proxied to the Express server so no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
