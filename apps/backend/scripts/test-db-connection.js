#!/usr/bin/env node

/**
 * 数据库连接测试脚本
 * 用于在部署时验证数据库连接是否正常
 */

const { PrismaClient } = require('@prisma/client')

async function testDatabaseConnection() {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  })

  try {
    console.log('🔍 Testing database connection...')
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'unknown'}`)

    // 隐藏敏感信息的 DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || 'not set'
    const maskedUrl = dbUrl.replace(/:[^:]*@/, ':***@')
    console.log(`🔗 Database URL: ${maskedUrl}`)

    // 测试基本连接
    console.log('⏳ Attempting to connect...')
    await prisma.$connect()
    console.log('✅ Database connection successful!')

    // 测试查询能力
    console.log('⏳ Testing query capability...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database query test successful!')

    // 检查数据库版本
    try {
      const version = await prisma.$queryRaw`SELECT version()`
      console.log(
        `📊 Database version: ${version[0].version.split(' ')[0]} ${version[0].version.split(' ')[1]}`
      )
    } catch (error) {
      console.log('⚠️  Could not retrieve database version')
    }

    // 检查表是否存在
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `
      console.log(`📋 Found ${tables.length} tables in database`)
      if (tables.length > 0) {
        console.log('📋 Tables:', tables.map((t) => t.table_name).join(', '))
      }
    } catch (error) {
      console.log('⚠️  Could not retrieve table information')
    }

    await prisma.$disconnect()
    console.log('🎉 Database connection test completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database connection test failed!')
    console.error('📋 Error details:')
    console.error(`   Type: ${error.constructor.name}`)
    console.error(`   Message: ${error.message}`)

    if (error.code) {
      console.error(`   Code: ${error.code}`)
    }

    if (error.meta) {
      console.error(`   Meta: ${JSON.stringify(error.meta, null, 2)}`)
    }

    // 提供常见问题的解决建议
    console.error('\n🔧 Troubleshooting suggestions:')

    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('   • Check if DATABASE_URL uses the correct hostname')
      console.error('   • Ensure you are using the Internal Database URL from Render')
      console.error('   • Verify the database service is running and accessible')
    }

    if (error.message.includes('authentication failed')) {
      console.error('   • Check database username and password in DATABASE_URL')
      console.error('   • Ensure the database user has proper permissions')
    }

    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('   • Check if the database name in DATABASE_URL is correct')
      console.error('   • Ensure the database has been created')
    }

    console.error('   • Verify DATABASE_URL format: postgresql://user:password@host:port/database')
    console.error('   • Check if database and web service are in the same region')

    await prisma.$disconnect()
    process.exit(1)
  }
}

// 运行测试
testDatabaseConnection()
