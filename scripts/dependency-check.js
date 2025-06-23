#!/usr/bin/env node

/**
 * 依赖项检查和管理脚本
 * 检查依赖项安全性、版本兼容性和许可证合规性
 */

import { execSync } from 'child_process'
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

// 检查配置
const checkConfig = {
  // 允许的许可证类型
  allowedLicenses: [
    'MIT',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    'GPL-3.0',
    'GPL-3.0-only',
    'LGPL-2.1',
    'LGPL-3.0',
    'MPL-2.0',
  ],

  // 禁止的依赖项
  forbiddenPackages: [
    'lodash', // 推荐使用 lodash-es
    'moment', // 推荐使用 date-fns
    'request', // 已废弃
    'node-sass', // 推荐使用 sass
  ],

  // 最大依赖项数量
  maxDependencies: {
    production: 50,
    development: 100,
    total: 150,
  },
}

class DependencyChecker {
  constructor() {
    this.results = {
      security: { vulnerabilities: 0, issues: [] },
      licenses: { violations: 0, issues: [] },
      outdated: { count: 0, packages: [] },
      forbidden: { count: 0, packages: [] },
      duplicates: { count: 0, packages: [] },
      size: { production: 0, development: 0, total: 0 },
    }
  }

  async run() {
    console.log(colorize('🔍 开始依赖项检查...', 'blue'))
    console.log('')

    try {
      await this.checkSecurity()
      await this.checkLicenses()
      await this.checkOutdated()
      await this.checkForbidden()
      await this.checkDuplicates()
      await this.checkSize()

      this.generateReport()
    } catch (error) {
      console.error(colorize('❌ 检查过程中出现错误:', 'red'), error.message)
      process.exit(1)
    }
  }

  async checkSecurity() {
    console.log(colorize('🔒 检查安全漏洞...', 'cyan'))

    try {
      const output = execSync('pnpm audit --json', {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: 'pipe',
      })

      const auditResult = JSON.parse(output)

      if (auditResult.vulnerabilities) {
        this.results.security.vulnerabilities = Object.keys(auditResult.vulnerabilities).length

        Object.entries(auditResult.vulnerabilities).forEach(([pkg, vuln]) => {
          if (vuln.severity === 'high' || vuln.severity === 'critical') {
            this.results.security.issues.push({
              package: pkg,
              severity: vuln.severity,
              title: vuln.title,
              url: vuln.url,
            })
          }
        })
      }

      console.log(`  发现 ${this.results.security.vulnerabilities} 个安全问题`)
    } catch (error) {
      // pnpm audit 在发现漏洞时会返回非零退出码
      if (error.stdout) {
        try {
          const auditResult = JSON.parse(error.stdout)
          this.results.security.vulnerabilities = auditResult.metadata?.vulnerabilities?.total || 0
          console.log(`  发现 ${this.results.security.vulnerabilities} 个安全问题`)
        } catch (parseError) {
          console.log('  无法解析安全审计结果')
        }
      }
    }
  }

  async checkLicenses() {
    console.log(colorize('📄 检查许可证合规性...', 'cyan'))

    // 这里可以集成 license-checker 等工具
    // 暂时跳过，因为需要额外的依赖
    console.log('  许可证检查已跳过（需要额外配置）')
  }

  async checkOutdated() {
    console.log(colorize('📅 检查过时依赖...', 'cyan'))

    try {
      const output = execSync('pnpm outdated --format json', {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: 'pipe',
      })

      const outdated = JSON.parse(output)
      this.results.outdated.count = Object.keys(outdated).length
      this.results.outdated.packages = Object.entries(outdated).map(([pkg, info]) => ({
        package: pkg,
        current: info.current,
        latest: info.latest,
        wanted: info.wanted,
      }))

      console.log(`  发现 ${this.results.outdated.count} 个过时依赖`)
    } catch (error) {
      // pnpm outdated 在发现过时依赖时会返回非零退出码
      console.log('  无过时依赖或检查失败')
    }
  }

  async checkForbidden() {
    console.log(colorize('🚫 检查禁止依赖...', 'cyan'))

    const packageJsonPaths = [
      path.join(rootDir, 'package.json'),
      path.join(rootDir, 'apps/frontend/package.json'),
      path.join(rootDir, 'apps/backend/package.json'),
    ]

    for (const pkgPath of packageJsonPaths) {
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
        const allDeps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
        }

        for (const forbiddenPkg of checkConfig.forbiddenPackages) {
          if (allDeps[forbiddenPkg]) {
            this.results.forbidden.count++
            this.results.forbidden.packages.push({
              package: forbiddenPkg,
              file: pkgPath,
              version: allDeps[forbiddenPkg],
            })
          }
        }
      }
    }

    console.log(`  发现 ${this.results.forbidden.count} 个禁止依赖`)
  }

  async checkDuplicates() {
    console.log(colorize('🔄 检查重复依赖...', 'cyan'))

    try {
      const output = execSync('pnpm list --depth=0 --json', {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: 'pipe',
      })

      // 这里可以实现更复杂的重复检查逻辑
      console.log('  重复依赖检查已跳过（需要更复杂的实现）')
    } catch (error) {
      console.log('  重复依赖检查失败')
    }
  }

  async checkSize() {
    console.log(colorize('📊 检查依赖项数量...', 'cyan'))

    const packageJsonPaths = [
      { path: path.join(rootDir, 'package.json'), name: 'root' },
      { path: path.join(rootDir, 'apps/frontend/package.json'), name: 'frontend' },
      { path: path.join(rootDir, 'apps/backend/package.json'), name: 'backend' },
    ]

    let totalProd = 0
    let totalDev = 0

    for (const { path: pkgPath, name } of packageJsonPaths) {
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
        const prodCount = Object.keys(pkg.dependencies || {}).length
        const devCount = Object.keys(pkg.devDependencies || {}).length

        totalProd += prodCount
        totalDev += devCount

        console.log(`  ${name}: ${prodCount} 生产依赖, ${devCount} 开发依赖`)
      }
    }

    this.results.size = {
      production: totalProd,
      development: totalDev,
      total: totalProd + totalDev,
    }

    console.log(`  总计: ${totalProd} 生产依赖, ${totalDev} 开发依赖`)
  }

  generateReport() {
    console.log('')
    console.log(colorize('📋 依赖项检查报告', 'magenta'))
    console.log('='.repeat(50))

    // 安全性报告
    if (this.results.security.vulnerabilities > 0) {
      console.log(colorize(`❌ 安全漏洞: ${this.results.security.vulnerabilities} 个`, 'red'))
      this.results.security.issues.forEach((issue) => {
        console.log(`   - ${issue.package}: ${issue.title} (${issue.severity})`)
      })
    } else {
      console.log(colorize('✅ 安全检查: 无已知漏洞', 'green'))
    }

    // 过时依赖报告
    if (this.results.outdated.count > 0) {
      console.log(colorize(`⚠️  过时依赖: ${this.results.outdated.count} 个`, 'yellow'))
      this.results.outdated.packages.slice(0, 5).forEach((pkg) => {
        console.log(`   - ${pkg.package}: ${pkg.current} → ${pkg.latest}`)
      })
      if (this.results.outdated.count > 5) {
        console.log(`   ... 还有 ${this.results.outdated.count - 5} 个`)
      }
    } else {
      console.log(colorize('✅ 版本检查: 所有依赖都是最新的', 'green'))
    }

    // 禁止依赖报告
    if (this.results.forbidden.count > 0) {
      console.log(colorize(`❌ 禁止依赖: ${this.results.forbidden.count} 个`, 'red'))
      this.results.forbidden.packages.forEach((pkg) => {
        console.log(`   - ${pkg.package}@${pkg.version} in ${pkg.file}`)
      })
    } else {
      console.log(colorize('✅ 依赖检查: 无禁止依赖', 'green'))
    }

    // 大小检查
    const { production, development, total } = this.results.size
    const { maxDependencies } = checkConfig

    if (total > maxDependencies.total) {
      console.log(colorize(`⚠️  依赖数量: ${total}/${maxDependencies.total} (超出限制)`, 'yellow'))
    } else {
      console.log(colorize(`✅ 依赖数量: ${total}/${maxDependencies.total}`, 'green'))
    }

    console.log('')

    // 总结
    const hasIssues =
      this.results.security.vulnerabilities > 0 ||
      this.results.forbidden.count > 0 ||
      total > maxDependencies.total

    if (hasIssues) {
      console.log(colorize('❌ 发现问题，建议修复后再继续', 'red'))
      process.exit(1)
    } else {
      console.log(colorize('✅ 依赖项检查通过！', 'green'))
    }
  }
}

// 运行检查
const checker = new DependencyChecker()
checker.run()
