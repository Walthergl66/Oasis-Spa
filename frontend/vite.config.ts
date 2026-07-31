import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// La PWA de la clienta corre en 5173; el panel administrativo, en 5174.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
})
