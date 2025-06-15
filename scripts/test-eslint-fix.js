#!/usr/bin/env node

/**
 * ESLint 修复验证脚本
 * 验证所有 ESLint 问题是否已修复
 */

import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const testFiles = [
  'electron/main.js',
  'electron/preload.js',
  'electron/dev-config.js',
  'scripts/build-electron.js',
  'scripts/verify-electron-config.js',
  'src/types/electron.d.ts'
]

console.log('🔍 验证 ESLint 修复结果...')
console.log('')

let allPassed = true

for (const file of testFiles) {
  const filePath = path.join(rootDir, file)

  try {
    console.log(`📄 检查 ${file}...`)

    execSync(`npx eslint "${filePath}" --no-error-on-unmatched-pattern`, {
      cwd: rootDir,
      stdio: 'pipe'
    })

    console.log(`  ✅ ${file} - 通过`)
  } catch (error) {
    console.log(`  ❌ ${file} - 失败`)
    console.log(`     错误: ${error.message}`)
    allPassed = false
  }
}

console.log('')

try {
  console.log('🔧 测试 lint-staged 配置...')

  execSync('git add electron/main.js', { cwd: rootDir, stdio: 'pipe' })

  execSync('pnpm lint-staged', { cwd: rootDir, stdio: 'pipe' })

  console.log('  ✅ lint-staged 配置正常')
} catch (error) {
  console.log('  ❌ lint-staged 配置有问题')
  console.log(`     错误: ${error.message}`)
  allPassed = false
}

console.log('')

if (allPassed) {
  console.log('🎉 所有 ESLint 问题已修复！')
  console.log('')
  console.log('✅ 修复内容:')
  console.log('  - 移除了 electron/ 目录的忽略配置')
  console.log('  - 添加了 Node.js 环境配置')
  console.log('  - 修复了脚本文件的环境变量问题')
  console.log('  - 修复了 TypeScript 声明文件的类型问题')
  console.log('  - 优化了构建脚本的函数调用方式')
  console.log('')
  console.log('💡 现在可以正常使用:')
  console.log('  pnpm run lint:check    # 检查代码质量')
  console.log('  pnpm run lint:fix      # 自动修复问题')
  console.log('  pnpm lint-staged       # 暂存文件检查')
} else {
  console.log('❌ 仍有问题需要修复')
  process.exit(1)
}
