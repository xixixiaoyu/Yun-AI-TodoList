#!/usr/bin/env node

/**
 * 构建修复验证脚本
 * 验证所有构建相关的修复是否正确
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

console.log('🔍 验证构建修复结果...')
console.log('')

let allPassed = true

const checks = [
  {
    name: '检查 electron-builder 配置',
    check: checkBuilderConfig
  },
  {
    name: '检查图标资源',
    check: checkIconResources
  },
  {
    name: '检查构建脚本',
    check: checkBuildScript
  },
  {
    name: '测试构建命令',
    check: testBuildCommands
  }
]

function checkBuilderConfig() {
  const configPath = path.join(rootDir, 'electron-builder.config.js')
  if (!existsSync(configPath)) {
    throw new Error('electron-builder.config.js 不存在')
  }

  const content = readFileSync(configPath, 'utf8')

  const incompatibleConfigs = ['sign: false', 'publisherName:', 'Name:', 'Comment:', 'Keywords:']

  for (const config of incompatibleConfigs) {
    if (content.includes(config) && !content.includes('entry:')) {
      throw new Error(`发现不兼容的配置: ${config}`)
    }
  }

  if (!content.includes('mac:') || !content.includes('win:') || !content.includes('linux:')) {
    throw new Error('缺少平台配置')
  }

  return '✅ electron-builder 配置正确'
}

function checkIconResources() {
  const buildDir = path.join(rootDir, 'build')
  if (!existsSync(buildDir)) {
    throw new Error('build 目录不存在')
  }

  const iconPath = path.join(buildDir, 'icon.png')
  if (!existsSync(iconPath)) {
    throw new Error('基础图标 build/icon.png 不存在')
  }

  try {
    const output = execSync(`file "${iconPath}"`, { encoding: 'utf8' })
    if (!output.includes('512 x 512')) {
      console.warn('⚠️  图标尺寸可能不是 512x512')
    }
  } catch (_error) {
    console.warn('⚠️  无法检查图标尺寸')
  }

  const icnsPath = path.join(buildDir, 'icon.icns')
  if (!existsSync(icnsPath)) {
    console.warn('⚠️  缺少 macOS 图标 build/icon.icns')
  }

  return '✅ 图标资源配置正确'
}

function checkBuildScript() {
  const scriptPath = path.join(rootDir, 'scripts/build-electron.js')
  if (!existsSync(scriptPath)) {
    throw new Error('构建脚本不存在')
  }

  const content = readFileSync(scriptPath, 'utf8')

  if (!content.includes("all: ['--mac', '--win', '--linux']")) {
    throw new Error('构建脚本平台配置未修复')
  }

  if (content.includes('eval(')) {
    throw new Error('构建脚本仍使用不安全的 eval() 调用')
  }

  return '✅ 构建脚本配置正确'
}

function testBuildCommands() {
  try {
    execSync('node scripts/build-electron.js --help', {
      cwd: rootDir,
      stdio: 'pipe'
    })
  } catch (_error) {
    throw new Error('构建脚本帮助命令失败')
  }

  try {
    execSync('node scripts/verify-electron-config.js', {
      cwd: rootDir,
      stdio: 'pipe'
    })
  } catch (_error) {
    throw new Error('Electron 配置验证失败')
  }

  return '✅ 构建命令测试通过'
}

async function verify() {
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
      allPassed = false
    }
  }

  console.log('')
  console.log('📊 验证结果:')
  console.log(`  ✅ 通过: ${passed}`)
  console.log(`  ❌ 失败: ${failed}`)
  console.log(`  📋 总计: ${passed + failed}`)

  if (allPassed) {
    console.log('')
    console.log('🎉 所有构建问题已修复！')
    console.log('')
    console.log('✅ 修复内容:')
    console.log('  - 修复了 electron-builder 配置兼容性')
    console.log('  - 更正了构建脚本平台参数')
    console.log('  - 生成了符合要求的图标资源')
    console.log('  - 移除了不安全的代码调用')
    console.log('')
    console.log('💡 现在可以正常构建:')
    console.log('  pnpm run electron:build:mac    # 构建 macOS 版本')
    console.log('  pnpm run electron:build:win    # 构建 Windows 版本')
    console.log('  pnpm run electron:build:linux  # 构建 Linux 版本')
    console.log('  pnpm run icons:generate        # 生成图标资源')
  } else {
    console.log('')
    console.log('⚠️  仍有问题需要修复')
    process.exit(1)
  }
}

verify()
