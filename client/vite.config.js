// import { defineConfig } from 'vite';
// import mkcert from 'vite-plugin-mkcert';
// import wasm from 'vite-plugin-wasm';
// import path from 'path';

// export default defineConfig({
//   plugins: [mkcert(), wasm()],
//   base: '/', // for Netlify root
//   optimizeDeps: {
//     include: ['@cartridge/controller']
//   }}
// );

import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [mkcert(), wasm()],

  // Base path for production. For Netlify root, keep '/'
  base: '/',

  // Pre-bundle Dojo cartridges to avoid bare import errors
  optimizeDeps: {
    include: ['@cartridge/controller']
  },

  build: {
    // Ensure Node modules are bundled correctly for production
    commonjsOptions: {
      include: [/node_modules/]
    },

    // Rollup options (optional, but ensures no external ESM references remain)
    rollupOptions: {
      external: []
    },

    // Optional: Increase chunk size if your game is large
    chunkSizeWarningLimit: 1500
  },

  server: {
    // Development server options
    port: 5173,
    open: true
  }
})