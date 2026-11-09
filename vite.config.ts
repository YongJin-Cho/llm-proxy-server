import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: 'ui/index.html',
    },
    outDir: 'dist/ui',
    emptyOutDir: true,
  },
});
