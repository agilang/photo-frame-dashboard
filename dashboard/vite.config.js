import { defineConfig } from 'vite';

export default defineConfig({
  // Ensures relative paths for assets inside built index.html
  base: './', 
  build: {
    target: 'chrome106',
    cssTarget: 'chrome61',
  },
  server: {
    host: true, // Listens on all network interfaces (useful for local network testing)
  },
});