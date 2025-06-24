import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'

// Landing page specific Vite configuration
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      imports: ['vue', 'vue-router', 'vue-i18n', '@vueuse/core'],
      dts: true,
      vueTemplate: true,
    }),
  ],

  // Build configuration for landing page
  build: {
    outDir: 'dist-landing',
    emptyOutDir: true,

    // Performance optimization
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Code splitting
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'landing.html'),
      },
      output: {
        // Chunk splitting for better caching
        manualChunks: {
          'vue-vendor': ['vue'],
          'ui-components': [
            './src/components/landing/HeroSection.vue',
            './src/components/landing/FeaturesSection.vue',
            './src/components/landing/ScreenshotsSection.vue',
            './src/components/landing/TechStackSection.vue',
            './src/components/landing/DownloadSection.vue',
            './src/components/landing/FooterSection.vue',
          ],
        },
        // Asset naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]

          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash].[ext]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return 'assets/fonts/[name]-[hash].[ext]'
          }
          if (ext === 'css') {
            return 'assets/css/[name]-[hash].[ext]'
          }
          return 'assets/[name]-[hash].[ext]'
        },
      },
    },

    // Asset optimization
    assetsInlineLimit: 4096, // 4KB
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemaps for production

    // Compression
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  },

  // Development server
  server: {
    port: 3002,
    host: true,
    open: '/landing.html',
  },

  // Preview server
  preview: {
    port: 3003,
    host: true,
    open: '/landing.html',
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // CSS configuration
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.css";`,
      },
    },
    postcss: {
      plugins: [
        // Add PostCSS plugins if needed
      ],
    },
  },

  // Optimization
  optimizeDeps: {
    include: ['vue', '@vueuse/core'],
    exclude: [
      // Exclude large dependencies that should be loaded separately
    ],
  },

  // Environment variables
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
  },

  // Asset handling
  assetsInclude: [
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.gif',
    '**/*.svg',
    '**/*.webp',
    '**/*.avif',
    '**/*.ttf',
    '**/*.woff',
    '**/*.woff2',
  ],

  // Experimental features
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `"/${filename}"` }
      } else {
        return { relative: true }
      }
    },
  },
})
