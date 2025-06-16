#!/usr/bin/env node

/**
 * 代码质量检查脚本
 * 提供全面的代码质量分析和报告
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

const qualityConfig = {
  maxFileSize: {
    vue: 500 * 1024,
    ts: 300 * 1024,
    js: 200 * 1024,
  },

  maxLines: {
    vue: 500,
    ts: 300,
    js: 200,
  },

  maxComplexity: 10,

  maxDependencies: 50,

  minCoverage: 80,
}

class QualityChecker {
  constructor() {
    this.results = {
      fileSize: [],
      lineCount: [],
      complexity: [],
      dependencies: [],
      coverage: null,
      security: [],
      performance: [],
      score: 0,
    }
  }

  async runAllChecks() {
    console.log(colorize('🔍 开始代码质量检查...', 'cyan'))
    console.log('')

    try {
      await this.checkFileSize()
      await this.checkLineCount()
      await this.checkDependencies()
      await this.checkSecurity()
      await this.checkTestCoverage()
      await this.generateReport()
    } catch (error) {
      console.error(colorize('❌ 质量检查失败:', 'red'), error.message)
      process.exit(1)
    }
  }

  async checkFileSize() {
    console.log(colorize('📏 检查文件大小...', 'blue'))

    const files = this.getSourceFiles()
    const oversizedFiles = []

    for (const file of files) {
      const stats = this.getFileStats(file)
      const ext = path.extname(file).slice(1)
      const maxSize = qualityConfig.maxFileSize[ext] || qualityConfig.maxFileSize.js

      if (stats.size > maxSize) {
        oversizedFiles.push({
          file: path.relative(rootDir, file),
          size: stats.size,
          maxSize,
          ratio: (stats.size / maxSize).toFixed(2),
        })
      }
    }

    this.results.fileSize = oversizedFiles

    if (oversizedFiles.length > 0) {
      console.log(colorize(`  ⚠️  发现 ${oversizedFiles.length} 个过大文件:`, 'yellow'))
      oversizedFiles.forEach((f) => {
        console.log(`    ${f.file} (${(f.size / 1024).toFixed(1)}KB, 超出 ${f.ratio}x)`)
      })
    } else {
      console.log(colorize('  ✅ 所有文件大小正常', 'green'))
    }
  }

  async checkLineCount() {
    console.log(colorize('📊 检查文件行数...', 'blue'))

    const files = this.getSourceFiles()
    const longFiles = []

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      const lines = content.split('\n').length
      const ext = path.extname(file).slice(1)
      const maxLines = qualityConfig.maxLines[ext] || qualityConfig.maxLines.js

      if (lines > maxLines) {
        longFiles.push({
          file: path.relative(rootDir, file),
          lines,
          maxLines,
          ratio: (lines / maxLines).toFixed(2),
        })
      }
    }

    this.results.lineCount = longFiles

    if (longFiles.length > 0) {
      console.log(colorize(`  ⚠️  发现 ${longFiles.length} 个过长文件:`, 'yellow'))
      longFiles.forEach((f) => {
        console.log(`    ${f.file} (${f.lines} 行, 超出 ${f.ratio}x)`)
      })
    } else {
      console.log(colorize('  ✅ 所有文件行数正常', 'green'))
    }
  }

  /**
   * 检查依赖
   */
  async checkDependencies() {
    console.log(colorize('📦 检查依赖情况...', 'blue'))

    const packagePath = path.join(rootDir, 'package.json')
    if (!existsSync(packagePath)) {
      console.log(colorize('  ⚠️  package.json 不存在', 'yellow'))
      return
    }

    const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
    const deps = Object.keys(pkg.dependencies || {})
    const devDeps = Object.keys(pkg.devDependencies || {})
    const totalDeps = deps.length + devDeps.length

    this.results.dependencies = {
      production: deps.length,
      development: devDeps.length,
      total: totalDeps,
      maxAllowed: qualityConfig.maxDependencies,
    }

    if (totalDeps > qualityConfig.maxDependencies) {
      console.log(
        colorize(`  ⚠️  依赖过多: ${totalDeps}/${qualityConfig.maxDependencies}`, 'yellow')
      )
    } else {
      console.log(
        colorize(`  ✅ 依赖数量正常: ${totalDeps}/${qualityConfig.maxDependencies}`, 'green')
      )
    }
  }

  async checkSecurity() {
    console.log(colorize('🔒 检查安全性...', 'blue'))

    const securityIssues = []

    const files = this.getSourceFiles()
    const unsafeFunctions = ['eval(', 'innerHTML', 'document.write', 'setTimeout(string']

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      for (const unsafeFunc of unsafeFunctions) {
        if (content.includes(unsafeFunc)) {
          securityIssues.push({
            file: path.relative(rootDir, file),
            issue: `使用了不安全的函数: ${unsafeFunc}`,
            severity: 'high',
          })
        }
      }
    }

    this.results.security = securityIssues

    if (securityIssues.length > 0) {
      console.log(colorize(`  ⚠️  发现 ${securityIssues.length} 个安全问题:`, 'yellow'))
      securityIssues.forEach((issue) => {
        console.log(`    ${issue.file}: ${issue.issue}`)
      })
    } else {
      console.log(colorize('  ✅ 未发现明显安全问题', 'green'))
    }
  }

  async checkTestCoverage() {
    console.log(colorize('🧪 检查测试覆盖率...', 'blue'))

    try {
      execSync('pnpm run test:coverage --reporter=json', {
        cwd: rootDir,
        stdio: 'pipe',
      })

      const coveragePath = path.join(rootDir, 'coverage/coverage-summary.json')
      if (existsSync(coveragePath)) {
        const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'))
        const totalCoverage = coverage.total.lines.pct

        this.results.coverage = {
          lines: totalCoverage,
          required: qualityConfig.minCoverage,
        }

        if (totalCoverage < qualityConfig.minCoverage) {
          console.log(
            colorize(
              `  ⚠️  测试覆盖率不足: ${totalCoverage}%/${qualityConfig.minCoverage}%`,
              'yellow'
            )
          )
        } else {
          console.log(colorize(`  ✅ 测试覆盖率良好: ${totalCoverage}%`, 'green'))
        }
      } else {
        console.log(colorize('  ⚠️  无法获取覆盖率报告', 'yellow'))
      }
    } catch (_error) {
      console.log(colorize('  ⚠️  测试覆盖率检查失败', 'yellow'))
    }
  }

  async generateReport() {
    console.log('')
    console.log(colorize('📋 生成质量报告...', 'cyan'))

    let score = 100

    score -= this.results.fileSize.length * 5

    score -= this.results.lineCount.length * 3

    if (this.results.dependencies.total > qualityConfig.maxDependencies) {
      score -= 10
    }

    score -= this.results.security.length * 10

    if (this.results.coverage && this.results.coverage.lines < qualityConfig.minCoverage) {
      score -= qualityConfig.minCoverage - this.results.coverage.lines
    }

    score = Math.max(0, score)
    this.results.score = score

    console.log('')
    console.log(colorize('='.repeat(50), 'cyan'))
    console.log(colorize('代码质量报告', 'cyan'))
    console.log(colorize('='.repeat(50), 'cyan'))
    console.log('')

    const scoreColor = score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red'
    console.log(colorize(`总体质量分数: ${score}/100`, scoreColor))
    console.log('')

    console.log('📊 检查结果:')
    console.log(`  文件大小问题: ${this.results.fileSize.length}`)
    console.log(`  文件行数问题: ${this.results.lineCount.length}`)
    console.log(`  安全问题: ${this.results.security.length}`)
    console.log(`  依赖总数: ${this.results.dependencies.total}`)
    if (this.results.coverage) {
      console.log(`  测试覆盖率: ${this.results.coverage.lines}%`)
    }

    const reportPath = path.join(rootDir, 'quality-report.json')
    writeFileSync(reportPath, JSON.stringify(this.results, null, 2))
    console.log('')
    console.log(`📄 详细报告已保存到: ${reportPath}`)

    if (score < 70) {
      console.log('')
      console.log(colorize('❌ 代码质量需要改进！', 'red'))
      process.exit(1)
    } else {
      console.log('')
      console.log(colorize('✅ 代码质量检查通过！', 'green'))
    }
  }

  /**
   * 获取源文件列表 - 跨平台兼容版本
   */
  getSourceFiles() {
    const files = []
    const extensions = ['.vue', '.ts', '.js']

    const walkDir = (dir) => {
      try {
        const entries = readdirSync(dir, { withFileTypes: true })

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            walkDir(fullPath)
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name)
            if (extensions.includes(ext)) {
              files.push(fullPath)
            }
          }
        }
      } catch (_error) {
        // 忽略文件读取错误，继续处理其他文件
      }
    }

    const srcDir = path.join(rootDir, 'src')
    if (existsSync(srcDir)) {
      walkDir(srcDir)
    }

    return files
  }

  getFileStats(filePath) {
    return statSync(filePath)
  }
}

const checker = new QualityChecker()
checker.runAllChecks()
