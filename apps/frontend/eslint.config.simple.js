/**
 * 前端项目简化的 ESLint 配置
 * 基于根目录的基础配置，添加 Vue 特定规则
 */

import { baseConfig, commonIgnores, browserGlobals } from '../../eslint.base.config.js'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import typescriptParser from '@typescript-eslint/parser'

export default [
  // 忽略文件配置
  {
    ignores: [
      ...commonIgnores,
      // 前端特定忽略
      'dev-dist/**',
      'public/**',
      'public/pdf.worker.min.mjs',
      '**/prettify.js',
      '**/sorter.js',
      '**/block-navigation.js',
      'src/types/pwa.d.ts',
      'vite.config.ts',
      'uno.config.ts',
      '**/workbox-*.js',
      '**/sw.js',
    ],
  },

  // 使用基础配置
  ...baseConfig,

  // Vue 配置
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...browserGlobals,
        // Vue 特定全局变量
        __VUE_I18N_LEGACY_API__: 'readonly',
        __VUE_I18N_FULL_INSTALL__: 'readonly',
        __INTLIFY_PROD_DEVTOOLS__: 'readonly',
      },
    },
    rules: {
      // Vue 基础规则
      'vue/no-multiple-template-root': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/require-v-for-key': 'error',
      'vue/no-use-v-if-with-v-for': 'error',

      // Vue 代码质量
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/no-unused-refs': 'error',
      'vue/no-useless-mustaches': 'error',
      'vue/no-useless-v-bind': 'error',
      'vue/prefer-true-attribute-shorthand': 'error',
    },
  },

  // TypeScript 在浏览器环境的特殊配置
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: browserGlobals,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // 前端项目相对宽松
    },
  },

  // Worker 文件特殊配置
  {
    files: [
      '**/workers/**/*.ts',
      '**/worker*.ts',
      'src/workers/**/*.ts',
      '**/sw.js',
      '**/service-worker.js',
    ],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        importScripts: 'readonly',
        postMessage: 'readonly',
        onmessage: 'readonly',
        addEventListener: 'readonly',
        removeEventListener: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        clients: 'readonly',
        registration: 'readonly',
        skipWaiting: 'readonly',
      },
    },
  },

  // Electron 相关文件
  {
    files: ['electron/**/*.js', 'scripts/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...browserGlobals,
        electron: 'readonly',
      },
    },
  },

  // 类型声明文件
  {
    files: ['*.d.ts'],
    languageOptions: {
      globals: {
        NotificationOptions: 'readonly',
        Notification: 'readonly',
        Window: 'readonly',
        Document: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },
]
