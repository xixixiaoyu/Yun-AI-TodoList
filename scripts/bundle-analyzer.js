#!/usr/bin/env node

/**
 * 前端 Bundle 分析器
 * 提供详细的 Bundle 大小分析和优化建议
 */

import { execSync } from 'child_process'
import { existsSync, readdirSync, statSync, writeFileSync } from 'fs'
import { dirname, extname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

class BundleAnalyzer {
  constructor() {
    this.distPath = join(rootDir, 'apps/frontend/dist')
    this.results = {
      timestamp: new Date().toISOString(),
      totalSize: 0,
      files: [],
      categories: {
        javascript: { files: [], totalSize: 0 },
        css: { files: [], totalSize: 0 },
        images: { files: [], totalSize: 0 },
        fonts: { files: [], totalSize: 0 },
        other: { files: [], totalSize: 0 },
      },
      recommendations: [],
    }
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m',
    }

    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    }

    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`)
  }

  ensureBuild() {
    if (!existsSync(this.distPath)) {
      this.log('构建文件不存在，开始构建前端...', 'warning')
      try {
        execSync('pnpm --filter frontend build', {
          cwd: rootDir,
          stdio: 'inherit',
        })
        this.log('前端构建完成', 'success')
      } catch (error) {
        this.log(`构建失败: ${error.message}`, 'error')
        throw error
      }
    }
  }

  analyzeFiles(dirPath = this.distPath, relativePath = '') {
    const files = readdirSync(dirPath)

    for (const file of files) {
      const filePath = join(dirPath, file)
      const relativeFilePath = join(relativePath, file)
      const stat = statSync(filePath)

      if (stat.isDirectory()) {
        this.analyzeFiles(filePath, relativeFilePath)
      } else {
        const sizeBytes = stat.size
        const sizeKB = Math.round((sizeBytes / 1024) * 100) / 100
        const ext = extname(file).toLowerCase()

        const fileInfo = {
          name: file,
          path: relativeFilePath,
          size: sizeBytes,
          sizeKB,
          extension: ext,
        }

        this.results.files.push(fileInfo)
        this.results.totalSize += sizeBytes

        // 分类文件
        this.categorizeFile(fileInfo)
      }
    }
  }

  categorizeFile(fileInfo) {
    const { extension } = fileInfo
    let category = 'other'

    if (['.js', '.mjs', '.ts'].includes(extension)) {
      category = 'javascript'
    } else if (['.css', '.scss', '.sass', '.less'].includes(extension)) {
      category = 'css'
    } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(extension)) {
      category = 'images'
    } else if (['.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(extension)) {
      category = 'fonts'
    }

    this.results.categories[category].files.push(fileInfo)
    this.results.categories[category].totalSize += fileInfo.size
  }

  generateRecommendations() {
    const recommendations = []
    const totalSizeMB = this.results.totalSize / (1024 * 1024)

    // 总体大小建议
    if (totalSizeMB > 2) {
      recommendations.push({
        type: 'warning',
        category: 'bundle-size',
        message: `Bundle 总大小 ${totalSizeMB.toFixed(2)}MB 较大，建议优化`,
        suggestions: [
          '启用代码分割 (Code Splitting)',
          '使用动态导入 (Dynamic Imports)',
          '移除未使用的依赖',
          '启用 Tree Shaking',
        ],
      })
    }

    // JavaScript 文件建议
    const jsFiles = this.results.categories.javascript.files
    const largeJsFiles = jsFiles.filter((f) => f.sizeKB > 500)

    if (largeJsFiles.length > 0) {
      recommendations.push({
        type: 'warning',
        category: 'javascript',
        message: `发现 ${largeJsFiles.length} 个大型 JS 文件`,
        files: largeJsFiles.map((f) => `${f.name} (${f.sizeKB}KB)`),
        suggestions: [
          '考虑代码分割',
          '延迟加载非关键代码',
          '使用 Webpack Bundle Analyzer 详细分析',
        ],
      })
    }

    // 图片文件建议
    const imageFiles = this.results.categories.images.files
    const largeImages = imageFiles.filter((f) => f.sizeKB > 100)

    if (largeImages.length > 0) {
      recommendations.push({
        type: 'info',
        category: 'images',
        message: `发现 ${largeImages.length} 个大型图片文件`,
        files: largeImages.map((f) => `${f.name} (${f.sizeKB}KB)`),
        suggestions: ['使用 WebP 格式', '启用图片压缩', '考虑使用 CDN', '实现图片懒加载'],
      })
    }

    // CSS 文件建议
    const totalCssSize = this.results.categories.css.totalSize / 1024

    if (totalCssSize > 100) {
      recommendations.push({
        type: 'info',
        category: 'css',
        message: `CSS 文件总大小 ${totalCssSize.toFixed(2)}KB`,
        suggestions: [
          '启用 CSS 压缩',
          '移除未使用的 CSS',
          '使用 Critical CSS',
          '考虑 CSS-in-JS 方案',
        ],
      })
    }

    this.results.recommendations = recommendations
  }

  printReport() {
    const totalSizeMB = (this.results.totalSize / (1024 * 1024)).toFixed(2)
    const totalSizeKB = (this.results.totalSize / 1024).toFixed(2)

    console.log('\n📊 Bundle 分析报告')
    console.log('='.repeat(50))
    console.log(`📦 总大小: ${totalSizeMB}MB (${totalSizeKB}KB)`)
    console.log(`📁 文件数量: ${this.results.files.length}`)

    // 按类别显示
    console.log('\n📂 文件分类:')
    for (const [category, data] of Object.entries(this.results.categories)) {
      if (data.files.length > 0) {
        const sizeMB = (data.totalSize / (1024 * 1024)).toFixed(2)
        const percentage = ((data.totalSize / this.results.totalSize) * 100).toFixed(1)
        console.log(
          `  ${category.padEnd(12)}: ${data.files.length.toString().padStart(3)} 文件, ${sizeMB.padStart(6)}MB (${percentage}%)`
        )
      }
    }

    // 显示最大的文件
    console.log('\n📋 最大的 10 个文件:')
    const sortedFiles = [...this.results.files].sort((a, b) => b.size - a.size).slice(0, 10)
    sortedFiles.forEach((file, index) => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      console.log(
        `  ${(index + 1).toString().padStart(2)}. ${file.name.padEnd(30)} ${sizeMB.padStart(6)}MB`
      )
    })

    // 显示建议
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 优化建议:')
      this.results.recommendations.forEach((rec) => {
        const icon = rec.type === 'warning' ? '⚠️' : 'ℹ️'
        console.log(`\n  ${icon} ${rec.message}`)
        if (rec.files) {
          rec.files.forEach((file) => console.log(`     - ${file}`))
        }
        if (rec.suggestions) {
          rec.suggestions.forEach((suggestion) => console.log(`     💡 ${suggestion}`))
        }
      })
    }
  }

  saveReport() {
    const reportPath = join(rootDir, 'bundle-analysis.json')
    writeFileSync(reportPath, JSON.stringify(this.results, null, 2))
    this.log(`详细报告已保存到: ${reportPath}`, 'info')
  }

  async run() {
    try {
      this.log('🔍 开始 Bundle 分析...', 'info')

      this.ensureBuild()
      this.analyzeFiles()
      this.generateRecommendations()
      this.printReport()
      this.saveReport()

      this.log('✨ Bundle 分析完成！', 'success')
    } catch (error) {
      this.log(`Bundle 分析失败: ${error.message}`, 'error')
      throw error
    }
  }
}

// 运行分析器
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new BundleAnalyzer()
  analyzer.run().catch((error) => {
    console.error('Bundle 分析执行失败:', error)
    process.exit(1)
  })
}

export default BundleAnalyzer
