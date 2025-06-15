#!/usr/bin/env node

/**
 * Electron 配置验证脚本
 * 验证所有 Electron 相关配置是否正确
 */

import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// 验证配置
const checks = [
  {
    name: '检查 package.json 配置',
    check: checkPackageJson,
  },
  {
    name: '检查 Electron 主进程文件',
    check: checkMainProcess,
  },
  {
    name: '检查预加载脚本',
    check: checkPreloadScript,
  },
  {
    name: '检查构建配置',
    check: checkBuilderConfig,
  },
  {
    name: '检查构建资源',
    check: checkBuildResources,
  },
  {
    name: '检查安全配置',
    check: checkSecurityConfig,
  },
]

function checkPackageJson() {
  const packagePath = path.join(rootDir, 'package.json')
  if (!existsSync(packagePath)) {
    throw new Error('package.json 不存在')
  }

  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))

  // 检查主入口
  if (pkg.main !== 'electron/main.js') {
    throw new Error(`主入口配置错误: ${pkg.main}，应为 electron/main.js`)
  }

  // 检查必要的依赖
  const requiredDeps = ['electron', 'electron-builder', 'concurrently']
  for (const dep of requiredDeps) {
    if (!pkg.devDependencies[dep]) {
      throw new Error(`缺少必要依赖: ${dep}`)
    }
  }

  // 检查脚本
  const requiredScripts = [
    'electron:serve',
    'electron:build',
    'electron:build:mac',
    'electron:build:win',
    'electron:build:linux',
  ]

  for (const script of requiredScripts) {
    if (!pkg.scripts[script]) {
      throw new Error(`缺少脚本: ${script}`)
    }
  }

  return '✅ package.json 配置正确'
}

function checkMainProcess() {
  const mainPath = path.join(rootDir, 'electron/main.js')
  if (!existsSync(mainPath)) {
    throw new Error('electron/main.js 不存在')
  }

  const content = readFileSync(mainPath, 'utf8')

  // 检查安全配置
  const securityChecks = [
    'nodeIntegration: false',
    'contextIsolation: true',
    'webSecurity: true',
    'enableRemoteModule: false',
  ]

  for (const check of securityChecks) {
    if (!content.includes(check)) {
      throw new Error(`主进程缺少安全配置: ${check}`)
    }
  }

  return '✅ 主进程配置正确'
}

function checkPreloadScript() {
  const preloadPath = path.join(rootDir, 'electron/preload.js')
  if (!existsSync(preloadPath)) {
    throw new Error('electron/preload.js 不存在')
  }

  const content = readFileSync(preloadPath, 'utf8')

  // 检查关键配置
  const requiredFeatures = ['contextBridge', 'exposeInMainWorld', 'ALLOWED_ENV_VARS']

  for (const feature of requiredFeatures) {
    if (!content.includes(feature)) {
      throw new Error(`预加载脚本缺少功能: ${feature}`)
    }
  }

  return '✅ 预加载脚本配置正确'
}

function checkBuilderConfig() {
  const configPath = path.join(rootDir, 'electron-builder.config.js')
  if (!existsSync(configPath)) {
    throw new Error('electron-builder.config.js 不存在')
  }

  const content = readFileSync(configPath, 'utf8')

  // 检查关键配置
  const requiredConfigs = ['appId', 'productName', 'compression', 'asar: true']

  for (const config of requiredConfigs) {
    if (!content.includes(config)) {
      throw new Error(`构建配置缺少: ${config}`)
    }
  }

  return '✅ 构建配置正确'
}

function checkBuildResources() {
  const buildDir = path.join(rootDir, 'build')
  if (!existsSync(buildDir)) {
    throw new Error('build 目录不存在')
  }

  // 检查权限文件
  const entitlementsPath = path.join(buildDir, 'entitlements.mac.plist')
  if (!existsSync(entitlementsPath)) {
    throw new Error('macOS 权限文件不存在')
  }

  // 检查图标文件
  const iconPath = path.join(buildDir, 'icon.png')
  if (!existsSync(iconPath)) {
    console.warn('⚠️  缺少图标文件 build/icon.png')
  }

  return '✅ 构建资源配置正确'
}

function checkSecurityConfig() {
  // 检查是否存在过时的配置文件
  const oldConfigPath = path.join(rootDir, 'vue.config.js')
  if (existsSync(oldConfigPath)) {
    throw new Error('发现过时的配置文件 vue.config.js，应该删除')
  }

  return '✅ 安全配置正确'
}

// 执行验证
async function verify() {
  console.log('🔍 开始验证 Electron 配置...')
  console.log('')

  let passed = 0
  let failed = 0

  for (const { name, check } of checks) {
    try {
      const result = check()
      console.log(`${result} - ${name}`)
      passed++
    } catch (error) {
      console.error(`❌ ${error.message} - ${name}`)
      failed++
    }
  }

  console.log('')
  console.log('📊 验证结果:')
  console.log(`  ✅ 通过: ${passed}`)
  console.log(`  ❌ 失败: ${failed}`)
  console.log(`  📋 总计: ${passed + failed}`)

  if (failed === 0) {
    console.log('')
    console.log('🎉 所有配置验证通过！')
    console.log('💡 可以开始使用 Electron 开发了')
    console.log('')
    console.log('常用命令:')
    console.log('  pnpm run electron:serve     # 启动开发服务器')
    console.log('  pnpm run electron:build     # 构建应用')
    console.log('  pnpm run electron:build mac # 构建 macOS 版本')
  } else {
    console.log('')
    console.log('⚠️  发现配置问题，请修复后重新验证')
    process.exit(1)
  }
}

verify()
