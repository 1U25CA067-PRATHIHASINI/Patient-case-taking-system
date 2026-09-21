import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
    dedupe: ['react', 'react-dom'],
  },

  build: {
    outDir: path.resolve(__dirname, './dist'),
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    strictPort: true,
    host: 'localhost',
  },

  preview: {
    port: 5173,
    host: 'localhost',
  },
});