import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    UnoCSS(),
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'vue-i18n', '@vueuse/core'],
      dts: true,
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
        globalsPropValue: true,
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Yun AI TodoList',
        short_name: 'TodoList',
        description: 'AI-powered todo application with Pomodoro timer and smart features',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: './',
        start_url: './',
        lang: 'zh-CN',
        icons: [
          {
            src: './pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: './pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: './pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globDirectory: process.env.NODE_ENV === 'production' ? 'dist' : 'dev-dist',
        globPatterns:
          process.env.NODE_ENV === 'production'
            ? ['**/*.{js,css,html,ico,png,svg,woff2}']
            : ['**/*.{js,css,html}'],
        globIgnores: ['**/node_modules/**/*'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
        suppressWarnings: true,
      },
    }),
  ],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('../../packages/shared/src', import.meta.url)),
    },
  },
  server: {
    port: 3001,
    open: true,
    cors: true,
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      external: [
        // 排除 MCP SDK 的 Node.js 特定模块
        '@modelcontextprotocol/sdk/client/stdio.js',
        '@modelcontextprotocol/sdk/client/stdio',
        'node:stream',
        'node:process',
        'child_process',
        'cross-spawn',
      ],
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'vue-i18n'],
          chart: ['chart.js', 'chartjs-chart-matrix'],
          utils: ['lodash-es', 'date-fns', '@vueuse/core'],
          ui: ['canvas-confetti', 'dompurify'],
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },

    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },

    cssCodeSplit: true,

    modulePreload: {
      polyfill: true,
    },
  },
  define: {
    __CAPACITOR__: JSON.stringify(process.env.CAPACITOR !== undefined),
    __ELECTRON__: JSON.stringify(process.env.ELECTRON !== undefined),
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'vue-i18n', '@vueuse/core'],
    exclude: [
      // 排除 MCP SDK 的 Node.js 特定模块
      '@modelcontextprotocol/sdk/client/stdio.js',
      '@modelcontextprotocol/sdk/client/stdio',
    ],
  },
})
