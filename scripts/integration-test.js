#!/usr/bin/env node

/**
 * 集成测试脚本
 * 测试 Electron 和 PWA 功能，验证配置正确性
 */

import { execSync, spawn } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
}

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`
}

// 测试配置
const testConfig = {
  // 测试超时时间
  timeouts: {
    build: 300000, // 5 minutes
    start: 60000, // 1 minute
    test: 30000, // 30 seconds
  },

  // 测试端口
  ports: {
    frontend: 3001,
    backend: 3000,
    electron: 3002,
  },

  // 必需的文件
  requiredFiles: [
    'package.json',
    'electron/main.js',
    'electron/preload.js',
    'electron-builder.config.js',
    'apps/frontend/package.json',
    'apps/frontend/vite.config.ts',
    'apps/frontend/dist/index.html',
    'apps/frontend/dist/manifest.webmanifest',
  ],
}

class IntegrationTester {
  constructor() {
    this.results = {
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
    }
    this.processes = []
  }

  async run() {
    console.log(colorize('🧪 开始集成测试...', 'blue'))
    console.log('')

    try {
      await this.checkPrerequisites()
      await this.testBuildProcess()
      await this.testElectronApp()
      await this.testPWAFeatures()
      await this.testSecurity()
      await this.testPerformance()

      this.generateTestReport()
    } catch (error) {
      console.error(colorize('❌ 集成测试失败:', 'red'), error.message)
      process.exit(1)
    } finally {
      this.cleanup()
    }
  }

  async checkPrerequisites() {
    console.log(colorize('📋 检查前置条件...', 'cyan'))

    // 检查必需文件
    for (const file of testConfig.requiredFiles) {
      const filePath = path.join(rootDir, file)
      if (existsSync(filePath)) {
        this.addTest('file-exists', `文件存在: ${file}`, 'passed')
      } else {
        this.addTest('file-exists', `文件缺失: ${file}`, 'failed')
      }
    }

    // 检查依赖项
    try {
      execSync('pnpm --version', { stdio: 'pipe' })
      this.addTest('pnpm-available', 'pnpm 可用', 'passed')
    } catch (error) {
      this.addTest('pnpm-available', 'pnpm 不可用', 'failed')
    }

    try {
      execSync('node --version', { stdio: 'pipe' })
      this.addTest('node-available', 'Node.js 可用', 'passed')
    } catch (error) {
      this.addTest('node-available', 'Node.js 不可用', 'failed')
    }

    console.log('✅ 前置条件检查完成')
  }

  async testBuildProcess() {
    console.log(colorize('🏗️  测试构建过程...', 'cyan'))

    try {
      // 测试前端构建
      console.log('  构建前端应用...')
      execSync('pnpm --filter frontend build', {
        cwd: rootDir,
        stdio: 'pipe',
        timeout: testConfig.timeouts.build,
      })

      // 验证构建产物
      const distPath = path.join(rootDir, 'apps/frontend/dist')
      const indexPath = path.join(distPath, 'index.html')
      const manifestPath = path.join(distPath, 'manifest.webmanifest')

      if (existsSync(indexPath)) {
        this.addTest('frontend-build', '前端构建成功', 'passed')
      } else {
        this.addTest('frontend-build', '前端构建失败 - index.html 不存在', 'failed')
      }

      if (existsSync(manifestPath)) {
        this.addTest('pwa-manifest', 'PWA manifest 生成成功', 'passed')
      } else {
        this.addTest('pwa-manifest', 'PWA manifest 生成失败', 'failed')
      }

      // 测试 Electron 构建验证
      console.log('  验证 Electron 配置...')
      execSync('node scripts/verify-electron-config.js', {
        cwd: rootDir,
        stdio: 'pipe',
      })
      this.addTest('electron-config', 'Electron 配置验证通过', 'passed')
    } catch (error) {
      this.addTest('build-process', `构建过程失败: ${error.message}`, 'failed')
    }

    console.log('✅ 构建过程测试完成')
  }

  async testElectronApp() {
    console.log(colorize('⚡ 测试 Electron 应用...', 'cyan'))

    try {
      // 检查 Electron 主进程文件
      const mainPath = path.join(rootDir, 'electron/main.js')
      const content = readFileSync(mainPath, 'utf8')

      // 检查安全配置
      const securityChecks = [
        'nodeIntegration: false',
        'contextIsolation: true',
        'webSecurity: true',
      ]

      for (const check of securityChecks) {
        if (content.includes(check)) {
          this.addTest('electron-security', `安全配置正确: ${check}`, 'passed')
        } else {
          this.addTest('electron-security', `安全配置缺失: ${check}`, 'failed')
        }
      }

      // 检查 preload 脚本
      const preloadPath = path.join(rootDir, 'electron/preload.js')
      if (existsSync(preloadPath)) {
        this.addTest('electron-preload', 'Preload 脚本存在', 'passed')
      } else {
        this.addTest('electron-preload', 'Preload 脚本缺失', 'failed')
      }

      // 测试 Electron 打包配置
      const builderConfigPath = path.join(rootDir, 'electron-builder.config.js')
      if (existsSync(builderConfigPath)) {
        this.addTest('electron-builder-config', 'Electron Builder 配置存在', 'passed')
      } else {
        this.addTest('electron-builder-config', 'Electron Builder 配置缺失', 'failed')
      }
    } catch (error) {
      this.addTest('electron-app', `Electron 应用测试失败: ${error.message}`, 'failed')
    }

    console.log('✅ Electron 应用测试完成')
  }

  async testPWAFeatures() {
    console.log(colorize('📱 测试 PWA 功能...', 'cyan'))

    try {
      // 检查 Service Worker
      const distPath = path.join(rootDir, 'apps/frontend/dist')
      const swPath = path.join(distPath, 'sw.js')

      if (existsSync(swPath)) {
        this.addTest('pwa-service-worker', 'Service Worker 文件存在', 'passed')
      } else {
        this.addTest('pwa-service-worker', 'Service Worker 文件缺失', 'failed')
      }

      // 检查 Web App Manifest
      const manifestPath = path.join(distPath, 'manifest.webmanifest')
      if (existsSync(manifestPath)) {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

        const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons']
        for (const field of requiredFields) {
          if (manifest[field]) {
            this.addTest('pwa-manifest-field', `Manifest 字段存在: ${field}`, 'passed')
          } else {
            this.addTest('pwa-manifest-field', `Manifest 字段缺失: ${field}`, 'failed')
          }
        }

        // 检查图标
        if (manifest.icons && manifest.icons.length > 0) {
          this.addTest('pwa-icons', `PWA 图标配置正确 (${manifest.icons.length} 个)`, 'passed')
        } else {
          this.addTest('pwa-icons', 'PWA 图标配置缺失', 'failed')
        }
      }

      // 检查 PWA 相关文件
      const pwaFiles = ['pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png']
      for (const file of pwaFiles) {
        const filePath = path.join(rootDir, 'apps/frontend/public', file)
        if (existsSync(filePath)) {
          this.addTest('pwa-assets', `PWA 资源存在: ${file}`, 'passed')
        } else {
          this.addTest('pwa-assets', `PWA 资源缺失: ${file}`, 'failed')
        }
      }
    } catch (error) {
      this.addTest('pwa-features', `PWA 功能测试失败: ${error.message}`, 'failed')
    }

    console.log('✅ PWA 功能测试完成')
  }

  async testSecurity() {
    console.log(colorize('🔒 测试安全配置...', 'cyan'))

    try {
      // 运行安全审计
      execSync('node scripts/security-audit.js', {
        cwd: rootDir,
        stdio: 'pipe',
      })
      this.addTest('security-audit', '安全审计通过', 'passed')
    } catch (error) {
      this.addTest('security-audit', '安全审计失败', 'failed')
    }

    try {
      // 检查依赖项安全性
      execSync('pnpm audit --audit-level moderate', {
        cwd: rootDir,
        stdio: 'pipe',
      })
      this.addTest('dependency-security', '依赖项安全检查通过', 'passed')
    } catch (error) {
      // pnpm audit 在发现漏洞时返回非零退出码
      this.addTest('dependency-security', '发现依赖项安全问题', 'failed')
    }

    console.log('✅ 安全配置测试完成')
  }

  async testPerformance() {
    console.log(colorize('⚡ 测试性能配置...', 'cyan'))

    try {
      // 运行性能分析
      execSync('node scripts/performance-optimizer.js', {
        cwd: rootDir,
        stdio: 'pipe',
      })
      this.addTest('performance-analysis', '性能分析通过', 'passed')
    } catch (error) {
      this.addTest('performance-analysis', '性能分析失败', 'failed')
    }

    // 检查构建产物大小
    const distPath = path.join(rootDir, 'apps/frontend/dist')
    if (existsSync(distPath)) {
      try {
        const sizeOutput = execSync(`du -sh "${distPath}"`, { encoding: 'utf8' })
        const size = sizeOutput.split('\t')[0]
        this.addTest('bundle-size', `构建产物大小: ${size}`, 'passed')
      } catch (error) {
        this.addTest('bundle-size', '无法获取构建产物大小', 'skipped')
      }
    }

    console.log('✅ 性能配置测试完成')
  }

  addTest(category, description, status) {
    this.results.tests.push({ category, description, status })

    switch (status) {
      case 'passed':
        this.results.passed++
        break
      case 'failed':
        this.results.failed++
        break
      case 'skipped':
        this.results.skipped++
        break
    }
  }

  cleanup() {
    // 清理启动的进程
    for (const process of this.processes) {
      try {
        process.kill()
      } catch (error) {
        // 忽略清理错误
      }
    }
  }

  generateTestReport() {
    console.log('')
    console.log(colorize('📊 集成测试报告', 'magenta'))
    console.log('='.repeat(50))

    // 测试统计
    const total = this.results.passed + this.results.failed + this.results.skipped
    console.log(`总测试数: ${total}`)
    console.log(colorize(`通过: ${this.results.passed}`, 'green'))
    console.log(colorize(`失败: ${this.results.failed}`, 'red'))
    console.log(colorize(`跳过: ${this.results.skipped}`, 'yellow'))

    const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0
    console.log(`成功率: ${successRate}%`)
    console.log('')

    // 按类别分组显示测试结果
    const categories = {}
    for (const test of this.results.tests) {
      if (!categories[test.category]) {
        categories[test.category] = []
      }
      categories[test.category].push(test)
    }

    for (const [category, tests] of Object.entries(categories)) {
      console.log(colorize(`${category}:`, 'blue'))
      for (const test of tests) {
        const statusIcon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️'
        const statusColor =
          test.status === 'passed' ? 'green' : test.status === 'failed' ? 'red' : 'yellow'
        console.log(`  ${statusIcon} ${colorize(test.description, statusColor)}`)
      }
      console.log('')
    }

    // 总结
    if (this.results.failed === 0) {
      console.log(colorize('🎉 所有测试通过！Electron 和 PWA 配置正确。', 'green'))
    } else {
      console.log(
        colorize(`⚠️  发现 ${this.results.failed} 个问题，建议修复后重新测试。`, 'yellow')
      )
    }
  }
}

// 运行集成测试
const tester = new IntegrationTester()
tester.run()
