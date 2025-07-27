#!/usr/bin/env node

/**
 * 环境变量验证脚本
 * 用于检查部署所需的环境变量是否正确配置
 */

// 加载环境变量 - 从根目录的 .env 文件
require('dotenv').config({ path: '../../.env' })

function validateEnvVars() {
  console.log('🔍 验证环境变量配置...\n')

  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL']

  const optionalVars = [
    'NODE_ENV',
    'PORT',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_IN',
    'BCRYPT_ROUNDS',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
    'REDIS_DB',
    'OPENAI_API_KEY',
    'DEEPSEEK_API_KEY',
    'GOOGLE_SEARCH_API_KEY',
    'GOOGLE_SEARCH_ENGINE_ID',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'MAIL_FROM_NAME',
    'MAIL_FROM_ADDRESS',
    'LOG_LEVEL',
  ]

  let hasErrors = false

  // 检查必需的环境变量
  console.log('📋 必需的环境变量:')
  requiredVars.forEach((varName) => {
    const value = process.env[varName]
    if (!value) {
      console.log(`❌ ${varName}: 未设置`)
      hasErrors = true
    } else {
      // 对敏感信息进行脱敏显示
      let displayValue = value
      if (varName.includes('SECRET') || varName.includes('PASSWORD')) {
        displayValue = '***' + value.slice(-4)
      } else if (varName === 'DATABASE_URL') {
        displayValue = value.replace(/:[^:]*@/, ':***@')
      }
      console.log(`✅ ${varName}: ${displayValue}`)
    }
  })

  console.log('\n📋 可选的环境变量:')
  optionalVars.forEach((varName) => {
    const value = process.env[varName]
    if (value) {
      console.log(`✅ ${varName}: ${value}`)
    } else {
      console.log(`⚠️  ${varName}: 未设置 (将使用默认值)`)
    }
  })

  // 验证 JWT 密钥强度
  console.log('\n🔐 JWT 密钥验证:')
  const jwtSecret = process.env.JWT_SECRET
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET

  if (jwtSecret) {
    if (jwtSecret.length < 32) {
      console.log('❌ JWT_SECRET 长度不足 (建议至少32字符)')
      hasErrors = true
    } else if (jwtSecret.length < 64) {
      console.log('⚠️  JWT_SECRET 长度建议增加到64字符以提高安全性')
    } else {
      console.log('✅ JWT_SECRET 长度符合安全要求')
    }
  }

  if (jwtRefreshSecret) {
    if (jwtRefreshSecret.length < 32) {
      console.log('❌ JWT_REFRESH_SECRET 长度不足 (建议至少32字符)')
      hasErrors = true
    } else if (jwtRefreshSecret.length < 64) {
      console.log('⚠️  JWT_REFRESH_SECRET 长度建议增加到64字符以提高安全性')
    } else {
      console.log('✅ JWT_REFRESH_SECRET 长度符合安全要求')
    }
  }

  if (jwtSecret && jwtRefreshSecret && jwtSecret === jwtRefreshSecret) {
    console.log('❌ JWT_SECRET 和 JWT_REFRESH_SECRET 不能相同')
    hasErrors = true
  }

  // 验证 DATABASE_URL 格式
  console.log('\n🗄️  数据库 URL 验证:')
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    if (dbUrl.startsWith('postgresql://')) {
      console.log('✅ DATABASE_URL 格式正确 (PostgreSQL)')

      // 检查是否包含必要的组件
      const urlParts = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
      if (urlParts) {
        const [, user, password, host, port, database] = urlParts
        console.log(`   用户: ${user}`)
        console.log(`   主机: ${host}`)
        console.log(`   端口: ${port}`)
        console.log(`   数据库: ${database}`)

        if (host.includes('localhost') || host.includes('127.0.0.1')) {
          console.log('⚠️  检测到本地主机地址，确保在 Render 中使用 Internal Database URL')
        }
      }
    } else {
      console.log('❌ DATABASE_URL 格式不正确，应以 postgresql:// 开头')
      hasErrors = true
    }
  }

  // 验证 FRONTEND_URL 格式
  console.log('\n🌐 前端 URL 验证:')
  const frontendUrl = process.env.FRONTEND_URL
  if (frontendUrl) {
    try {
      const url = new URL(frontendUrl)
      console.log(`✅ FRONTEND_URL 格式正确: ${url.origin}`)

      if (url.protocol === 'http:' && !url.hostname.includes('localhost')) {
        console.log('⚠️  生产环境建议使用 HTTPS')
      }
    } catch (error) {
      console.log('❌ FRONTEND_URL 格式不正确')
      hasErrors = true
    }
  }

  // 总结
  console.log('\n📊 验证结果:')
  if (hasErrors) {
    console.log('❌ 发现配置问题，请修复后重新部署')
    process.exit(1)
  } else {
    console.log('✅ 所有环境变量配置正确！')
    process.exit(0)
  }
}

// 运行验证
validateEnvVars()
