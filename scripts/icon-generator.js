#!/usr/bin/env node

/**
 * 图标生成和验证脚本
 * 生成各种平台所需的图标文件并验证其正确性
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
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

// 图标配置
const iconConfig = {
  // 源图标文件
  source: path.join(rootDir, 'build/icon.png'),

  // 输出目录
  outputs: {
    build: path.join(rootDir, 'build'),
    frontend: path.join(rootDir, 'apps/frontend/public'),
    dist: path.join(rootDir, 'dist'),
  },

  // 需要生成的图标
  icons: [
    // PWA 图标
    { name: 'pwa-192x192.png', size: '192x192', output: 'frontend' },
    { name: 'pwa-512x512.png', size: '512x512', output: 'frontend' },
    { name: 'apple-touch-icon.png', size: '180x180', output: 'frontend' },
    { name: 'favicon.ico', size: '32x32', output: 'frontend', format: 'ico' },

    // Electron 图标
    { name: 'icon.png', size: '512x512', output: 'build' },
    { name: 'icon.ico', size: '256x256', output: 'build', format: 'ico' },
    { name: 'icon.icns', size: '512x512', output: 'build', format: 'icns' },

    // 移动端图标
    { name: 'icon-20.png', size: '20x20', output: 'build' },
    { name: 'icon-29.png', size: '29x29', output: 'build' },
    { name: 'icon-40.png', size: '40x40', output: 'build' },
    { name: 'icon-60.png', size: '60x60', output: 'build' },
    { name: 'icon-76.png', size: '76x76', output: 'build' },
    { name: 'icon-83.5.png', size: '83x83', output: 'build' },
    { name: 'icon-1024.png', size: '1024x1024', output: 'build' },
  ],
}

class IconGenerator {
  constructor() {
    this.hasImageMagick = this.checkImageMagick()
    this.hasSips = this.checkSips()
  }

  checkImageMagick() {
    try {
      execSync('which convert', { stdio: 'pipe' })
      return true
    } catch {
      return false
    }
  }

  checkSips() {
    try {
      execSync('which sips', { stdio: 'pipe' })
      return true
    } catch {
      return false
    }
  }

  async run() {
    console.log(colorize('🎨 开始图标生成和验证...', 'blue'))
    console.log('')

    try {
      this.checkSource()
      this.createDirectories()
      await this.generateIcons()
      this.validateIcons()
      this.generateReport()
    } catch (error) {
      console.error(colorize('❌ 图标处理失败:', 'red'), error.message)
      process.exit(1)
    }
  }

  checkSource() {
    console.log(colorize('🔍 检查源图标文件...', 'cyan'))

    if (!existsSync(iconConfig.source)) {
      throw new Error(`源图标文件不存在: ${iconConfig.source}`)
    }

    // 检查文件类型
    try {
      const fileInfo = execSync(`file "${iconConfig.source}"`, { encoding: 'utf8' })
      if (!fileInfo.includes('PNG image data')) {
        console.warn(colorize('⚠️  源文件可能不是有效的 PNG 图像', 'yellow'))
      }

      // 提取尺寸信息
      const sizeMatch = fileInfo.match(/(\d+) x (\d+)/)
      if (sizeMatch) {
        const [, width, height] = sizeMatch
        console.log(`  源图标尺寸: ${width}x${height}`)

        if (width !== height) {
          console.warn(colorize('⚠️  源图标不是正方形，可能影响生成质量', 'yellow'))
        }

        if (parseInt(width) < 512) {
          console.warn(colorize('⚠️  源图标分辨率较低，建议使用 512x512 或更高', 'yellow'))
        }
      }
    } catch (error) {
      console.warn(colorize('⚠️  无法检查源文件信息', 'yellow'))
    }

    console.log('✅ 源图标文件检查完成')
  }

  createDirectories() {
    console.log(colorize('📁 创建输出目录...', 'cyan'))

    Object.values(iconConfig.outputs).forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
        console.log(`  创建目录: ${dir}`)
      }
    })

    console.log('✅ 目录创建完成')
  }

  async generateIcons() {
    console.log(colorize('🎨 生成图标文件...', 'cyan'))

    if (!this.hasImageMagick && !this.hasSips) {
      console.warn(colorize('⚠️  未找到图像处理工具 (ImageMagick 或 sips)', 'yellow'))
      console.warn('  将跳过图标生成，请手动创建所需图标')
      return
    }

    for (const icon of iconConfig.icons) {
      try {
        const outputDir = iconConfig.outputs[icon.output]
        const outputPath = path.join(outputDir, icon.name)

        console.log(`  生成: ${icon.name} (${icon.size})`)

        if (icon.format === 'ico') {
          // 生成 ICO 文件
          if (this.hasImageMagick) {
            execSync(`convert "${iconConfig.source}" -resize ${icon.size} "${outputPath}"`, {
              stdio: 'pipe',
            })
          } else {
            // 使用 sips 生成 PNG 然后重命名
            const tempPng = outputPath.replace('.ico', '.png')
            execSync(
              `sips -z ${icon.size.split('x')[0]} ${icon.size.split('x')[1]} "${iconConfig.source}" --out "${tempPng}"`,
              { stdio: 'pipe' }
            )
            execSync(`mv "${tempPng}" "${outputPath}"`, { stdio: 'pipe' })
          }
        } else if (icon.format === 'icns') {
          // 生成 ICNS 文件 (仅 macOS)
          if (process.platform === 'darwin') {
            const tempDir = path.join(outputDir, 'icon.iconset')
            if (!existsSync(tempDir)) {
              mkdirSync(tempDir)
            }

            // 生成不同尺寸的 PNG 文件
            const sizes = [16, 32, 64, 128, 256, 512, 1024]
            for (const size of sizes) {
              const fileName = `icon_${size}x${size}.png`
              const filePath = path.join(tempDir, fileName)
              execSync(`sips -z ${size} ${size} "${iconConfig.source}" --out "${filePath}"`, {
                stdio: 'pipe',
              })

              // 生成 @2x 版本
              if (size <= 512) {
                const fileName2x = `icon_${size}x${size}@2x.png`
                const filePath2x = path.join(tempDir, fileName2x)
                execSync(
                  `sips -z ${size * 2} ${size * 2} "${iconConfig.source}" --out "${filePath2x}"`,
                  { stdio: 'pipe' }
                )
              }
            }

            // 转换为 ICNS
            execSync(`iconutil -c icns "${tempDir}" -o "${outputPath}"`, { stdio: 'pipe' })

            // 清理临时文件
            execSync(`rm -rf "${tempDir}"`, { stdio: 'pipe' })
          } else {
            console.warn(`    跳过 ICNS 生成 (仅支持 macOS)`)
          }
        } else {
          // 生成 PNG 文件
          if (this.hasImageMagick) {
            execSync(`convert "${iconConfig.source}" -resize ${icon.size} "${outputPath}"`, {
              stdio: 'pipe',
            })
          } else if (this.hasSips) {
            execSync(
              `sips -z ${icon.size.split('x')[0]} ${icon.size.split('x')[1]} "${iconConfig.source}" --out "${outputPath}"`,
              { stdio: 'pipe' }
            )
          }
        }
      } catch (error) {
        console.error(`    ❌ 生成失败: ${icon.name} - ${error.message}`)
      }
    }

    console.log('✅ 图标生成完成')
  }

  validateIcons() {
    console.log(colorize('🔍 验证图标文件...', 'cyan'))

    const results = {
      valid: 0,
      invalid: 0,
      missing: 0,
      issues: [],
    }

    for (const icon of iconConfig.icons) {
      const outputDir = iconConfig.outputs[icon.output]
      const outputPath = path.join(outputDir, icon.name)

      if (!existsSync(outputPath)) {
        results.missing++
        results.issues.push(`缺少文件: ${icon.name}`)
        continue
      }

      try {
        const fileInfo = execSync(`file "${outputPath}"`, { encoding: 'utf8' })

        if (icon.format === 'ico' && !fileInfo.includes('MS Windows icon')) {
          if (!fileInfo.includes('PNG image data')) {
            results.invalid++
            results.issues.push(`${icon.name}: 不是有效的 ICO 或 PNG 文件`)
            continue
          }
        } else if (icon.format === 'icns' && !fileInfo.includes('Mac OS X icon')) {
          results.invalid++
          results.issues.push(`${icon.name}: 不是有效的 ICNS 文件`)
          continue
        } else if (!icon.format && !fileInfo.includes('PNG image data')) {
          results.invalid++
          results.issues.push(`${icon.name}: 不是有效的 PNG 文件`)
          continue
        }

        results.valid++
      } catch (error) {
        results.invalid++
        results.issues.push(`${icon.name}: 验证失败 - ${error.message}`)
      }
    }

    console.log(`  有效文件: ${results.valid}`)
    console.log(`  无效文件: ${results.invalid}`)
    console.log(`  缺少文件: ${results.missing}`)

    if (results.issues.length > 0) {
      console.log(colorize('⚠️  发现问题:', 'yellow'))
      results.issues.forEach((issue) => console.log(`    - ${issue}`))
    }

    console.log('✅ 图标验证完成')
  }

  generateReport() {
    console.log('')
    console.log(colorize('📋 图标处理报告', 'magenta'))
    console.log('='.repeat(50))

    console.log('工具支持:')
    console.log(`  ImageMagick: ${this.hasImageMagick ? '✅' : '❌'}`)
    console.log(`  sips (macOS): ${this.hasSips ? '✅' : '❌'}`)

    console.log('')
    console.log('生成的图标文件:')

    Object.entries(iconConfig.outputs).forEach(([key, dir]) => {
      console.log(`  ${key}: ${dir}`)
      const icons = iconConfig.icons.filter((icon) => icon.output === key)
      icons.forEach((icon) => {
        const filePath = path.join(dir, icon.name)
        const exists = existsSync(filePath)
        console.log(`    ${exists ? '✅' : '❌'} ${icon.name} (${icon.size})`)
      })
    })

    console.log('')

    if (!this.hasImageMagick && !this.hasSips) {
      console.log(colorize('💡 建议安装图像处理工具:', 'cyan'))
      console.log('  macOS: 已内置 sips 工具')
      console.log('  ImageMagick: brew install imagemagick')
      console.log('  或手动创建所需的图标文件')
    } else {
      console.log(colorize('✅ 图标处理完成！', 'green'))
    }
  }
}

// 运行图标生成器
const generator = new IconGenerator()
generator.run()
