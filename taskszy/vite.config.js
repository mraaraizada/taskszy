import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/app': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/app/, ''),
      },
      '/adminzdashboard': {
        target: 'http://localhost:5175',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/adminzdashboard/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
