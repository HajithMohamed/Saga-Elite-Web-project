import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // load .env from the workspace root so VITE_* vars are shared with the server .env
  envDir: '../',
  server: {
    host: '0.0.0.0',
    port: 5173,
    // allow Vite to move to the next free local port when 5173 is already in use
    strictPort: false,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      '/api/v1/': {
        target: 'http://backend:5001',
        changeOrigin: true,
      }
    }
  },
  resolve : {
    alias : {
      "@":path.resolve(__dirname,"./src")
    }
  }
})
