#!/usr/bin/env node

/**
 * MCP 搜索服务启动脚本
 *
 * 这个脚本启动 google-search MCP 服务器
 * 用于为应用提供真实的 Google 搜索功能
 */

import { spawn } from 'child_process'

/**
 * 启动 google-search MCP 服务器
 */
function startMCPServer() {
  console.log('🚀 启动 google-search MCP 服务器...')

  // 检查是否已安装 Playwright 浏览器
  console.log('📦 检查 Playwright 浏览器安装状态...')
  const checkBrowser = spawn('npx', ['playwright', 'install', 'chromium'], {
    stdio: 'inherit',
    shell: true,
    cwd: './google-search',
  })

  checkBrowser.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Playwright 浏览器检查完成')
      startServer()
    } else {
      console.error('❌ Playwright 浏览器安装失败')
      process.exit(1)
    }
  })

  checkBrowser.on('error', (error) => {
    console.error('❌ 检查 Playwright 浏览器时出错:', error)
    process.exit(1)
  })
}

/**
 * 启动 MCP 服务器
 */
function startServer() {
  console.log('🔍 启动 google-search MCP 服务器...')

  const serverProcess = spawn('node', ['google-search/dist/src/mcp-server.js'], {
    stdio: 'inherit',
    shell: true,
  })

  serverProcess.on('close', (code) => {
    console.log(`🛑 google-search MCP 服务器进程退出，代码: ${code}`)
  })

  serverProcess.on('error', (error) => {
    console.error('❌ google-search MCP 服务器启动失败:', error)
    process.exit(1)
  })

  // 处理进程信号
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭 google-search MCP 服务器...')
    serverProcess.kill('SIGINT')
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭 google-search MCP 服务器...')
    serverProcess.kill('SIGTERM')
    process.exit(0)
  })

  console.log('✅ google-search MCP 服务器已启动')
  console.log('💡 使用说明:')
  console.log('   - 这是真实的 Google 搜索服务')
  console.log('   - 服务器通过 MCP 协议提供搜索功能')
  console.log('   - 按 Ctrl+C 停止服务')
  console.log('')
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log('google-search MCP 服务器启动脚本')
  console.log('')
  console.log('用法:')
  console.log('  node scripts/start-mcp-search.js [选项]')
  console.log('')
  console.log('选项:')
  console.log('  --debug    启用调试模式（显示浏览器窗口）')
  console.log('  --help     显示帮助信息')
  console.log('')
  console.log('示例:')
  console.log('  node scripts/start-mcp-search.js')
  console.log('  node scripts/start-mcp-search.js --debug')
  console.log('')
}

/**
 * 启动调试模式的 MCP 服务器
 */
function startDebugServer() {
  console.log('🔍 启动 google-search MCP 服务器（调试模式）...')

  const serverProcess = spawn('node', ['google-search/dist/src/mcp-server.js'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, DEBUG: 'true' },
  })

  serverProcess.on('close', (code) => {
    console.log(`🛑 google-search MCP 服务器进程退出，代码: ${code}`)
  })

  serverProcess.on('error', (error) => {
    console.error('❌ google-search MCP 服务器启动失败:', error)
    process.exit(1)
  })

  // 处理进程信号
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭 google-search MCP 服务器...')
    serverProcess.kill('SIGINT')
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭 google-search MCP 服务器...')
    serverProcess.kill('SIGTERM')
    process.exit(0)
  })

  console.log('✅ google-search MCP 服务器已启动（调试模式）')
  console.log('💡 使用说明:')
  console.log('   - 这是真实的 Google 搜索服务')
  console.log('   - 调试模式会显示浏览器窗口')
  console.log('   - 服务器通过 MCP 协议提供搜索功能')
  console.log('   - 按 Ctrl+C 停止服务')
  console.log('')
}

// 主程序
function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help')) {
    showHelp()
    return
  }

  if (args.includes('--debug')) {
    startDebugServer()
  } else {
    startMCPServer()
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, _promise) => {
  console.error('❌ 未处理的 Promise 拒绝:', reason)
  process.exit(1)
})

// 启动程序
main()
