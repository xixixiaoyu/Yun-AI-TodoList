import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default [
  // 忽略文件配置
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'release/**',
      '*.min.js',
      'public/**',
      '.husky/**',
      // 不再忽略 electron 目录，而是为其单独配置
    ],
  },

  // 基础 JavaScript 配置
  js.configs.recommended,

  // TypeScript 文件配置
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Vue 相关
        __VUE_I18N_LEGACY_API__: 'readonly',
        __VUE_I18N_FULL_INSTALL__: 'readonly',
        __INTLIFY_PROD_DEVTOOLS__: 'readonly',
        // 浏览器环境
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        // Web APIs
        fetch: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        AbortController: 'readonly',
        TextDecoder: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        // DOM 类型
        Event: 'readonly',
        KeyboardEvent: 'readonly',
        MessageEvent: 'readonly',
        MediaQueryListEvent: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLDivElement: 'readonly',
        EventTarget: 'readonly',
        // Web APIs
        Notification: 'readonly',
        SpeechRecognition: 'readonly',
        webkitSpeechRecognition: 'readonly',
        SpeechRecognitionResultList: 'readonly',
        // Vue Router
        RouteLocationNormalized: 'readonly',
        NavigationGuardNext: 'readonly',
        // Node.js (for config files)
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        // Fetch API
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // 基础规则
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-debugger': 'warn',
      'no-unused-vars': 'off',

      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // 代码质量规则
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },

  // Vue 文件配置
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
        // Vue 相关
        __VUE_I18N_LEGACY_API__: 'readonly',
        __VUE_I18N_FULL_INSTALL__: 'readonly',
        __INTLIFY_PROD_DEVTOOLS__: 'readonly',
        // 浏览器环境
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        // Web APIs
        fetch: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        AbortController: 'readonly',
        TextDecoder: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        // DOM 类型
        Event: 'readonly',
        KeyboardEvent: 'readonly',
        MessageEvent: 'readonly',
        MediaQueryListEvent: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLDivElement: 'readonly',
        EventTarget: 'readonly',
        // Web APIs
        Notification: 'readonly',
        SpeechRecognition: 'readonly',
        webkitSpeechRecognition: 'readonly',
        SpeechRecognitionResultList: 'readonly',
        // Vue Router
        RouteLocationNormalized: 'readonly',
        NavigationGuardNext: 'readonly',
        // Node.js (for config files)
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        // Fetch API
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      vue,
    },
    rules: {
      // Vue 规则
      'vue/no-v-html': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',

      // 基础规则
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-debugger': 'warn',
      'no-unused-vars': 'off',

      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // 代码质量规则
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },

  // Worker 文件特殊配置
  {
    files: ['**/workers/**/*.ts', '**/worker*.ts', 'src/workers/**/*.ts'],
    languageOptions: {
      globals: {
        self: 'readonly',
        importScripts: 'readonly',
        postMessage: 'readonly',
        onmessage: 'readonly',
        addEventListener: 'readonly',
        removeEventListener: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },

  // 配置文件特殊规则
  {
    files: ['*.config.js', '*.config.ts', 'vite.config.ts', 'vitest.config.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  // Node.js 环境文件配置 (Electron 主进程、脚本等)
  {
    files: [
      'electron/**/*.js',
      'scripts/**/*.js',
      'scripts/**/*.mjs',
      '*.config.js',
      '*.config.mjs',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js 全局变量
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        // Electron 特定
        electron: 'readonly',
        // ES6+ 全局变量
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        AbortController: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // 允许在 Node.js 环境中使用 console
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  // TypeScript 声明文件特殊规则
  {
    files: ['*.d.ts'],
    languageOptions: {
      globals: {
        // DOM 类型
        NotificationOptions: 'readonly',
        Notification: 'readonly',
        // 其他全局类型
        Window: 'readonly',
        Document: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off', // TypeScript 声明文件中允许未定义的类型
    },
  },

  // Prettier 配置（必须放在最后）
  prettier,
]
