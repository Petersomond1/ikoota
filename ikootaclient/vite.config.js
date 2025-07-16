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



import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
