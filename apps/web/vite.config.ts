import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replaceAll('\\', '/');
          if (!normalized.includes('node_modules')) return undefined;
          if (
            normalized.includes('/react/') ||
            normalized.includes('/react-dom/') ||
            normalized.includes('/react-router') ||
            normalized.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }
          if (normalized.includes('@tanstack/react-query') || normalized.includes('/axios/')) {
            return 'vendor-data';
          }
          if (normalized.includes('/lucide-react/')) {
            return 'vendor-icons';
          }
          if (
            normalized.includes('/recharts/') ||
            normalized.includes('/d3-') ||
            normalized.includes('/victory-vendor/')
          ) {
            return 'vendor-charts';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
