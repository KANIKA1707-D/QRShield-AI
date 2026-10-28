import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for React project
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow the dev server to be accessed from the backend CORS config if needed
    port: 5173,
  },
});
