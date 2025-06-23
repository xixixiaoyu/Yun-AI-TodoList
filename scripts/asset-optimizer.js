#!/usr/bin/env node

/**
 * 资源文件优化脚本
 * 检查和优化项目中的静态资源文件
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, statSync, readdirSync } from 'fs'
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

// 资源配置
const assetConfig = {
  // 检查的目录
  directories: [
    path.join(rootDir, 'apps/frontend/public'),
    path.join(rootDir, 'apps/frontend/src/assets'),
    path.join(rootDir, 'build'),
  ],

  // 文件类型配置
  fileTypes: {
    images: {
      extensions: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.icns'],
      maxSize: 1024 * 1024, // 1MB
      recommendations: {
        '.png': 'Consider using WebP for better compression',
        '.jpg': 'Consider using WebP for better compression',
        '.jpeg': 'Consider using WebP for better compression',
      },
    },
    fonts: {
      extensions: ['.woff', '.woff2', '.ttf', '.eot', '.otf'],
      maxSize: 500 * 1024, // 500KB
      recommendations: {
        '.ttf': 'Consider converting to WOFF2 for better compression',
        '.eot': 'Consider removing EOT files (IE8 support)',
      },
    },
    documents: {
      extensions: ['.pdf', '.doc', '.docx'],
      maxSize: 5 * 1024 * 1024, // 5MB
    },
    videos: {
      extensions: ['.mp4', '.webm', '.ogg'],
      maxSize: 10 * 1024 * 1024, // 10MB
    },
  },

  // 优化建议
  optimizations: {
    // 大文件阈值
    largeFileThreshold: 100 * 1024, // 100KB

    // 重复文件检查
    checkDuplicates: true,

    // 未使用文件检查
    checkUnused: true,
  },
}

class AssetOptimizer {
  constructor() {
    this.results = {
      files: [],
      issues: [],
      duplicates: [],
      unused: [],
      totalSize: 0,
      largeFiles: [],
    }
  }

  async run() {
    console.log(colorize('🎯 开始资源文件优化检查...', 'blue'))
    console.log('')

    try {
      this.scanFiles()
      this.analyzeFiles()
      this.checkDuplicates()
      this.generateOptimizationReport()
    } catch (error) {
      console.error(colorize('❌ 资源优化检查失败:', 'red'), error.message)
      process.exit(1)
    }
  }

  scanFiles() {
    console.log(colorize('📁 扫描资源文件...', 'cyan'))

    for (const dir of assetConfig.directories) {
      if (existsSync(dir)) {
        console.log(`  扫描目录: ${dir}`)
        this.scanDirectory(dir)
      } else {
        console.log(`  跳过不存在的目录: ${dir}`)
      }
    }

    console.log(`  找到 ${this.results.files.length} 个文件`)
    console.log('✅ 文件扫描完成')
  }

  scanDirectory(dir, basePath = '') {
    const items = readdirSync(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)
      const relativePath = path.join(basePath, item)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // 递归扫描子目录
        this.scanDirectory(fullPath, relativePath)
      } else if (stat.isFile()) {
        // 检查文件扩展名
        const ext = path.extname(item).toLowerCase()
        const fileType = this.getFileType(ext)

        if (fileType) {
          this.results.files.push({
            path: fullPath,
            relativePath,
            name: item,
            extension: ext,
            type: fileType,
            size: stat.size,
            modified: stat.mtime,
          })

          this.results.totalSize += stat.size
        }
      }
    }
  }

  getFileType(extension) {
    for (const [type, config] of Object.entries(assetConfig.fileTypes)) {
      if (config.extensions.includes(extension)) {
        return type
      }
    }
    return null
  }

  analyzeFiles() {
    console.log(colorize('🔍 分析文件...', 'cyan'))

    for (const file of this.results.files) {
      const typeConfig = assetConfig.fileTypes[file.type]

      // 检查文件大小
      if (file.size > typeConfig.maxSize) {
        this.results.issues.push({
          type: 'size',
          severity: 'error',
          file: file.relativePath,
          message: `文件过大: ${this.formatSize(file.size)} > ${this.formatSize(typeConfig.maxSize)}`,
        })
      } else if (file.size > assetConfig.optimizations.largeFileThreshold) {
        this.results.largeFiles.push(file)
      }

      // 检查文件类型建议
      if (typeConfig.recommendations && typeConfig.recommendations[file.extension]) {
        this.results.issues.push({
          type: 'optimization',
          severity: 'warning',
          file: file.relativePath,
          message: typeConfig.recommendations[file.extension],
        })
      }

      // 检查图片文件
      if (file.type === 'images') {
        this.analyzeImage(file)
      }
    }

    console.log(`  分析了 ${this.results.files.length} 个文件`)
    console.log('✅ 文件分析完成')
  }

  analyzeImage(file) {
    try {
      // 检查图片信息
      const fileInfo = execSync(`file "${file.path}"`, { encoding: 'utf8' })

      // 检查 PNG 文件是否可以优化
      if (file.extension === '.png' && file.size > 50 * 1024) {
        this.results.issues.push({
          type: 'optimization',
          severity: 'info',
          file: file.relativePath,
          message: 'PNG 文件可能可以通过压缩工具优化 (如 pngquant, optipng)',
        })
      }

      // 检查 SVG 文件
      if (file.extension === '.svg') {
        const content = readFileSync(file.path, 'utf8')
        if (content.includes('<?xml') && content.includes('<!DOCTYPE')) {
          this.results.issues.push({
            type: 'optimization',
            severity: 'info',
            file: file.relativePath,
            message: 'SVG 文件可能可以通过移除 XML 声明和 DOCTYPE 优化',
          })
        }
      }
    } catch (error) {
      // 忽略文件信息获取错误
    }
  }

  checkDuplicates() {
    console.log(colorize('🔄 检查重复文件...', 'cyan'))

    const sizeGroups = {}

    // 按文件大小分组
    for (const file of this.results.files) {
      if (!sizeGroups[file.size]) {
        sizeGroups[file.size] = []
      }
      sizeGroups[file.size].push(file)
    }

    // 检查相同大小的文件
    for (const [size, files] of Object.entries(sizeGroups)) {
      if (files.length > 1) {
        // 这里可以进一步检查文件内容是否相同
        // 简单起见，只报告相同大小和名称的文件
        const nameGroups = {}
        for (const file of files) {
          if (!nameGroups[file.name]) {
            nameGroups[file.name] = []
          }
          nameGroups[file.name].push(file)
        }

        for (const [name, duplicateFiles] of Object.entries(nameGroups)) {
          if (duplicateFiles.length > 1) {
            this.results.duplicates.push({
              name,
              size: parseInt(size),
              files: duplicateFiles.map((f) => f.relativePath),
            })
          }
        }
      }
    }

    console.log(`  发现 ${this.results.duplicates.length} 组重复文件`)
    console.log('✅ 重复文件检查完成')
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

  generateOptimizationReport() {
    console.log('')
    console.log(colorize('📋 资源优化报告', 'magenta'))
    console.log('='.repeat(50))

    // 总体统计
    console.log('总体统计:')
    console.log(`  文件总数: ${this.results.files.length}`)
    console.log(`  总大小: ${this.formatSize(this.results.totalSize)}`)

    // 按类型分组统计
    const typeStats = {}
    for (const file of this.results.files) {
      if (!typeStats[file.type]) {
        typeStats[file.type] = { count: 0, size: 0 }
      }
      typeStats[file.type].count++
      typeStats[file.type].size += file.size
    }

    console.log('')
    console.log('按类型统计:')
    for (const [type, stats] of Object.entries(typeStats)) {
      console.log(`  ${type}: ${stats.count} 个文件, ${this.formatSize(stats.size)}`)
    }

    // 大文件报告
    if (this.results.largeFiles.length > 0) {
      console.log('')
      console.log(colorize('📊 大文件 (>100KB):', 'yellow'))
      this.results.largeFiles
        .sort((a, b) => b.size - a.size)
        .slice(0, 10)
        .forEach((file) => {
          console.log(`  ${file.relativePath}: ${this.formatSize(file.size)}`)
        })

      if (this.results.largeFiles.length > 10) {
        console.log(`  ... 还有 ${this.results.largeFiles.length - 10} 个大文件`)
      }
    }

    // 重复文件报告
    if (this.results.duplicates.length > 0) {
      console.log('')
      console.log(colorize('🔄 重复文件:', 'yellow'))
      this.results.duplicates.forEach((duplicate) => {
        console.log(`  ${duplicate.name} (${this.formatSize(duplicate.size)}):`)
        duplicate.files.forEach((file) => {
          console.log(`    - ${file}`)
        })
      })
    }

    // 问题报告
    if (this.results.issues.length > 0) {
      console.log('')
      console.log(colorize('⚠️  发现的问题:', 'yellow'))

      const issuesByType = {}
      for (const issue of this.results.issues) {
        if (!issuesByType[issue.severity]) {
          issuesByType[issue.severity] = []
        }
        issuesByType[issue.severity].push(issue)
      }

      for (const [severity, issues] of Object.entries(issuesByType)) {
        console.log(`  ${severity.toUpperCase()}:`)
        issues.slice(0, 5).forEach((issue) => {
          console.log(`    - ${issue.file}: ${issue.message}`)
        })
        if (issues.length > 5) {
          console.log(`    ... 还有 ${issues.length - 5} 个 ${severity} 问题`)
        }
      }
    }

    // 优化建议
    console.log('')
    console.log(colorize('💡 优化建议:', 'cyan'))

    if (this.results.largeFiles.length > 0) {
      console.log('  - 考虑压缩大文件或使用更高效的格式')
    }

    if (this.results.duplicates.length > 0) {
      console.log('  - 移除重复文件以减少包大小')
    }

    const pngFiles = this.results.files.filter((f) => f.extension === '.png').length
    if (pngFiles > 0) {
      console.log('  - 考虑使用 WebP 格式替代 PNG 以获得更好的压缩率')
    }

    const svgFiles = this.results.files.filter((f) => f.extension === '.svg').length
    if (svgFiles > 0) {
      console.log('  - 使用 SVGO 优化 SVG 文件')
    }

    console.log('  - 启用 gzip/brotli 压缩')
    console.log('  - 使用 CDN 加速静态资源加载')

    console.log('')
    console.log(colorize('✅ 资源优化检查完成！', 'green'))
  }
}

// 运行资源优化器
const optimizer = new AssetOptimizer()
optimizer.run()
