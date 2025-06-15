/**
 * 增强的 ESLint 配置 - 代码质量优化
 * 基于现有配置，添加更严格的质量检查规则
 */

import baseConfig from './eslint.config.js'

export default [
  // 继承现有配置
  ...baseConfig,

  // 增强的代码质量规则
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // 复杂度控制
      complexity: ['warn', { max: 10 }],
      'max-depth': ['warn', { max: 4 }],
      'max-lines-per-function': [
        'warn',
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      'max-params': ['warn', { max: 4 }],

      // 代码质量
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2, 100, 1000],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ],
      'prefer-template': 'error',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'object-shorthand': 'error',
      'prefer-destructuring': [
        'error',
        {
          array: false,
          object: true,
        },
      ],

      // 安全相关
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
    },
  },

  // Vue 特定增强规则
  {
    files: ['**/*.vue'],
    rules: {
      // 复杂度控制
      complexity: ['warn', { max: 15 }], // Vue 组件允许稍微复杂一些
      'max-depth': ['warn', { max: 4 }],
      'max-lines-per-function': [
        'warn',
        { max: 80, skipBlankLines: true, skipComments: true },
      ],

      // Vue 性能
      'vue/no-v-html': 'warn',
      'vue/require-v-for-key': 'error',
      'vue/no-use-v-if-with-v-for': 'error',

      // Vue 代码质量
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/no-unused-refs': 'error',
      'vue/no-useless-mustaches': 'error',
      'vue/no-useless-v-bind': 'error',
      'vue/prefer-true-attribute-shorthand': 'error',

      // Vue 基础规则
      'vue/no-multiple-template-root': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },
]
