import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/urex/', // 适配GitHub Pages
  define: {
    // 构建时内联，确保部署产物中资源路径一定是 /urex/xxx
    __APP_BASE_URL__: JSON.stringify('/urex/'),
  },
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}) 