export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 类型枚举
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复 bug
        'docs', // 文档更新
        'style', // 代码格式化（不影响代码运行的变动）
        'refactor', // 重构（既不是新增功能，也不是修改 bug 的代码变动）
        'perf', // 性能优化
        'test', // 增加测试
        'chore', // 构建过程或辅助工具的变动
        'ci', // CI 配置文件和脚本的变动
        'build', // 影响构建系统或外部依赖的变动
        'revert', // 回滚 commit
      ],
    ],
    // 主题长度限制
    'subject-max-length': [2, 'always', 100],
    // 主题不能为空
    'subject-empty': [2, 'never'],
    // 类型不能为空
    'type-empty': [2, 'never'],
    // 主题格式（首字母小写）
    'subject-case': [2, 'always', 'lower-case'],
    // 头部最大长度
    'header-max-length': [2, 'always', 100],
  },
}
