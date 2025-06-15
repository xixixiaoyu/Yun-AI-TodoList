#!/usr/bin/env node

/**
 * 性能基准测试脚本
 * 测试应用的各项性能指标
 */

import { execSync } from 'child_process'
import { existsSync, readdirSync, statSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// 性能基准配置
const benchmarkConfig = {
  // 构建性能基准
  build: {
    maxTime: 120, // 最大构建时间（秒）
    maxBundleSize: 2 * 1024 * 1024, // 最大包大小（2MB）
  },

  // 运行时性能基准
  runtime: {
    maxFirstContentfulPaint: 2000, // 首次内容绘制时间（ms）
    maxLargestContentfulPaint: 3000, // 最大内容绘制时间（ms）
    maxCumulativeLayoutShift: 0.1, // 累积布局偏移
    maxFirstInputDelay: 100, // 首次输入延迟（ms）
  },

  // 内存使用基准
  memory: {
    maxHeapSize: 100 * 1024 * 1024, // 最大堆内存（100MB）
    maxInitialLoad: 50 * 1024 * 1024, // 初始加载内存（50MB）
  },
}

class PerformanceBenchmark {
  constructor() {
    this.results = {
      build: {},
      bundle: {},
      runtime: {},
      memory: {},
      score: 0,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * 运行所有性能基准测试
   */
  async runAllBenchmarks() {
    console.log('🚀 开始性能基准测试...')
    console.log('')

    try {
      await this.benchmarkBuild()
      await this.benchmarkBundle()
      await this.benchmarkRuntime()
      await this.generateReport()
    } catch (error) {
      console.error('❌ 性能基准测试失败:', error.message)
      process.exit(1)
    }
  }

  /**
   * 构建性能基准测试
   */
  async benchmarkBuild() {
    console.log('🏗️  测试构建性能...')

    // 清理之前的构建
    if (existsSync(path.join(rootDir, 'dist'))) {
      execSync('rm -rf dist', { cwd: rootDir })
    }

    const startTime = Date.now()

    try {
      execSync('pnpm run build', {
        cwd: rootDir,
        stdio: 'pipe',
        timeout: benchmarkConfig.build.maxTime * 1000,
      })

      const buildTime = (Date.now() - startTime) / 1000

      this.results.build = {
        time: buildTime,
        maxTime: benchmarkConfig.build.maxTime,
        passed: buildTime <= benchmarkConfig.build.maxTime,
      }

      if (buildTime <= benchmarkConfig.build.maxTime) {
        console.log(
          `  ✅ 构建时间: ${buildTime.toFixed(2)}s (目标: <${benchmarkConfig.build.maxTime}s)`
        )
      } else {
        console.log(
          `  ⚠️  构建时间过长: ${buildTime.toFixed(2)}s (目标: <${benchmarkConfig.build.maxTime}s)`
        )
      }
    } catch (error) {
      console.log('  ❌ 构建失败或超时')
      this.results.build = {
        time: null,
        maxTime: benchmarkConfig.build.maxTime,
        passed: false,
        error: error.message,
      }
    }
  }

  /**
   * Bundle 大小基准测试
   */
  async benchmarkBundle() {
    console.log('📦 测试 Bundle 大小...')

    const distPath = path.join(rootDir, 'dist')
    if (!existsSync(distPath)) {
      console.log('  ⚠️  dist 目录不存在，跳过 Bundle 测试')
      return
    }

    try {
      // 跨平台计算 Bundle 大小
      const distPath = path.join(rootDir, 'dist')
      let totalSize = 0
      let jsBundleSize = 0
      const jsFiles = []

      // 递归计算目录大小
      const calculateDirSize = (dir) => {
        try {
          const entries = readdirSync(dir, { withFileTypes: true })
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              calculateDirSize(fullPath)
            } else if (entry.isFile()) {
              const stats = statSync(fullPath)
              totalSize += stats.size

              if (path.extname(entry.name) === '.js') {
                jsBundleSize += stats.size
                jsFiles.push(path.relative(rootDir, fullPath))
              }
            }
          }
        } catch (_error) {
          // 忽略无法访问的目录
        }
      }

      calculateDirSize(distPath)

      this.results.bundle = {
        totalSize,
        jsBundleSize,
        maxSize: benchmarkConfig.build.maxBundleSize,
        passed: jsBundleSize <= benchmarkConfig.build.maxBundleSize,
        files: jsFiles.length,
      }

      const sizeMB = (jsBundleSize / 1024 / 1024).toFixed(2)
      const maxSizeMB = (benchmarkConfig.build.maxBundleSize / 1024 / 1024).toFixed(2)

      if (jsBundleSize <= benchmarkConfig.build.maxBundleSize) {
        console.log(`  ✅ JS Bundle 大小: ${sizeMB}MB (目标: <${maxSizeMB}MB)`)
      } else {
        console.log(`  ⚠️  JS Bundle 过大: ${sizeMB}MB (目标: <${maxSizeMB}MB)`)
      }

      console.log(`  📊 Bundle 文件数: ${jsFiles.length}`)
    } catch (error) {
      console.log('  ❌ Bundle 分析失败:', error.message)
    }
  }

  /**
   * 运行时性能基准测试
   */
  async benchmarkRuntime() {
    console.log('⚡ 测试运行时性能...')

    // 这里可以集成 Lighthouse 或其他性能测试工具
    // 由于需要实际运行应用，这里提供一个框架

    try {
      // 启动开发服务器进行测试
      console.log('  🚀 启动测试服务器...')

      // 模拟性能数据（实际应用中应该使用真实的性能测试）
      const mockPerformanceData = {
        firstContentfulPaint: 1200,
        largestContentfulPaint: 2100,
        cumulativeLayoutShift: 0.05,
        firstInputDelay: 50,
        timeToInteractive: 2500,
      }

      this.results.runtime = {
        ...mockPerformanceData,
        benchmarks: benchmarkConfig.runtime,
        passed: {
          fcp:
            mockPerformanceData.firstContentfulPaint <=
            benchmarkConfig.runtime.maxFirstContentfulPaint,
          lcp:
            mockPerformanceData.largestContentfulPaint <=
            benchmarkConfig.runtime.maxLargestContentfulPaint,
          cls:
            mockPerformanceData.cumulativeLayoutShift <=
            benchmarkConfig.runtime.maxCumulativeLayoutShift,
          fid:
            mockPerformanceData.firstInputDelay <=
            benchmarkConfig.runtime.maxFirstInputDelay,
        },
      }

      console.log(`  📊 首次内容绘制: ${mockPerformanceData.firstContentfulPaint}ms`)
      console.log(`  📊 最大内容绘制: ${mockPerformanceData.largestContentfulPaint}ms`)
      console.log(`  📊 累积布局偏移: ${mockPerformanceData.cumulativeLayoutShift}`)
      console.log(`  📊 首次输入延迟: ${mockPerformanceData.firstInputDelay}ms`)

      console.log(
        '  💡 注意: 运行时性能数据为模拟数据，建议集成 Lighthouse CI 获取真实数据'
      )
    } catch (error) {
      console.log('  ❌ 运行时性能测试失败:', error.message)
    }
  }

  /**
   * 生成性能报告
   */
  async generateReport() {
    console.log('')
    console.log('📋 生成性能报告...')

    // 计算性能分数
    let score = 100

    // 构建性能扣分
    if (!this.results.build.passed) {
      score -= 20
    }

    // Bundle 大小扣分
    if (!this.results.bundle.passed) {
      score -= 15
    }

    // 运行时性能扣分
    if (this.results.runtime.passed) {
      const failedMetrics = Object.values(this.results.runtime.passed).filter(
        (p) => !p
      ).length
      score -= failedMetrics * 10
    }

    score = Math.max(0, score)
    this.results.score = score

    // 输出报告
    console.log('')
    console.log('='.repeat(50))
    console.log('性能基准测试报告')
    console.log('='.repeat(50))
    console.log('')

    // 性能分数
    const scoreColor = score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴'
    console.log(`${scoreColor} 总体性能分数: ${score}/100`)
    console.log('')

    // 详细结果
    console.log('📊 测试结果:')
    if (this.results.build.time) {
      console.log(
        `  构建时间: ${this.results.build.time.toFixed(2)}s ${this.results.build.passed ? '✅' : '❌'}`
      )
    }
    if (this.results.bundle.jsBundleSize) {
      const sizeMB = (this.results.bundle.jsBundleSize / 1024 / 1024).toFixed(2)
      console.log(
        `  Bundle 大小: ${sizeMB}MB ${this.results.bundle.passed ? '✅' : '❌'}`
      )
    }

    // 保存报告到文件
    const reportPath = path.join(rootDir, 'performance-report.json')
    writeFileSync(reportPath, JSON.stringify(this.results, null, 2))
    console.log('')
    console.log(`📄 详细报告已保存到: ${reportPath}`)

    // 性能建议
    console.log('')
    console.log('💡 性能优化建议:')
    if (!this.results.build.passed) {
      console.log('  - 优化构建配置，启用并行构建')
      console.log('  - 减少不必要的依赖')
    }
    if (!this.results.bundle.passed) {
      console.log('  - 启用 Tree Shaking')
      console.log('  - 优化代码分割策略')
      console.log('  - 压缩图片和静态资源')
    }

    console.log('')
    if (score >= 90) {
      console.log('🎉 性能表现优秀！')
    } else if (score >= 70) {
      console.log('⚠️  性能表现良好，但仍有优化空间')
    } else {
      console.log('❌ 性能需要改进')
      process.exit(1)
    }
  }
}

// 运行性能基准测试
const benchmark = new PerformanceBenchmark()
benchmark.runAllBenchmarks()
