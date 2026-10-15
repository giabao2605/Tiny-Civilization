import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Pages project sites serve assets under /Tiny-Civilization/, while local dev stays at /.
  base: process.env.GITHUB_PAGES === 'true' ? '/Tiny-Civilization/' : '/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
