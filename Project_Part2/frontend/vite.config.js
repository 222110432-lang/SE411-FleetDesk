import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:8080', '/actuator': 'http://localhost:8080' },
  },
  test: {
    pool: 'threads',
    maxWorkers: 1,
    testTimeout: 15000,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/data/**'],
      reporter: ['text', 'json-summary', 'html'],
    },
  },
})
