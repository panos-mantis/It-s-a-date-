import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const apiProxy = { '/api': 'http://localhost:4000' };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
  test: {
    environment: 'jsdom',
    // Dates format in the reader's zone; pin it so expectations don't depend on the machine.
    env: { TZ: 'UTC' },
    // Absolute path so it resolves regardless of the cwd vitest is launched from.
    setupFiles: [fileURLToPath(new URL('./src/test/setup.ts', import.meta.url))],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
  },
});
