/**
 * Electron 开发环境配置
 * 用于开发环境的特殊配置和调试功能
 */

export const devConfig = {
  // 开发服务器配置
  devServer: {
    port: 3000,
    host: 'localhost',
  },

  // 窗口配置
  window: {
    // 开发环境下显示开发者工具
    openDevTools: true,
    // 开发环境下的窗口位置
    x: 100,
    y: 100,
  },

  // 热重载配置
  hotReload: {
    enabled: true,
    // 监听文件变化
    watchPaths: ['src/**/*', 'electron/**/*'],
    // 忽略的文件
    ignorePaths: ['node_modules/**/*', 'dist/**/*'],
  },

  // 调试配置
  debug: {
    // 启用详细日志
    verbose: true,
    // 启用性能监控
    performance: true,
  },
}

export default devConfig
