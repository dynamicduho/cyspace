import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'process.env': {} // provides an empty object to prevent errors
  }
});
