import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El panel corre en 5174 para poder levantarlo junto a la PWA de la clienta
// (5173). Ambos orígenes están declarados en CORS_ORIGIN del backend.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174, strictPort: true },
})
