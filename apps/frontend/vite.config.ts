import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

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
        categories: ['productivity', 'utilities', 'lifestyle'],
        screenshots: [
          {
            src: './screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Desktop view of Yun AI TodoList',
          },
          {
            src: './screenshot-narrow.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Mobile view of Yun AI TodoList',
          },
        ],
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
          {
            src: './apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon',
          },
        ],
        shortcuts: [
          {
            name: '新建待办',
            short_name: '新建',
            description: '快速创建新的待办事项',
            url: '/?action=new',
            icons: [{ src: './pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'AI 助手',
            short_name: 'AI',
            description: '打开 AI 助手',
            url: '/?action=ai',
            icons: [{ src: './pwa-192x192.png', sizes: '192x192' }],
          },
        ],
        prefer_related_applications: false,
        edge_side_panel: {
          preferred_width: 400,
        },
      },
      workbox: {
        globDirectory: process.env.NODE_ENV === 'production' ? 'dist' : 'dev-dist',
        globPatterns:
          process.env.NODE_ENV === 'production'
            ? ['**/*.{js,css,html,ico,png,svg,woff2}']
            : ['**/*.{js,css,html}'],
        globIgnores: ['**/node_modules/**/*'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          // API 缓存策略 - 网络优先，支持离线回退
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
          // 图片资源缓存 - 缓存优先
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // 字体文件缓存 - 缓存优先，长期缓存
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // CSS 和 JS 文件缓存 - 过期重新验证
          {
            urlPattern: /\.(?:css|js)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          // HTML 文件缓存 - 网络优先
          {
            urlPattern: /\.html$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 3,
            },
          },
          // CDN 资源缓存
          {
            urlPattern: /^https:\/\/cdn\./,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // Google Fonts 缓存
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-static-cache',
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
      // 生产环境优化
      injectRegister: 'auto',
      strategies: 'generateSW',
      selfDestroying: false,
      // 更新提示配置
      useCredentials: false,
      // 文件包含配置
      includeManifestIcons: true,
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
