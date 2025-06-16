#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
}

const testConfigs = {
  unit: {
    name: '单元测试',
    command: 'vitest run --reporter=verbose',
    description: '运行所有单元测试',
  },
  integration: {
    name: '集成测试',
    command: 'vitest run src/test/integration --reporter=verbose',
    description: '运行集成测试',
  },
  coverage: {
    name: '覆盖率测试',
    command: 'vitest run --coverage',
    description: '运行测试并生成覆盖率报告',
  },
  watch: {
    name: '监视模式',
    command: 'vitest --watch',
    description: '监视文件变化并自动运行测试',
  },
  ui: {
    name: 'UI 模式',
    command: 'vitest --ui',
    description: '在浏览器中运行测试 UI',
  },
  debug: {
    name: '调试模式',
    command: 'vitest --inspect-brk --no-coverage',
    description: '以调试模式运行测试',
  },
  ci: {
    name: 'CI 模式',
    command:
      'vitest run --coverage --reporter=verbose --reporter=junit --outputFile=test-results.xml',
    description: '适用于 CI/CD 的测试运行',
  },
}

const qualityChecks = {
  lint: {
    name: 'ESLint 检查',
    command: 'eslint src --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts',
    description: '运行代码质量检查',
  },
  format: {
    name: '格式检查',
    command: 'prettier --check "src/**/*.{js,ts,json,css,scss,vue,html,md}" --ignore-unknown',
    description: '检查代码格式',
  },
  typecheck: {
    name: '类型检查',
    command: 'vue-tsc --noEmit',
    description: '运行 TypeScript 类型检查',
  },
}

const args = process.argv.slice(2)
const command = args[0]
const _options = args.slice(1)

function showHelp() {
  log.title('🧪 测试运行器')
  console.log()
  console.log('用法: node scripts/test-runner.js <command> [options]')
  console.log()

  log.title('📋 可用命令:')
  Object.entries(testConfigs).forEach(([key, config]) => {
    console.log(`  ${colors.green}${key.padEnd(12)}${colors.reset} ${config.description}`)
  })

  console.log()
  log.title('🔍 质量检查:')
  Object.entries(qualityChecks).forEach(([key, config]) => {
    console.log(`  ${colors.yellow}${key.padEnd(12)}${colors.reset} ${config.description}`)
  })

  console.log()
  log.title('🚀 特殊命令:')
  console.log(`  ${colors.magenta}all${colors.reset.padEnd(11)} 运行所有测试和质量检查`)
  console.log(`  ${colors.magenta}quick${colors.reset.padEnd(9)} 快速测试（单元测试 + lint）`)
  console.log(`  ${colors.magenta}full${colors.reset.padEnd(10)} 完整测试（包括覆盖率）`)
  console.log(`  ${colors.magenta}clean${colors.reset.padEnd(9)} 清理测试缓存和报告`)

  console.log()
  log.title('📊 示例:')
  console.log('  node scripts/test-runner.js unit')
  console.log('  node scripts/test-runner.js coverage')
  console.log('  node scripts/test-runner.js all')
  console.log('  node scripts/test-runner.js watch')
}

function runCommand(cmd, description) {
  try {
    log.info(`正在运行: ${description}`)
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() })
    log.success(`完成: ${description}`)
    return true
  } catch (_error) {
    log.error(`失败: ${description}`)
    return false
  }
}

function cleanTestArtifacts() {
  const pathsToClean = ['coverage', 'test-results.xml', 'node_modules/.vitest', '.vitest']

  pathsToClean.forEach((p) => {
    const fullPath = path.join(process.cwd(), p)
    if (fs.existsSync(fullPath)) {
      try {
        if (fs.statSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true })
        } else {
          fs.unlinkSync(fullPath)
        }
        log.success(`已清理: ${p}`)
      } catch (_error) {
        log.warning(`清理失败: ${p}`)
      }
    }
  })
}

function runAllTests() {
  log.title('🚀 运行完整测试套件')

  const steps = [
    { name: '类型检查', cmd: qualityChecks.typecheck.command },
    { name: 'ESLint 检查', cmd: qualityChecks.lint.command },
    { name: '格式检查', cmd: qualityChecks.format.command },
    { name: '单元测试', cmd: testConfigs.unit.command },
    { name: '集成测试', cmd: testConfigs.integration.command },
    { name: '覆盖率测试', cmd: testConfigs.coverage.command },
  ]

  let allPassed = true
  const results = []

  for (const step of steps) {
    const success = runCommand(step.cmd, step.name)
    results.push({ name: step.name, success })
    if (!success) allPassed = false
  }

  console.log()
  log.title('📊 测试结果汇总:')
  results.forEach((result) => {
    const status = result.success ? colors.green + '✓' : colors.red + '✗'
    console.log(`  ${status} ${result.name}${colors.reset}`)
  })

  if (allPassed) {
    log.success('所有测试通过！🎉')
    return true
  } else {
    log.error('部分测试失败！')
    return false
  }
}

function runQuickTests() {
  log.title('⚡ 运行快速测试')

  const steps = [
    { name: 'ESLint 检查', cmd: qualityChecks.lint.command },
    { name: '单元测试', cmd: testConfigs.unit.command },
  ]

  let allPassed = true
  for (const step of steps) {
    const success = runCommand(step.cmd, step.name)
    if (!success) allPassed = false
  }

  return allPassed
}

function runFullTests() {
  log.title('🔬 运行完整测试')

  const steps = [
    { name: '类型检查', cmd: qualityChecks.typecheck.command },
    { name: 'ESLint 检查', cmd: qualityChecks.lint.command },
    { name: '格式检查', cmd: qualityChecks.format.command },
    { name: '覆盖率测试', cmd: testConfigs.coverage.command },
    { name: '集成测试', cmd: testConfigs.integration.command },
  ]

  let allPassed = true
  for (const step of steps) {
    const success = runCommand(step.cmd, step.name)
    if (!success) allPassed = false
  }

  return allPassed
}

function main() {
  if (!command || command === 'help' || command === '-h' || command === '--help') {
    showHelp()
    return
  }

  console.log()

  switch (command) {
    case 'clean':
      log.title('🧹 清理测试缓存')
      cleanTestArtifacts()
      break

    case 'all':
      runAllTests()
      break

    case 'quick':
      runQuickTests()
      break

    case 'full':
      runFullTests()
      break

    default:
      if (testConfigs[command]) {
        const config = testConfigs[command]
        log.title(`🧪 ${config.name}`)
        runCommand(config.command, config.description)
      } else if (qualityChecks[command]) {
        const config = qualityChecks[command]
        log.title(`🔍 ${config.name}`)
        runCommand(config.command, config.description)
      } else {
        log.error(`未知命令: ${command}`)
        console.log()
        showHelp()
        process.exit(1)
      }
      break
  }
}

main()
