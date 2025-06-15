#!/usr/bin/env node

/**
 * Electron 构建脚本
 * 提供更好的构建体验和错误处理
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// 检查 Node.js 版本
function checkNodeVersion() {
  const nodeVersion = process.version
  const requiredVersion = '18.0.0'

  console.log(`🔍 检查 Node.js 版本: ${nodeVersion}`)

  if (nodeVersion < `v${requiredVersion}`) {
    throw new Error(`需要 Node.js >= ${requiredVersion}，当前版本: ${nodeVersion}`)
  }
}

// 检查依赖
function checkDependencies() {
  console.log('🔍 检查依赖...')

  const packageJsonPath = path.join(rootDir, 'package.json')
  if (!existsSync(packageJsonPath)) {
    throw new Error('package.json 不存在')
  }

  // 检查关键依赖
  const criticalDeps = ['electron', 'electron-builder', 'vite']
  const nodeModulesPath = path.join(rootDir, 'node_modules')

  for (const dep of criticalDeps) {
    const depPath = path.join(nodeModulesPath, dep)
    if (!existsSync(depPath)) {
      throw new Error(`缺少关键依赖: ${dep}，请运行 pnpm install`)
    }
  }
}

// 检查构建资源
function checkBuildResources() {
  console.log('🔍 检查构建资源...')

  const buildDir = path.join(rootDir, 'build')
  if (!existsSync(buildDir)) {
    console.log('📁 创建 build 目录...')
    mkdirSync(buildDir, { recursive: true })
  }

  // 检查图标文件
  const iconFiles = ['icon.png']
  const missingIcons = []

  for (const icon of iconFiles) {
    const iconPath = path.join(buildDir, icon)
    if (!existsSync(iconPath)) {
      missingIcons.push(icon)
    }
  }

  if (missingIcons.length > 0) {
    console.warn(`⚠️  缺少图标文件: ${missingIcons.join(', ')}`)
    console.warn('   构建将使用默认图标，建议添加自定义图标')
  }
}

// 清理构建目录
function clean() {
  console.log('🧹 清理构建目录...')
  execSync('pnpm run clean', { cwd: rootDir, stdio: 'inherit' })
}

// 构建渲染进程
function buildRenderer() {
  console.log('🏗️  构建渲染进程...')
  execSync('vite build', { cwd: rootDir, stdio: 'inherit' })
}

// 构建 Electron 应用
function buildElectron(platform = 'all') {
  console.log(`📦 构建 Electron 应用 (${platform})...`)

  const platformArgs = buildConfig.platforms[platform] || buildConfig.platforms.all
  const command = `electron-builder --config electron-builder.config.js ${platformArgs.join(' ')}`

  execSync(command, { cwd: rootDir, stdio: 'inherit' })
}

// 构建配置
const buildConfig = {
  platforms: {
    mac: ['--mac'],
    win: ['--win'],
    linux: ['--linux'],
    all: ['--all'],
  },

  // 构建前检查函数
  preChecks: [checkNodeVersion, checkDependencies, checkBuildResources],

  // 构建步骤函数
  buildSteps: [clean, buildRenderer, buildElectron],
}

// 主构建函数
async function build(platform = 'all') {
  const startTime = Date.now()

  try {
    console.log('🚀 开始构建 Electron 应用...')
    console.log(`📋 目标平台: ${platform}`)
    console.log('')

    // 执行构建前检查
    for (const check of buildConfig.preChecks) {
      check()
    }

    console.log('')

    // 执行构建步骤
    clean()
    buildRenderer()
    buildElectron(platform)

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    console.log('')
    console.log('✅ 构建完成!')
    console.log(`⏱️  构建耗时: ${duration}s`)
    console.log('📁 构建产物位于 release/ 目录')
  } catch (error) {
    console.error('')
    console.error('❌ 构建失败!')
    console.error(error.message)
    process.exit(1)
  }
}

// 命令行参数处理
const args = process.argv.slice(2)
const platform = args[0] || 'all'
const validPlatforms = Object.keys(buildConfig.platforms)

// 显示帮助信息
if (args.includes('--help') || args.includes('-h')) {
  console.log('🚀 Electron 构建脚本')
  console.log('')
  console.log('用法:')
  console.log('  node scripts/build-electron.js [platform]')
  console.log('')
  console.log('支持的平台:')
  console.log('  mac     - 构建 macOS 应用 (.dmg, .zip)')
  console.log('  win     - 构建 Windows 应用 (.exe)')
  console.log('  linux   - 构建 Linux 应用 (.AppImage, .deb, .rpm)')
  console.log('  all     - 构建所有平台 (默认)')
  console.log('')
  console.log('示例:')
  console.log('  node scripts/build-electron.js mac')
  console.log('  node scripts/build-electron.js win')
  console.log('  node scripts/build-electron.js')
  console.log('')
  process.exit(0)
}

if (!validPlatforms.includes(platform)) {
  console.error(`❌ 无效的平台: ${platform}`)
  console.error(`   支持的平台: ${validPlatforms.join(', ')}`)
  console.error('   使用 --help 查看帮助信息')
  process.exit(1)
}

// 执行构建
build(platform)
