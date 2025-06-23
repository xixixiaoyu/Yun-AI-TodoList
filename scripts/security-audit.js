#!/usr/bin/env node

/**
 * 安全配置审计脚本
 * 检查项目的安全配置和潜在安全问题
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

// 安全检查配置
const securityConfig = {
  // 敏感文件检查
  sensitiveFiles: [
    '.env',
    '.env.local',
    '.env.production',
    'config/secrets.json',
    'private.key',
    'certificate.pem',
  ],

  // 敏感内容模式
  sensitivePatterns: [
    /password\s*[:=]\s*['"]\w+['"]/gi,
    /api[_-]?key\s*[:=]\s*['"]\w+['"]/gi,
    /secret\s*[:=]\s*['"]\w+['"]/gi,
    /token\s*[:=]\s*['"]\w+['"]/gi,
    /private[_-]?key\s*[:=]/gi,
  ],

  // 不安全的依赖项
  vulnerablePackages: [
    'lodash@<4.17.21',
    'axios@<0.21.2',
    'express@<4.17.3',
    'jsonwebtoken@<8.5.1',
  ],

  // 必需的安全头
  requiredHeaders: [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'Referrer-Policy',
  ],
}

class SecurityAuditor {
  constructor() {
    this.results = {
      vulnerabilities: [],
      warnings: [],
      recommendations: [],
      score: 100,
    }
  }

  async run() {
    console.log(colorize('🔒 开始安全配置审计...', 'blue'))
    console.log('')

    try {
      await this.checkSensitiveFiles()
      await this.checkEnvironmentVariables()
      await this.checkDependencyVulnerabilities()
      await this.checkElectronSecurity()
      await this.checkWebSecurity()
      await this.checkBackendSecurity()
      await this.checkDockerSecurity()

      this.generateSecurityReport()
    } catch (error) {
      console.error(colorize('❌ 安全审计失败:', 'red'), error.message)
      process.exit(1)
    }
  }

  async checkSensitiveFiles() {
    console.log(colorize('📁 检查敏感文件...', 'cyan'))

    for (const file of securityConfig.sensitiveFiles) {
      const filePath = path.join(rootDir, file)
      if (existsSync(filePath)) {
        // 检查文件权限
        try {
          const stats = execSync(`ls -la "${filePath}"`, { encoding: 'utf8' })
          const permissions = stats.split(' ')[0]

          if (permissions.includes('r--r--r--') || permissions.includes('rw-rw-rw-')) {
            this.addVulnerability('file-permissions', `敏感文件权限过于宽松: ${file}`, 'high')
          }
        } catch (error) {
          // 忽略权限检查错误
        }

        // 检查文件内容
        try {
          const content = readFileSync(filePath, 'utf8')

          for (const pattern of securityConfig.sensitivePatterns) {
            const matches = content.match(pattern)
            if (matches) {
              this.addWarning(
                'sensitive-content',
                `在 ${file} 中发现可能的敏感信息: ${matches[0].substring(0, 50)}...`
              )
            }
          }
        } catch (error) {
          // 忽略文件读取错误
        }
      }
    }

    console.log('✅ 敏感文件检查完成')
  }

  async checkEnvironmentVariables() {
    console.log(colorize('🌍 检查环境变量配置...', 'cyan'))

    const envExamplePath = path.join(rootDir, '.env.example')
    const envPath = path.join(rootDir, '.env')

    if (existsSync(envExamplePath) && existsSync(envPath)) {
      try {
        const exampleContent = readFileSync(envExamplePath, 'utf8')
        const envContent = readFileSync(envPath, 'utf8')

        // 检查是否有示例值被直接使用
        const exampleLines = exampleContent.split('\n').filter((line) => line.includes('='))
        const envLines = envContent.split('\n').filter((line) => line.includes('='))

        for (const exampleLine of exampleLines) {
          const [key, value] = exampleLine.split('=', 2)
          if ((value && value.includes('your-')) || value.includes('example-')) {
            const envLine = envLines.find((line) => line.startsWith(key + '='))
            if (envLine && envLine.includes(value)) {
              this.addVulnerability('default-credentials', `使用了示例环境变量值: ${key}`, 'medium')
            }
          }
        }
      } catch (error) {
        this.addWarning('env-check', '无法检查环境变量配置')
      }
    }

    console.log('✅ 环境变量检查完成')
  }

  async checkDependencyVulnerabilities() {
    console.log(colorize('📦 检查依赖项漏洞...', 'cyan'))

    try {
      // 运行 npm audit
      const auditOutput = execSync('pnpm audit --json', {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: 'pipe',
      })

      const auditResult = JSON.parse(auditOutput)

      if (auditResult.vulnerabilities) {
        Object.entries(auditResult.vulnerabilities).forEach(([pkg, vuln]) => {
          if (vuln.severity === 'high' || vuln.severity === 'critical') {
            this.addVulnerability(
              'dependency-vulnerability',
              `${pkg}: ${vuln.title} (${vuln.severity})`,
              vuln.severity
            )
          } else if (vuln.severity === 'moderate') {
            this.addWarning('dependency-vulnerability', `${pkg}: ${vuln.title} (${vuln.severity})`)
          }
        })
      }
    } catch (error) {
      // pnpm audit 在发现漏洞时返回非零退出码
      if (error.stdout) {
        try {
          const auditResult = JSON.parse(error.stdout)
          if (auditResult.metadata?.vulnerabilities?.total > 0) {
            this.addWarning(
              'dependency-vulnerability',
              `发现 ${auditResult.metadata.vulnerabilities.total} 个依赖项漏洞`
            )
          }
        } catch (parseError) {
          this.addWarning('dependency-check', '无法解析依赖项审计结果')
        }
      }
    }

    console.log('✅ 依赖项漏洞检查完成')
  }

  async checkElectronSecurity() {
    console.log(colorize('⚡ 检查 Electron 安全配置...', 'cyan'))

    const mainPath = path.join(rootDir, 'electron/main.js')
    if (existsSync(mainPath)) {
      const content = readFileSync(mainPath, 'utf8')

      const securityChecks = [
        { pattern: 'nodeIntegration: false', name: 'Node.js 集成已禁用' },
        { pattern: 'contextIsolation: true', name: '上下文隔离已启用' },
        { pattern: 'webSecurity: true', name: 'Web 安全已启用' },
        { pattern: 'enableRemoteModule: false', name: '远程模块已禁用' },
      ]

      for (const check of securityChecks) {
        if (!content.includes(check.pattern)) {
          this.addVulnerability('electron-security', `Electron 安全配置缺失: ${check.name}`, 'high')
        }
      }

      // 检查是否有不安全的 API 使用
      const unsafePatterns = ['shell.openExternal', 'require(', 'eval(', 'Function(']

      for (const pattern of unsafePatterns) {
        if (content.includes(pattern)) {
          this.addWarning('electron-unsafe-api', `检测到可能不安全的 API 使用: ${pattern}`)
        }
      }
    }

    console.log('✅ Electron 安全检查完成')
  }

  async checkWebSecurity() {
    console.log(colorize('🌐 检查 Web 安全配置...', 'cyan'))

    // 检查 CSP 配置
    const securityPath = path.join(rootDir, 'apps/frontend/src/utils/security.ts')
    if (existsSync(securityPath)) {
      const content = readFileSync(securityPath, 'utf8')

      if (content.includes("'unsafe-eval'")) {
        this.addWarning('csp-unsafe-eval', 'CSP 配置中包含 unsafe-eval，可能存在 XSS 风险')
      }

      if (content.includes("'unsafe-inline'")) {
        this.addWarning('csp-unsafe-inline', 'CSP 配置中包含 unsafe-inline，建议使用 nonce 或 hash')
      }
    }

    // 检查 HTTPS 配置
    const viteConfigPath = path.join(rootDir, 'apps/frontend/vite.config.ts')
    if (existsSync(viteConfigPath)) {
      const content = readFileSync(viteConfigPath, 'utf8')

      if (!content.includes('https:')) {
        this.addRecommendation('https-config', '建议在生产环境中启用 HTTPS')
      }
    }

    console.log('✅ Web 安全检查完成')
  }

  async checkBackendSecurity() {
    console.log(colorize('🔧 检查后端安全配置...', 'cyan'))

    const mainPath = path.join(rootDir, 'apps/backend/src/main.ts')
    if (existsSync(mainPath)) {
      const content = readFileSync(mainPath, 'utf8')

      const securityFeatures = [
        { pattern: 'helmet()', name: 'Helmet 安全中间件' },
        { pattern: 'compression()', name: 'Gzip 压缩' },
        { pattern: 'enableCors', name: 'CORS 配置' },
        { pattern: 'ValidationPipe', name: '输入验证' },
      ]

      for (const feature of securityFeatures) {
        if (!content.includes(feature.pattern)) {
          this.addWarning('backend-security', `后端缺少安全特性: ${feature.name}`)
        }
      }
    }

    console.log('✅ 后端安全检查完成')
  }

  async checkDockerSecurity() {
    console.log(colorize('🐳 检查 Docker 安全配置...', 'cyan'))

    const dockerfilePaths = [
      path.join(rootDir, 'Dockerfile'),
      path.join(rootDir, 'apps/frontend/Dockerfile'),
      path.join(rootDir, 'apps/backend/Dockerfile'),
    ]

    for (const dockerfilePath of dockerfilePaths) {
      if (existsSync(dockerfilePath)) {
        const content = readFileSync(dockerfilePath, 'utf8')

        // 检查是否使用 root 用户
        if (!content.includes('USER ') || content.includes('USER root')) {
          this.addWarning(
            'docker-root-user',
            `Dockerfile 使用 root 用户运行: ${path.basename(dockerfilePath)}`
          )
        }

        // 检查是否暴露了不必要的端口
        const exposeMatches = content.match(/EXPOSE\s+(\d+)/g)
        if (exposeMatches && exposeMatches.length > 2) {
          this.addWarning(
            'docker-exposed-ports',
            `Dockerfile 暴露了多个端口: ${path.basename(dockerfilePath)}`
          )
        }
      }
    }

    console.log('✅ Docker 安全检查完成')
  }

  addVulnerability(type, message, severity) {
    this.results.vulnerabilities.push({ type, message, severity })

    const scoreDeduction = {
      critical: 25,
      high: 15,
      medium: 10,
      low: 5,
    }

    this.results.score -= scoreDeduction[severity] || 5
  }

  addWarning(type, message) {
    this.results.warnings.push({ type, message })
    this.results.score -= 3
  }

  addRecommendation(type, message) {
    this.results.recommendations.push({ type, message })
  }

  generateSecurityReport() {
    console.log('')
    console.log(colorize('🔒 安全审计报告', 'magenta'))
    console.log('='.repeat(50))

    // 安全评分
    const score = Math.max(0, this.results.score)
    const scoreColor = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red'
    console.log(colorize(`安全评分: ${score}/100`, scoreColor))
    console.log('')

    // 漏洞报告
    if (this.results.vulnerabilities.length > 0) {
      console.log(colorize('❌ 发现的安全漏洞:', 'red'))
      this.results.vulnerabilities.forEach((vuln, index) => {
        const severityColor =
          vuln.severity === 'critical'
            ? 'red'
            : vuln.severity === 'high'
              ? 'red'
              : vuln.severity === 'medium'
                ? 'yellow'
                : 'blue'
        console.log(
          `  ${index + 1}. [${colorize(vuln.severity.toUpperCase(), severityColor)}] ${vuln.message}`
        )
      })
      console.log('')
    }

    // 警告报告
    if (this.results.warnings.length > 0) {
      console.log(colorize('⚠️  安全警告:', 'yellow'))
      this.results.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning.message}`)
      })
      console.log('')
    }

    // 建议报告
    if (this.results.recommendations.length > 0) {
      console.log(colorize('💡 安全建议:', 'cyan'))
      this.results.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.message}`)
      })
      console.log('')
    }

    // 总结
    if (this.results.vulnerabilities.length === 0 && this.results.warnings.length === 0) {
      console.log(colorize('✅ 未发现严重安全问题！', 'green'))
    } else {
      console.log(colorize('🔧 建议修复发现的安全问题', 'yellow'))
    }

    // 额外建议
    console.log('')
    console.log(colorize('🛡️  通用安全建议:', 'cyan'))
    console.log('  - 定期更新依赖项')
    console.log('  - 使用强密码和双因素认证')
    console.log('  - 启用 HTTPS 和安全头')
    console.log('  - 定期进行安全审计')
    console.log('  - 实施最小权限原则')
    console.log('  - 监控和日志记录')
  }
}

// 运行安全审计
const auditor = new SecurityAuditor()
auditor.run()
