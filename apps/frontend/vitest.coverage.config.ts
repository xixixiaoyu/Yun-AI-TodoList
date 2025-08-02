import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/build/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        // 排除 E2E 测试文件
        '**/*.spec.ts',
        '**/*.e2e.ts',
        // 排除类型定义文件
        '**/types/**',
        // 排除配置文件
        '**/uno.config.ts',
        '**/vite.config.ts',
        '**/vitest.config.ts',
      ],
      include: ['src/**/*.{js,ts,vue}'],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
        // 核心业务逻辑要求更高覆盖率
        'src/composables/**': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        'src/services/**': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    // 测试超时设置
    testTimeout: 10000,
    hookTimeout: 10000,
    // 并发设置
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },
    // 报告器配置
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html',
    },
    // 监视模式配置
    watch: false,
    // 失败时停止
    bail: 0,
    // 重试配置
    retry: 1,
  },
})
