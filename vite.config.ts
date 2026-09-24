import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:single` gera um único index.html autocontido (útil para envio/apresentação offline).
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    rollupOptions: mode === 'single' ? undefined : {
      output: { manualChunks: { react: ['react', 'react-dom'], charts: ['recharts'], motion: ['framer-motion'] } },
    },
    chunkSizeWarningLimit: 600,
  },
}));
