import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./src/test/global-setup.ts'],
    testTimeout: 15_000,
    hookTimeout: 60_000,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary'],
      include: ['src/**'],
      exclude: ['src/test/**', 'src/scripts/**', 'src/**/*.test.ts', 'src/**/*.d.ts'],
    },
  },
});
