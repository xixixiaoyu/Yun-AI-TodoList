#!/usr/bin/env node

/**
 * 性能优化脚本
 * 分析和优化项目性能配置
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, statSync } from 'fs'
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

// 性能配置
const performanceConfig = {
  // 文件大小阈值
  thresholds: {
    js: 500 * 1024, // 500KB
    css: 100 * 1024, // 100KB
    image: 1024 * 1024, // 1MB
    font: 200 * 1024, // 200KB
    total: 5 * 1024 * 1024, // 5MB
  },

  // 性能指标目标
  targets: {
    firstContentfulPaint: 1500, // 1.5s
    largestContentfulPaint: 2500, // 2.5s
    firstInputDelay: 100, // 100ms
    cumulativeLayoutShift: 0.1,
  },

  // 优化建议
  optimizations: {
    bundleSize: 'Bundle 大小优化',
    codesplitting: '代码分割',
    lazyLoading: '懒加载',
    compression: '压缩优化',
    caching: '缓存策略',
    cdn: 'CDN 加速',
  },
}

class PerformanceOptimizer {
  constructor() {
    this.results = {
      bundleAnalysis: {},
      issues: [],
      recommendations: [],
      score: 100,
    }
  }

  async run() {
    console.log(colorize('⚡ 开始性能优化分析...', 'blue'))
    console.log('')

    try {
      await this.analyzeBundleSize()
      await this.checkBuildConfig()
      await this.analyzeAssets()
      await this.checkCaching()
      await this.checkCompression()
      await this.generateOptimizationReport()
    } catch (error) {
      console.error(colorize('❌ 性能分析失败:', 'red'), error.message)
      process.exit(1)
    }
  }

  async analyzeBundleSize() {
    console.log(colorize('📦 分析 Bundle 大小...', 'cyan'))

    const distPath = path.join(rootDir, 'apps/frontend/dist')
    if (!existsSync(distPath)) {
      console.log('  前端构建产物不存在，跳过 Bundle 分析')
      return
    }

    try {
      // 分析 JS 文件
      const jsFiles = this.findFiles(distPath, /\.js$/)
      let totalJSSize = 0
      let largeJSFiles = []

      for (const file of jsFiles) {
        const size = statSync(file).size
        totalJSSize += size

        if (size > performanceConfig.thresholds.js) {
          largeJSFiles.push({
            file: path.relative(distPath, file),
            size: this.formatSize(size),
          })
        }
      }

      // 分析 CSS 文件
      const cssFiles = this.findFiles(distPath, /\.css$/)
      let totalCSSSize = 0
      let largeCSSFiles = []

      for (const file of cssFiles) {
        const size = statSync(file).size
        totalCSSSize += size

        if (size > performanceConfig.thresholds.css) {
          largeCSSFiles.push({
            file: path.relative(distPath, file),
            size: this.formatSize(size),
          })
        }
      }

      // 分析图片文件
      const imageFiles = this.findFiles(distPath, /\.(png|jpg|jpeg|gif|svg|webp)$/)
      let totalImageSize = 0
      let largeImageFiles = []

      for (const file of imageFiles) {
        const size = statSync(file).size
        totalImageSize += size

        if (size > performanceConfig.thresholds.image) {
          largeImageFiles.push({
            file: path.relative(distPath, file),
            size: this.formatSize(size),
          })
        }
      }

      const totalSize = totalJSSize + totalCSSSize + totalImageSize

      this.results.bundleAnalysis = {
        totalSize: this.formatSize(totalSize),
        jsSize: this.formatSize(totalJSSize),
        cssSize: this.formatSize(totalCSSSize),
        imageSize: this.formatSize(totalImageSize),
        jsFiles: jsFiles.length,
        cssFiles: cssFiles.length,
        imageFiles: imageFiles.length,
        largeJSFiles,
        largeCSSFiles,
        largeImageFiles,
      }

      console.log(`  总大小: ${this.formatSize(totalSize)}`)
      console.log(`  JS: ${this.formatSize(totalJSSize)} (${jsFiles.length} 个文件)`)
      console.log(`  CSS: ${this.formatSize(totalCSSSize)} (${cssFiles.length} 个文件)`)
      console.log(`  图片: ${this.formatSize(totalImageSize)} (${imageFiles.length} 个文件)`)

      // 检查是否超过阈值
      if (totalSize > performanceConfig.thresholds.total) {
        this.addIssue(
          'bundle-size',
          `Bundle 总大小过大: ${this.formatSize(totalSize)} > ${this.formatSize(performanceConfig.thresholds.total)}`,
          'high'
        )
      }

      if (largeJSFiles.length > 0) {
        this.addIssue('large-js-files', `发现 ${largeJSFiles.length} 个大型 JS 文件`, 'medium')
      }
    } catch (error) {
      console.log('  Bundle 分析失败:', error.message)
    }

    console.log('✅ Bundle 分析完成')
  }

  async checkBuildConfig() {
    console.log(colorize('⚙️  检查构建配置...', 'cyan'))

    const viteConfigPath = path.join(rootDir, 'apps/frontend/vite.config.ts')
    if (existsSync(viteConfigPath)) {
      const content = readFileSync(viteConfigPath, 'utf8')

      // 检查代码分割配置
      if (!content.includes('manualChunks')) {
        this.addRecommendation('code-splitting', '建议配置手动代码分割以优化 Bundle 大小')
      }

      // 检查压缩配置
      if (!content.includes('minify')) {
        this.addRecommendation('minification', '建议启用代码压缩')
      }

      // 检查 Tree Shaking
      if (!content.includes('treeshake')) {
        this.addRecommendation('tree-shaking', '建议启用 Tree Shaking 以移除未使用的代码')
      }
    }

    console.log('✅ 构建配置检查完成')
  }

  async analyzeAssets() {
    console.log(colorize('🖼️  分析静态资源...', 'cyan'))

    const publicPath = path.join(rootDir, 'apps/frontend/public')
    if (existsSync(publicPath)) {
      const imageFiles = this.findFiles(publicPath, /\.(png|jpg|jpeg|gif|svg)$/)

      for (const file of imageFiles) {
        const size = statSync(file).size

        if (size > performanceConfig.thresholds.image) {
          this.addIssue(
            'large-image',
            `大型图片文件: ${path.relative(publicPath, file)} (${this.formatSize(size)})`,
            'medium'
          )
        }

        // 检查图片格式
        const ext = path.extname(file).toLowerCase()
        if (['.png', '.jpg', '.jpeg'].includes(ext) && size > 100 * 1024) {
          this.addRecommendation(
            'image-format',
            `考虑将 ${path.relative(publicPath, file)} 转换为 WebP 格式`
          )
        }
      }
    }

    console.log('✅ 静态资源分析完成')
  }

  async checkCaching() {
    console.log(colorize('💾 检查缓存策略...', 'cyan'))

    // 检查 Service Worker 配置
    const swConfigPath = path.join(rootDir, 'apps/frontend/vite.config.ts')
    if (existsSync(swConfigPath)) {
      const content = readFileSync(swConfigPath, 'utf8')

      if (content.includes('VitePWA')) {
        console.log('  ✅ PWA 缓存策略已配置')
      } else {
        this.addRecommendation('pwa-caching', '建议配置 PWA 缓存策略以提高离线性能')
      }
    }

    // 检查 HTTP 缓存头配置
    const nginxConfigPath = path.join(rootDir, 'nginx/nginx.conf')
    if (existsSync(nginxConfigPath)) {
      const content = readFileSync(nginxConfigPath, 'utf8')

      if (content.includes('expires') && content.includes('Cache-Control')) {
        console.log('  ✅ HTTP 缓存头已配置')
      } else {
        this.addRecommendation('http-caching', '建议配置 HTTP 缓存头以提高资源加载性能')
      }
    }

    console.log('✅ 缓存策略检查完成')
  }

  async checkCompression() {
    console.log(colorize('🗜️  检查压缩配置...', 'cyan'))

    const nginxConfigPath = path.join(rootDir, 'nginx/nginx.conf')
    if (existsSync(nginxConfigPath)) {
      const content = readFileSync(nginxConfigPath, 'utf8')

      if (content.includes('gzip on')) {
        console.log('  ✅ Gzip 压缩已启用')
      } else {
        this.addRecommendation('gzip-compression', '建议启用 Gzip 压缩以减少传输大小')
      }

      if (content.includes('brotli')) {
        console.log('  ✅ Brotli 压缩已启用')
      } else {
        this.addRecommendation('brotli-compression', '建议启用 Brotli 压缩以获得更好的压缩率')
      }
    }

    console.log('✅ 压缩配置检查完成')
  }

  findFiles(dir, pattern) {
    const files = []

    function scan(currentDir) {
      try {
        const items = require('fs').readdirSync(currentDir)

        for (const item of items) {
          const fullPath = path.join(currentDir, item)
          const stat = statSync(fullPath)

          if (stat.isDirectory()) {
            scan(fullPath)
          } else if (stat.isFile() && pattern.test(item)) {
            files.push(fullPath)
          }
        }
      } catch (error) {
        // 忽略权限错误
      }
    }

    scan(dir)
    return files
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  addIssue(type, message, severity) {
    this.results.issues.push({ type, message, severity })

    const scoreDeduction = {
      high: 15,
      medium: 10,
      low: 5,
    }

    this.results.score -= scoreDeduction[severity] || 5
  }

  addRecommendation(type, message) {
    this.results.recommendations.push({ type, message })
  }

  generateOptimizationReport() {
    console.log('')
    console.log(colorize('⚡ 性能优化报告', 'magenta'))
    console.log('='.repeat(50))

    // 性能评分
    const score = Math.max(0, this.results.score)
    const scoreColor = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red'
    console.log(colorize(`性能评分: ${score}/100`, scoreColor))
    console.log('')

    // Bundle 分析结果
    if (Object.keys(this.results.bundleAnalysis).length > 0) {
      const analysis = this.results.bundleAnalysis
      console.log(colorize('📦 Bundle 分析:', 'blue'))
      console.log(`  总大小: ${analysis.totalSize}`)
      console.log(`  JavaScript: ${analysis.jsSize} (${analysis.jsFiles} 个文件)`)
      console.log(`  CSS: ${analysis.cssSize} (${analysis.cssFiles} 个文件)`)
      console.log(`  图片: ${analysis.imageSize} (${analysis.imageFiles} 个文件)`)

      if (analysis.largeJSFiles.length > 0) {
        console.log('  大型 JS 文件:')
        analysis.largeJSFiles.forEach((file) => {
          console.log(`    - ${file.file}: ${file.size}`)
        })
      }

      console.log('')
    }

    // 性能问题
    if (this.results.issues.length > 0) {
      console.log(colorize('⚠️  性能问题:', 'yellow'))
      this.results.issues.forEach((issue, index) => {
        const severityColor =
          issue.severity === 'high' ? 'red' : issue.severity === 'medium' ? 'yellow' : 'blue'
        console.log(
          `  ${index + 1}. [${colorize(issue.severity.toUpperCase(), severityColor)}] ${issue.message}`
        )
      })
      console.log('')
    }

    // 优化建议
    if (this.results.recommendations.length > 0) {
      console.log(colorize('💡 优化建议:', 'cyan'))
      this.results.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.message}`)
      })
      console.log('')
    }

    // 通用优化建议
    console.log(colorize('🚀 通用性能优化建议:', 'cyan'))
    console.log('  - 启用代码分割和懒加载')
    console.log('  - 优化图片格式和大小')
    console.log('  - 使用 CDN 加速静态资源')
    console.log('  - 启用 HTTP/2 和压缩')
    console.log('  - 实施有效的缓存策略')
    console.log('  - 移除未使用的代码和依赖')
    console.log('  - 使用 Web Workers 处理重计算')
    console.log('  - 优化关键渲染路径')

    console.log('')

    if (this.results.issues.length === 0) {
      console.log(colorize('✅ 性能配置良好！', 'green'))
    } else {
      console.log(colorize('🔧 建议优化发现的性能问题', 'yellow'))
    }
  }
}

// 运行性能优化器
const optimizer = new PerformanceOptimizer()
optimizer.run()
