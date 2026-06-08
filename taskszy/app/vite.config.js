import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react({
    jsxRuntime: 'automatic'
  })],
  base: mode === 'production' ? '/app/' : '/',
  server: {
    port: 5174,
    strictPort: true,
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.{js,jsx}', 'project.dashboard/src/**/*.test.{js,jsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) return 'vendor-charts';
          if (id.includes('node_modules/highcharts')) return 'vendor-highcharts';
          if (id.includes('node_modules/lottie')) return 'vendor-lottie';
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/firebase')) return 'vendor-firebase';
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/@tabler') || id.includes('node_modules/sonner')) return 'vendor-ui';
        },
      },
    },
  },
}))
