import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000, host: true, open: true },
  build: { outDir: 'dist', sourcemap: true },
  optimizeDeps: { include: ['three', 'recharts'] }
})
