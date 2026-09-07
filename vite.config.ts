import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const base = process.env.VITE_BASE_PATH || '/hqcityubus/';
const outDir = process.env.VITE_OUT_DIR || 'docs';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir,
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        schedule: resolve(import.meta.dirname, 'schedule/index.html'),
      },
    },
  },
});
