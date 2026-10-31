import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' permite hospedar o build em qualquer subpasta (GitHub Pages, Netlify etc.)
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true, port: 5173 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as never);
