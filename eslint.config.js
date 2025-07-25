import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'

export default [
  // 忽略文件配置
  {
    ignores: [
      // 构建输出目录
      'dist/**',
      'build/**',
      'release/**',
      'coverage/**',
      '.cache/**',
      'apps/*/dist/**',
      'packages/*/dist/**',
      'tools/*/dist/**',
      'electron/dist/**',

      // 依赖和系统文件
      'node_modules/**',
      '.git/**',
      '.husky/**',
      '.vscode/**',

      // 移动端和桌面端构建文件
      'android/**',
      'ios/**',

      // 最小化文件和特殊文件
      '*.min.js',
      'apps/frontend/public/pdf.worker.min.mjs',

      // 类型声明文件（自动生成）
      '**/*.d.ts',
      'auto-imports.d.ts',

      // 配置文件（保留重要配置的检查）
      '**/eslint.config.*',
      '**/vite.config.*',
      '**/vitest.config.*',
      '**/uno.config.*',
      '**/capacitor.config.*',
      'electron-builder.config.js',
    ],
  },

  // JavaScript 基础配置
  js.configs.recommended,

  // TypeScript 文件配置
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript 严格规则（不需要类型信息）
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
      '@typescript-eslint/array-type': ['warn', { default: 'array-simple' }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',

      // JavaScript 基础规则
      'no-unused-vars': 'off', // 由 TypeScript 规则处理
      'no-undef': 'off', // TypeScript 编译器处理
      'no-useless-escape': 'warn',
      'no-prototype-builtins': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },

  // JavaScript 文件配置
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-undef': 'off',
      'no-unused-vars': 'warn',
    },
  },

  // 配置文件特殊规则
  {
    files: ['**/*.config.{js,ts,mjs}', '**/vite.config.*', '**/vitest.config.*'],
    rules: {
      'no-console': 'off',
    },
  },

  // Prettier 配置（必须放在最后）
  prettier,
]
