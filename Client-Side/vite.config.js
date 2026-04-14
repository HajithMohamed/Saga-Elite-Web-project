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
    strictPort: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      clientPort: 5173,
    },
  },
  resolve : {
    alias : {
      "@":path.resolve(__dirname,"./src")
    }
  }
})
