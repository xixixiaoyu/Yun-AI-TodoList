/**
 * 根目录 ESLint 配置
 * 使用统一的基础配置
 */

import { baseConfig, commonIgnores } from './eslint.base.config.js'

export default [
  // 忽略文件配置
  {
    ignores: commonIgnores,
  },

  // 使用基础配置
  ...baseConfig,
]
