#!/usr/bin/env node

/**
 * 创建 PWA 截图文件的脚本
 * 生成占位符截图，避免 PWA manifest 错误
 */

import { createCanvas } from 'canvas'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 项目根目录
const projectRoot = join(__dirname, '..')
const publicDir = join(projectRoot, 'apps/frontend/public')

// 确保 public 目录存在
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true })
}

/**
 * 创建截图占位符
 */
function createScreenshot(width, height, filename, title) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#79b4a6')
  gradient.addColorStop(1, '#5a9b8a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // 添加网格背景
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  for (let i = 0; i < width; i += 50) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, height)
    ctx.stroke()
  }
  for (let i = 0; i < height; i += 50) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(width, i)
    ctx.stroke()
  }

  // 主标题
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 48px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Yun AI TodoList', width / 2, height / 2 - 60)

  // 副标题
  ctx.font = '24px Arial, sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fillText(title, width / 2, height / 2 - 10)

  // 功能特性
  const features = ['✓ AI 智能分析', '✓ 番茄钟计时', '✓ 日历视图', '✓ 离线同步']

  ctx.font = '18px Arial, sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  features.forEach((feature, index) => {
    ctx.fillText(feature, width / 2, height / 2 + 40 + index * 30)
  })

  // 尺寸信息
  ctx.font = '14px Arial, sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText(`${width} × ${height}`, width - 20, height - 20)

  // 保存文件
  const buffer = canvas.toBuffer('image/png')
  const filepath = join(publicDir, filename)
  writeFileSync(filepath, buffer)
  console.log(`✅ 创建截图: ${filename} (${width}×${height})`)
}

/**
 * 创建简单的图标占位符
 */
function createIcon(size, filename) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // 背景圆形
  const centerX = size / 2
  const centerY = size / 2
  const radius = size / 2 - 10

  // 渐变背景
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
  gradient.addColorStop(0, '#79b4a6')
  gradient.addColorStop(1, '#5a9b8a')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
  ctx.fill()

  // 白色边框
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  ctx.stroke()

  // 中心图标 (简化的待办列表图标)
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${size * 0.4}px Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('✓', centerX, centerY)

  // 保存文件
  const buffer = canvas.toBuffer('image/png')
  const filepath = join(publicDir, filename)
  writeFileSync(filepath, buffer)
  console.log(`✅ 创建图标: ${filename} (${size}×${size})`)
}

// 主函数
function main() {
  console.log('🚀 开始创建 PWA 资源文件...')

  try {
    // 创建截图
    createScreenshot(1280, 720, 'screenshot-wide.png', 'AI 驱动的智能待办应用')
    createScreenshot(750, 1334, 'screenshot-narrow.png', '移动端优化体验')

    // 检查并创建缺失的图标
    const iconFiles = [
      { size: 192, filename: 'pwa-192x192.png' },
      { size: 512, filename: 'pwa-512x512.png' },
      { size: 180, filename: 'apple-touch-icon.png' },
    ]

    iconFiles.forEach(({ size, filename }) => {
      const filepath = join(publicDir, filename)
      if (!existsSync(filepath)) {
        createIcon(size, filename)
      } else {
        console.log(`⏭️  图标已存在: ${filename}`)
      }
    })

    console.log('✅ PWA 资源文件创建完成!')
    console.log('\n📋 创建的文件:')
    console.log('  - screenshot-wide.png (1280×720)')
    console.log('  - screenshot-narrow.png (750×1334)')
    console.log('  - 检查并补充了必要的图标文件')
  } catch (error) {
    console.error('❌ 创建 PWA 资源文件时出错:', error.message)
    process.exit(1)
  }
}

// 运行脚本
main()
