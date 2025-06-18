import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'

export default [
  // 忽略文件配置
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'release/**',
      '*.min.js',
      'build/**',
      '.cache/**',
      'android/**',
      'ios/**',
      'electron/dist/**',
      'apps/*/dist/**',
      'packages/*/dist/**',
      'tools/*/dist/**',
      '**/*.d.ts',
      '.husky/**',
      '.vscode/**',
      '.git/**',
      'scripts/**',
      'tools/**',
      'electron/**',
      'google-search/**',
      '**/*.config.{js,ts,mjs}',
      '**/vite.config.*',
      '**/vitest.config.*',
      '**/eslint.config.*',
      '**/uno.config.*',
      '**/capacitor.config.*',
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
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-useless-escape': 'off',
      'no-prototype-builtins': 'off',
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
