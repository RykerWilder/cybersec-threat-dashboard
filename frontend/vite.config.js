import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const inPackage = (id, names) =>
  names.some((name) => id.includes(`/node_modules/${name}/`) || id.includes(`\\node_modules\\${name}\\`))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Vendor code changes rarely, so keeping it in its own files lets the
        // browser reuse them from cache when only the app code changes.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (inPackage(id, ['react', 'react-dom', 'scheduler'])) return 'react'
          if (inPackage(id, ['chart.js', '@kurkle/color'])) return 'charts'
          return undefined
        },
      },
    },
  },
  server: {
    hmr: {
      overlay: false
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000', 
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
