//ikootaclient\vite.config.js - REPLACE YOUR EXISTING FILE WITH THIS
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // ✅ CRITICAL ADDITION: Proxy API calls to your backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Your Node.js backend
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.* calls in production
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})




// //ikootaclient\vite.config.js
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })






// // vite.config.js
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     // Improve cache handling
//     hmr: {
//       overlay: false
//     },
//     // Force cache refresh
//     force: true
//   },
//   optimizeDeps: {
//     // Force re-optimization of dependencies
//     force: true,
//     include: [
//       'react',
//       'react-dom',
//       '@tanstack/react-query'
//     ]
//   },
//   build: {
//     // Clear output directory before build
//     emptyOutDir: true
//   }
// })

