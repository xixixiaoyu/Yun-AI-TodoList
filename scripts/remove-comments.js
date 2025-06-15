#!/usr/bin/env node

/**
 * 批量删除代码注释脚本
 * 支持删除 Vue、TypeScript、JavaScript 文件中的注释
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

class CommentRemover {
  constructor() {
    this.processedFiles = 0
    this.totalComments = 0
    this.preservePatterns = [
      /\/\*\*[\s\S]*?\*\//g, // JSDoc 注释
      /\/\*\s*@[\s\S]*?\*\//g, // 特殊注解注释
      /\/\*\s*(TODO|FIXME|NOTE|HACK|XXX)[\s\S]*?\*\//g, // 重要标记注释
      /\/\/\s*(TODO|FIXME|NOTE|HACK|XXX).*$/gm, // 重要标记单行注释
      /\/\*\s*(Copyright|License|Author)[\s\S]*?\*\//g, // 版权信息
      /\/\/\s*(Copyright|License|Author).*$/gm // 版权信息单行
    ]
  }

  /**
   * 获取需要处理的文件列表
   */
  getSourceFiles() {
    const files = []
    const extensions = ['.vue', '.ts', '.js', '.jsx', '.tsx']

    const walkDir = dir => {
      try {
        const entries = readdirSync(dir, { withFileTypes: true })

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (
            entry.isDirectory() &&
            !entry.name.startsWith('.') &&
            entry.name !== 'node_modules' &&
            entry.name !== 'dist' &&
            entry.name !== 'build'
          ) {
            walkDir(fullPath)
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name)
            if (extensions.includes(ext)) {
              files.push(fullPath)
            }
          }
        }
      } catch (_error) {
        console.warn(`无法访问目录: ${dir}`)
      }
    }

    // 处理源代码目录
    const srcDir = path.join(rootDir, 'src')
    walkDir(srcDir)

    // 处理脚本目录（排除当前脚本）
    const scriptsDir = path.join(rootDir, 'scripts')
    walkDir(scriptsDir)

    // 处理根目录的配置文件
    const configFiles = [
      'vite.config.ts',
      'vitest.config.ts',
      'eslint.config.js',
      'electron-builder.config.js'
    ]

    for (const configFile of configFiles) {
      const configPath = path.join(rootDir, configFile)
      try {
        if (statSync(configPath).isFile()) {
          files.push(configPath)
        }
      } catch (_error) {
        // 文件不存在，跳过
      }
    }

    return files.filter(file => !file.endsWith('remove-comments.js'))
  }

  /**
   * 检查注释是否应该保留
   */
  shouldPreserveComment(comment) {
    return this.preservePatterns.some(pattern => pattern.test(comment))
  }

  /**
   * 删除 Vue 文件中的注释
   */
  removeVueComments(content) {
    let commentCount = 0

    // 分离 template、script 和 style 部分
    const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/i)
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/i)

    let result = content

    // 处理 template 部分的 HTML 注释
    if (templateMatch) {
      const templateContent = templateMatch[1]
      const cleanedTemplate = templateContent.replace(/<!--[\s\S]*?-->/g, match => {
        if (!this.shouldPreserveComment(match)) {
          commentCount++
          return ''
        }
        return match
      })
      result = result.replace(templateMatch[1], cleanedTemplate)
    }

    // 处理 script 部分的 JS/TS 注释
    if (scriptMatch) {
      const scriptContent = scriptMatch[1]
      const cleanedScript = this.removeJSComments(scriptContent, count => {
        commentCount += count
      })
      result = result.replace(scriptMatch[1], cleanedScript)
    }

    // 处理 style 部分的 CSS 注释
    if (styleMatch) {
      const styleContent = styleMatch[1]
      const cleanedStyle = styleContent.replace(/\/\*[\s\S]*?\*\//g, match => {
        if (!this.shouldPreserveComment(match)) {
          commentCount++
          return ''
        }
        return match
      })
      result = result.replace(styleMatch[1], cleanedStyle)
    }

    this.totalComments += commentCount
    return result
  }

  /**
   * 删除 JavaScript/TypeScript 注释
   */
  removeJSComments(content, countCallback) {
    let commentCount = 0

    // 保护字符串和正则表达式
    const strings = []
    let stringIndex = 0

    // 临时替换字符串字面量
    content = content.replace(/(["'`])(?:(?!\1)[^\\]|\\[\s\S])*\1/g, match => {
      const placeholder = `__STRING_${stringIndex++}__`
      strings.push(match)
      return placeholder
    })

    // 删除多行注释
    content = content.replace(/\/\*[\s\S]*?\*\//g, match => {
      if (!this.shouldPreserveComment(match)) {
        commentCount++
        return ''
      }
      return match
    })

    // 删除单行注释（但不删除 URL 中的 //）
    content = content.replace(/\/\/.*$/gm, (match, offset) => {
      // 检查是否在 URL 中
      const beforeMatch = content.substring(Math.max(0, offset - 10), offset)
      if (beforeMatch.includes('http') || beforeMatch.includes('https')) {
        return match
      }

      if (!this.shouldPreserveComment(match)) {
        commentCount++
        return ''
      }
      return match
    })

    // 恢复字符串字面量
    strings.forEach((str, index) => {
      content = content.replace(`__STRING_${index}__`, str)
    })

    if (countCallback) {
      countCallback(commentCount)
    } else {
      this.totalComments += commentCount
    }

    return content
  }

  /**
   * 清理多余的空行
   */
  cleanupEmptyLines(content) {
    // 将连续的空行合并为单个空行
    return content.replace(/\n\s*\n\s*\n/g, '\n\n')
  }

  /**
   * 处理单个文件
   */
  processFile(filePath) {
    try {
      const content = readFileSync(filePath, 'utf8')
      const ext = path.extname(filePath)
      let processedContent = content

      if (ext === '.vue') {
        processedContent = this.removeVueComments(content)
      } else if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
        processedContent = this.removeJSComments(content)
      }

      // 清理多余的空行
      processedContent = this.cleanupEmptyLines(processedContent)

      // 只有内容发生变化时才写入文件
      if (processedContent !== content) {
        writeFileSync(filePath, processedContent, 'utf8')
        this.processedFiles++
        console.log(`✅ 处理完成: ${path.relative(rootDir, filePath)}`)
      }
    } catch (error) {
      console.error(`❌ 处理失败: ${path.relative(rootDir, filePath)} - ${error.message}`)
    }
  }

  /**
   * 执行批量删除
   */
  async run() {
    console.log('🚀 开始批量删除代码注释...\n')

    const files = this.getSourceFiles()
    console.log(`📁 找到 ${files.length} 个文件需要处理\n`)

    const startTime = Date.now()

    for (const file of files) {
      this.processFile(file)
    }

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    console.log('\n🎉 批量删除注释完成！')
    console.log(`📊 统计信息:`)
    console.log(`  - 处理文件数: ${this.processedFiles}`)
    console.log(`  - 删除注释数: ${this.totalComments}`)
    console.log(`  - 耗时: ${duration}s`)

    if (this.processedFiles > 0) {
      console.log('\n💡 建议:')
      console.log('  - 运行测试确保功能正常: pnpm test')
      console.log('  - 检查代码格式: pnpm format')
      console.log('  - 提交前检查: pnpm lint')
    }
  }
}

// 执行脚本
const remover = new CommentRemover()
remover.run().catch(console.error)
