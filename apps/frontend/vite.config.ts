import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
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
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Todo App',
        short_name: 'Todo',
        description: 'A Todo application with Pomodoro timer and AI chat',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  base: '/todo/',
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
