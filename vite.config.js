import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => ({
  root: 'src',
  base: mode === 'production' ? '/baby_keyboard_smaing_game/' : '/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    // Optimize for production
    minify: 'terser',
    sourcemap: false,
    target: 'es2015', // Support older browsers for baby games on older tablets
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      },
      output: {
        // Asset naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          if (/mp3|wav|ogg|m4a|flac/i.test(ext)) {
            return `assets/audio/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    // Compression and optimization
    cssCodeSplit: false, // Bundle all CSS into one file for faster loading
    chunkSizeWarningLimit: 1000, // Warn for chunks larger than 1MB
    // PWA optimizations
    manifest: true
  },
  server: {
    port: 3000,
    open: true,
    host: true // Allow access from mobile devices on same network
  },
  preview: {
    port: 3000,
    host: true
  },
  // Plugin configuration for PWA and optimization
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
}))