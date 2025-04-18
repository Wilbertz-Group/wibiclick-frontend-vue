/// <reference types="vitest" />
import { fileURLToPath, URL } from 'url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue({
    reactivityTransform: true
  })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: "esnext"
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  },
  test: {
    // enable jest-like global test APIs
    globals: true,
    // simulate DOM with jsdom
    environment: 'jsdom',
    // Fix for "document is not defined" in Vue Test Utils v2.4.6+ with Vitest
    deps: {
      inline: ['@vue']
    }
  }
})
