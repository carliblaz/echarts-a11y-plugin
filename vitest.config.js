import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',   // gives tests window, document, DOM APIs
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/locales/**'],
    },
  },
});
