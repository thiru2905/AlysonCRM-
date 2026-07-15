import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname, 'src/web'),
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 8821,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8820',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/web'),
    emptyOutDir: true,
  },
});
