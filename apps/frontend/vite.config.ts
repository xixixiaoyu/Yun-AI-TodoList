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
        theme_color: '#79b4a6',
        background_color: '#f8f7f6',
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
            purpose: 'any',
          },
          {
            src: './pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: './pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: './apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
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
      // 减少 workbox 日志输出
      mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
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
      vue: 'vue/dist/vue.esm-bundler.js',
    },
    // 确保正确解析共享包
    dedupe: ['vue', 'vue-router', 'vue-i18n'],
  },
  server: {
    port: 5173,
    open: false,
    cors: true,
    host: true,
    proxy: {
      '/api': {
        target: process.env.DOCKER_ENV
          ? 'http://yun-todolist-backend:3000'
          : 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    chunkSizeWarningLimit: 1500,
    // 启用 gzip 压缩
    reportCompressedSize: true,
    // 优化构建性能和兼容性
    target: 'es2020',
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
        assetFileNames: (assetInfo) => {
          // 根据文件类型分组资源
          const names = assetInfo.names || (assetInfo.name ? [assetInfo.name] : [])
          if (names.length > 0) {
            const name = names[0]
            const info = name.split('.')
            const ext = info[info.length - 1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        format: 'es',
        // 确保模块导出兼容性
        exports: 'named',
        // 避免变量名冲突
        generatedCode: {
          constBindings: true,
          arrowFunctions: true,
          objectShorthand: true,
          reservedNamesAsProps: false,
        },
        // 优化代码分割策略
        manualChunks: (id) => {
          // 第三方库分组
          if (id.includes('node_modules')) {
            // Vue 核心库
            if (
              id.includes('vue') ||
              id.includes('@vue') ||
              id.includes('vue-router') ||
              id.includes('vue-i18n')
            ) {
              return 'vue-vendor'
            }
            // 图表库
            if (id.includes('chart.js') || id.includes('chartjs')) {
              return 'chart-libs'
            }
            // 编辑器库
            if (id.includes('marked') || id.includes('highlight.js') || id.includes('mermaid')) {
              return 'editor-libs'
            }
            // 工具库
            if (
              id.includes('lodash') ||
              id.includes('date-fns') ||
              id.includes('dompurify') ||
              id.includes('@vueuse')
            ) {
              return 'utils-libs'
            }
            // 文件处理库
            if (id.includes('mammoth') || id.includes('xlsx') || id.includes('pdfjs')) {
              return 'file-libs'
            }
            // 动画库
            if (id.includes('canvas-confetti') || id.includes('sortablejs')) {
              return 'animation-libs'
            }
            // 图标库
            if (id.includes('@iconify') || id.includes('iconify')) {
              return 'icons-vendor'
            }
            // 其他第三方库
            return 'vendor'
          }

          // AI 相关服务单独分块
          if (
            id.includes('aiAnalysisService') ||
            id.includes('deepseekService') ||
            id.includes('useAIAnalysis') ||
            id.includes('useChat')
          ) {
            return 'ai-services'
          }

          // 核心服务分组（包含相关的工具函数以避免循环依赖）
          if (
            id.includes('/src/services/') &&
            (id.includes('apiClient') ||
              id.includes('authService') ||
              id.includes('todoService') ||
              id.includes('syncService'))
          ) {
            return 'core-services'
          }

          // 数据转换工具与核心服务放在一起（避免循环依赖）
          if (id.includes('/src/utils/dataTransform')) {
            return 'core-services'
          }

          // 存储服务分组
          if (id.includes('/src/services/storage/')) {
            return 'storage-services'
          }

          // 组合式函数
          if (id.includes('/src/composables/')) {
            return 'composables'
          }

          // 组件
          if (id.includes('/src/components/')) {
            return 'components'
          }

          // 工具函数
          if (id.includes('/src/utils/')) {
            return 'utils'
          }
        },
      },
    },

    // 使用 esbuild 进行更快的压缩
    minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,
    // 如果需要更好的压缩率，可以使用 terser
    // minify: 'terser',
    // terserOptions: {
    //   compress: {
    //     drop_console: process.env.NODE_ENV === 'production',
    //     drop_debugger: true,
    //     pure_funcs: ['console.log', 'console.info', 'console.debug'],
    //     passes: 2,
    //   },
    //   mangle: {
    //     safari10: true,
    //   },
    // },

    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // CSS 压缩
    cssMinify: true,

    // 模块预加载优化
    modulePreload: {
      polyfill: true,
      resolveDependencies: (_filename, deps) => {
        // 只预加载关键依赖
        return deps.filter(
          (dep) => dep.includes('vue-vendor') || dep.includes('components') || dep.includes('main')
        )
      },
    },
  },
  define: {
    __ELECTRON__: JSON.stringify(process.env.ELECTRON !== undefined),
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'vue-i18n',
      '@vueuse/core',
      '@yun-ai-todolist/shared',
      '@yun-ai-todolist/shared/types',
      '@yun-ai-todolist/shared/utils',
      '@yun-ai-todolist/shared/constants',
    ],
    exclude: [
      // 排除 MCP SDK 的 Node.js 特定模块
      '@modelcontextprotocol/sdk/client/stdio.js',
      '@modelcontextprotocol/sdk/client/stdio',
    ],
    // 强制重新构建依赖
    force: process.env.NODE_ENV === 'development',
  },
})
