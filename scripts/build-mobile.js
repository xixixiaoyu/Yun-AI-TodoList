#!/usr/bin/env node

/**
 * 移动端构建脚本
 * 用于构建和打包移动端应用
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const platform = process.argv[2] || 'android'
const action = process.argv[3] || 'build'

console.log('📱 移动端构建脚本')
console.log(`平台: ${platform}`)
console.log(`操作: ${action}`)
console.log('='.repeat(50))

function checkNodeVersion() {
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])

  if (majorVersion < 18) {
    throw new Error(`需要 Node.js >= 18.0.0，当前版本: ${nodeVersion}`)
  }

  console.log(`✅ Node.js 版本检查通过: ${nodeVersion}`)
}

function checkDependencies() {
  console.log('🔍 检查依赖...')

  const packageJsonPath = path.join(rootDir, 'package.json')
  if (!existsSync(packageJsonPath)) {
    throw new Error('package.json 不存在')
  }

  const criticalDeps = ['@capacitor/core', '@capacitor/cli', 'vite']
  const nodeModulesPath = path.join(rootDir, 'node_modules')

  for (const dep of criticalDeps) {
    const depPath = path.join(nodeModulesPath, dep)
    if (!existsSync(depPath)) {
      throw new Error(`缺少关键依赖: ${dep}，请运行 pnpm install`)
    }
  }

  console.log('✅ 依赖检查通过')
}

function checkPlatformDependencies(platform) {
  console.log(`🔍 检查 ${platform} 平台依赖...`)

  const platformDeps = {
    android: ['@capacitor/android'],
    ios: ['@capacitor/ios']
  }

  const deps = platformDeps[platform]
  if (!deps) {
    throw new Error(`不支持的平台: ${platform}`)
  }

  const nodeModulesPath = path.join(rootDir, 'node_modules')

  for (const dep of deps) {
    const depPath = path.join(nodeModulesPath, dep)
    if (!existsSync(depPath)) {
      throw new Error(`缺少平台依赖: ${dep}，请运行 pnpm install`)
    }
  }

  console.log(`✅ ${platform} 平台依赖检查通过`)
}

function checkPlatformDirectory(platform) {
  console.log(`🔍 检查 ${platform} 平台目录...`)

  const platformDir = path.join(rootDir, platform)
  if (!existsSync(platformDir)) {
    console.log(`📁 ${platform} 平台目录不存在，正在创建...`)
    execSync(`npx cap add ${platform}`, { cwd: rootDir, stdio: 'inherit' })
  }

  console.log(`✅ ${platform} 平台目录检查通过`)
}

function clean() {
  console.log('🧹 清理构建目录...')
  execSync('pnpm run clean', { cwd: rootDir, stdio: 'inherit' })
}

function buildWeb() {
  console.log('🏗️  构建 Web 应用...')
  execSync('pnpm run build', { cwd: rootDir, stdio: 'inherit' })
}

function syncMobile(platform) {
  console.log(`📱 同步到 ${platform} 平台...`)
  execSync(`npx cap sync ${platform}`, { cwd: rootDir, stdio: 'inherit' })
}

function openIDE(platform) {
  console.log(`🚀 打开 ${platform} IDE...`)
  execSync(`npx cap open ${platform}`, { cwd: rootDir, stdio: 'inherit' })
}

function runApp(platform) {
  console.log(`▶️  运行 ${platform} 应用...`)
  execSync(`npx cap run ${platform}`, { cwd: rootDir, stdio: 'inherit' })
}

const buildConfig = {
  platforms: ['android', 'ios'],

  preChecks: [
    checkNodeVersion,
    checkDependencies,
    platform => checkPlatformDependencies(platform),
    platform => checkPlatformDirectory(platform)
  ],

  buildSteps: {
    build: [clean, buildWeb, syncMobile],
    sync: [buildWeb, syncMobile],
    open: [openIDE],
    run: [runApp]
  }
}

async function main() {
  try {
    if (!buildConfig.platforms.includes(platform)) {
      throw new Error(`不支持的平台: ${platform}。支持的平台: ${buildConfig.platforms.join(', ')}`)
    }

    if (!Object.keys(buildConfig.buildSteps).includes(action)) {
      throw new Error(
        `不支持的操作: ${action}。支持的操作: ${Object.keys(buildConfig.buildSteps).join(', ')}`
      )
    }

    console.log('🔍 执行预检查...')
    for (const check of buildConfig.preChecks) {
      if (check.length > 0) {
        check(platform)
      } else {
        check()
      }
    }

    console.log(`🚀 执行 ${action} 操作...`)
    const steps = buildConfig.buildSteps[action]

    for (const step of steps) {
      if (step.length > 0) {
        step(platform)
      } else {
        step()
      }
    }

    console.log('='.repeat(50))
    console.log(`✅ ${platform} ${action} 操作完成！`)

    if (action === 'build') {
      console.log(`💡 接下来可以运行:`)
      console.log(`   pnpm mobile:${platform} - 打开 ${platform} IDE`)
      console.log(`   pnpm mobile:run:${platform} - 直接运行应用`)
    }
  } catch (error) {
    console.error('❌ 构建失败:', error.message)
    process.exit(1)
  }
}

main()
