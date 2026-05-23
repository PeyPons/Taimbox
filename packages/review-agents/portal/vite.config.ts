import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');

export default defineConfig({
  plugins: [react()],
  /** Variables VITE_* del .env en la raíz del monorepo (Timeboxing). */
  envDir: repoRoot,
  server: { port: 5174 },
  build: { outDir: 'dist' },
});
