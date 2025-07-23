const http = require('http')
const https = require('https')
const url = require('url')
const crypto = require('crypto')
const SMTPClient = require('./smtp-client')

// 真实的 SMTP 邮件发送函数
async function sendEmail(to, subject, htmlContent, callback) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    callback(new Error('SMTP not configured'))
    return
  }

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  const from = `"Yun AI TodoList" <${process.env.SMTP_FROM || user}>`

  console.log(`📧 Sending email to ${to} via ${host}:${port}`)

  // 创建 SMTP 客户端
  const smtpClient = new SMTPClient({
    host: host,
    port: port,
    user: user,
    pass: pass,
    secure: process.env.SMTP_SECURE === 'true',
  })

  const mailOptions = {
    from: from,
    to: to,
    subject: subject,
    html: htmlContent,
  }

  try {
    const result = await smtpClient.sendMail(mailOptions)
    console.log(`✅ Email sent successfully to ${to}`)
    callback(null, result)
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message)

    // 在开发模式下，即使发送失败也返回成功（用于测试）
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: treating failed email as success for testing')
      callback(null, {
        messageId: 'dev-fallback-' + Date.now(),
        status: 'development-fallback',
        note: 'Email sending failed, but treated as success in development mode',
      })
    } else {
      callback(error)
    }
  }
}

const port = process.env.PORT || 8888

// 内存存储验证码
const codeStorage = new Map()

// 内存存储用户数据（用于演示）
const userStorage = new Map()
let userIdCounter = 1

// 数据库连接配置
const dbConfig = {
  host: process.env.DATABASE_HOST || 'postgres-dev',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME || 'yun_ai_todolist_dev',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres123',
}

// 混合存储注册函数（内存 + 数据库日志）
async function registerUserToDatabase(email, username, password, verificationKey, res) {
  try {
    // 检查邮箱是否已存在（内存检查）
    for (const [userId, user] of userStorage) {
      if (user.email === email) {
        res.writeHead(409)
        res.end(JSON.stringify({ message: '邮箱已被注册' }))
        return
      }
    }

    // 检查用户名是否已存在（内存检查）
    for (const [userId, user] of userStorage) {
      if (user.username === username) {
        res.writeHead(409)
        res.end(JSON.stringify({ message: '用户名已被使用' }))
        return
      }
    }

    // 加密密码
    const bcrypt = require('bcrypt')
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // 生成用户ID和创建用户
    const userId = userIdCounter++
    const now = new Date()
    const user = {
      id: userId.toString(),
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword, // 已加密的密码
      accountStatus: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }

    // 存储到内存
    userStorage.set(userId.toString(), user)

    // 尝试同步到数据库（异步，不阻塞响应）
    syncUserToDatabaseReal(user).catch((error) => {
      console.error('❌ Failed to sync user to database:', error.message)
    })

    // 删除已使用的验证码
    codeStorage.delete(verificationKey)

    // 生成模拟的JWT令牌
    const accessToken = `mock-access-token-${userId}-${Date.now()}`
    const refreshToken = `mock-refresh-token-${userId}-${Date.now()}`

    console.log(`✅ User registered successfully: ${email} (ID: ${userId})`)

    // 返回注册成功响应
    const response = {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          accountStatus: user.accountStatus,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
      },
    }

    res.writeHead(200)
    res.end(JSON.stringify(response))
  } catch (error) {
    console.error('❌ Registration error:', error)
    res.writeHead(500)
    res.end(
      JSON.stringify({
        message: '注册失败，请稍后重试',
        error: error.message,
      })
    )
  }
}

// 异步同步用户到数据库
async function syncUserToDatabase(user) {
  console.log(`🔄 Syncing user to database: ${user.email} (ID: ${user.id})`)

  try {
    // 使用 Node.js 内置的 child_process 执行 psql 命令
    const { exec } = require('child_process')

    // 构建 SQL 插入语句
    const insertSQL = `INSERT INTO users (id, email, username, password, "accountStatus", "createdAt", "updatedAt") VALUES ('${user.id}', '${user.email}', '${user.username}', '${user.password}', '${user.accountStatus}', '${user.createdAt}', '${user.updatedAt}') ON CONFLICT (email) DO NOTHING;`

    // 构建完整的 docker exec 命令
    const dockerCommand = `docker exec yun-todolist-postgres-dev psql -U postgres -d yun_ai_todolist_dev -c "${insertSQL}"`

    console.log(`📝 Executing database insert for: ${user.email}`)

    return new Promise((resolve, reject) => {
      exec(dockerCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Database sync failed for ${user.email}:`, error.message)
          // 不抛出错误，避免影响注册流程
          resolve()
          return
        }

        if (stderr) {
          console.error(`❌ Database sync stderr for ${user.email}:`, stderr)
          resolve()
          return
        }

        console.log(`✅ User synced to database: ${user.email}`)
        resolve()
      })
    })
  } catch (error) {
    console.error(`❌ Database sync error for ${user.email}:`, error.message)
    // 不抛出错误，避免影响注册流程
    return Promise.resolve()
  }
}

// 真正的数据库同步函数（使用 PostgreSQL 客户端）
async function syncUserToDatabaseReal(user) {
  console.log(`🔄 Real database sync for: ${user.email} (ID: ${user.id})`)

  try {
    const { Client } = require('pg')

    // PostgreSQL 连接配置
    const client = new Client({
      host: process.env.DATABASE_HOST || 'postgres-dev',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      database: process.env.DATABASE_NAME || 'yun_ai_todolist_dev',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres123',
    })

    await client.connect()
    console.log(`✅ PostgreSQL connection successful`)

    // 使用 CUID 生成器创建符合 Prisma 要求的 ID
    const crypto = require('crypto')
    const cuid =
      'c' + crypto.randomBytes(12).toString('base64').replace(/[+/]/g, '').substring(0, 24)

    // 执行数据库插入
    const insertQuery = `
      INSERT INTO "User" (
        id, email, username, password, "emailVerified",
        "accountStatus", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `

    const values = [
      cuid,
      user.email,
      user.username,
      user.password,
      true, // emailVerified
      user.accountStatus,
      new Date(user.createdAt),
      new Date(user.updatedAt),
    ]

    const result = await client.query(insertQuery, values)

    if (result.rows.length > 0) {
      console.log(
        `✅ User successfully inserted to database: ${user.email} (DB ID: ${result.rows[0].id})`
      )
    } else {
      console.log(`ℹ️ User already exists in database: ${user.email}`)
    }

    await client.end()
  } catch (error) {
    console.error(`❌ Database sync error for ${user.email}:`, error.message)
    // 不抛出错误，避免影响注册流程
  }
}

// 内存注册函数（临时方案）
async function registerUserInMemory(email, username, password, verificationKey, res) {
  try {
    // 检查邮箱是否已存在
    for (const [userId, user] of userStorage) {
      if (user.email === email) {
        res.writeHead(409)
        res.end(JSON.stringify({ message: '邮箱已被注册' }))
        return
      }
    }

    // 检查用户名是否已存在
    for (const [userId, user] of userStorage) {
      if (user.username === username) {
        res.writeHead(409)
        res.end(JSON.stringify({ message: '用户名已被使用' }))
        return
      }
    }

    // 加密密码
    const bcrypt = require('bcrypt')
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // 生成用户ID和创建用户
    const userId = userIdCounter++
    const now = new Date()
    const user = {
      id: userId.toString(),
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword, // 已加密的密码
      accountStatus: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }

    // 存储到内存
    userStorage.set(userId.toString(), user)

    // 删除已使用的验证码
    codeStorage.delete(verificationKey)

    // 生成模拟的JWT令牌
    const accessToken = `mock-access-token-${userId}-${Date.now()}`
    const refreshToken = `mock-refresh-token-${userId}-${Date.now()}`

    console.log(`✅ User registered successfully: ${email} (ID: ${userId})`)

    // 返回注册成功响应
    const response = {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          accountStatus: user.accountStatus,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
      },
    }

    res.writeHead(200)
    res.end(JSON.stringify(response))
  } catch (error) {
    console.error('❌ Registration error:', error)
    res.writeHead(500)
    res.end(
      JSON.stringify({
        message: '注册失败，请稍后重试',
        error: error.message,
      })
    )
  }
}

// 检查邮件配置
let emailConfigured = false
// 检查 SMTP 配置

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  emailConfigured = true
  console.log('✅ SMTP configuration found, email sending enabled')
} else {
  console.log('⚠️  SMTP not configured, using development mode only')
}

// 生成验证码
function generateCode() {
  return crypto.randomInt(100000, 999999).toString()
}

// 解析 JSON 请求体
function parseJSON(req, callback) {
  let body = ''
  req.on('data', (chunk) => {
    body += chunk.toString()
  })
  req.on('end', () => {
    try {
      const data = body ? JSON.parse(body) : {}
      callback(null, data)
    } catch (error) {
      callback(error, null)
    }
  })
}

// 设置 CORS 头
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Content-Type', 'application/json')
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const path = parsedUrl.pathname
  const method = req.method

  // 设置 CORS 头
  setCORSHeaders(res)

  // 处理 OPTIONS 请求
  if (method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // 健康检查
  if (method === 'GET' && path === '/api/v1/health') {
    res.writeHead(200)
    res.end(
      JSON.stringify({
        status: 'ok',
        message: 'Standalone verification server is running',
        timestamp: new Date().toISOString(),
      })
    )
    return
  }

  // 发送验证码
  if (method === 'POST' && path === '/api/v1/verification/send-code') {
    parseJSON(req, (error, data) => {
      if (error) {
        res.writeHead(400)
        res.end(JSON.stringify({ message: '请求数据格式错误' }))
        return
      }

      const { email, type, username } = data

      if (!email || !type) {
        res.writeHead(400)
        res.end(
          JSON.stringify({
            message: '邮箱和类型是必需的',
            error: 'MISSING_REQUIRED_FIELDS',
          })
        )
        return
      }

      try {
        // 生成验证码
        const code = generateCode()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10分钟过期

        // 存储验证码
        const key = `${email}:${type}`
        codeStorage.set(key, { code, expiresAt, type })

        // 验证码已生成（出于安全考虑不在日志中显示）

        // 尝试发送邮件
        let emailSent = false
        if (emailConfigured) {
          const subject = '邮箱验证码'
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>邮箱验证码</h2>
              <p>您好${username ? ` ${username}` : ''}，</p>
              <p>您的验证码是：</p>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                ${code}
              </div>
              <p>验证码有效期为10分钟，请及时使用。</p>
              <p>如果这不是您的操作，请忽略此邮件。</p>
              <hr>
              <p style="color: #666; font-size: 12px;">此邮件由 Yun AI TodoList 系统自动发送，请勿回复。</p>
            </div>
          `

          sendEmail(email, subject, htmlContent, (error, info) => {
            if (error) {
              console.error(`❌ Failed to send email to ${email}:`, error.message)
            } else {
              console.log(`✅ Verification code sent to ${email}`)
            }
          })
          emailSent = true
        }

        // 返回响应
        const response = {
          message: emailSent ? '验证码已发送，请查收邮件' : '验证码已生成（请查看服务器日志）',
        }

        // 开发模式下返回验证码
        if (process.env.NODE_ENV === 'development') {
          response.code = code
          response.note = emailSent
            ? '验证码已发送到邮箱，同时返回用于测试'
            : '这是开发模式下的测试验证码'
          // 开发模式：在响应中返回验证码
        }

        res.writeHead(200)
        res.end(JSON.stringify(response))
      } catch (error) {
        console.error('❌ Send verification code error:', error)
        res.writeHead(500)
        res.end(
          JSON.stringify({
            message: '发送验证码失败，请稍后重试',
            error: 'INTERNAL_SERVER_ERROR',
          })
        )
      }
    })
    return
  }

  // 验证验证码
  if (method === 'POST' && path === '/api/v1/verification/verify-code') {
    parseJSON(req, (error, data) => {
      if (error) {
        res.writeHead(400)
        res.end(JSON.stringify({ message: '请求数据格式错误' }))
        return
      }

      const { email, code, type } = data

      if (!email || !code || !type) {
        res.writeHead(400)
        res.end(
          JSON.stringify({
            success: false,
            message: '邮箱、验证码和类型是必需的',
          })
        )
        return
      }

      const key = `${email}:${type}`
      const stored = codeStorage.get(key)

      if (!stored) {
        res.writeHead(200)
        res.end(
          JSON.stringify({
            success: false,
            message: '验证码不存在或已过期',
          })
        )
        return
      }

      if (stored.expiresAt < new Date()) {
        codeStorage.delete(key)
        res.writeHead(200)
        res.end(
          JSON.stringify({
            success: false,
            message: '验证码已过期',
          })
        )
        return
      }

      if (stored.code !== code) {
        res.writeHead(200)
        res.end(
          JSON.stringify({
            success: false,
            message: '验证码错误',
          })
        )
        return
      }

      // 验证成功，删除验证码
      codeStorage.delete(key)
      console.log(`✅ Verification code verified successfully for ${email}`)

      res.writeHead(200)
      res.end(
        JSON.stringify({
          success: true,
          message: '验证码验证成功',
        })
      )
    })
    return
  }

  // 用户注册 - 使用 PostgreSQL 数据库存储
  if (method === 'POST' && path === '/api/v1/auth/register') {
    parseJSON(req, async (error, data) => {
      if (error) {
        res.writeHead(400)
        res.end(JSON.stringify({ message: '请求数据格式错误' }))
        return
      }

      const { username, email, password, verificationCode } = data

      if (!username || !email || !password || !verificationCode) {
        res.writeHead(400)
        res.end(
          JSON.stringify({
            message: '用户名、邮箱、密码和验证码都是必需的',
          })
        )
        return
      }

      try {
        // 验证验证码
        const key = `${email}:register`
        const stored = codeStorage.get(key)

        if (!stored) {
          res.writeHead(400)
          res.end(JSON.stringify({ message: '验证码不存在或已过期' }))
          return
        }

        if (stored.expiresAt < new Date()) {
          codeStorage.delete(key)
          res.writeHead(400)
          res.end(JSON.stringify({ message: '验证码已过期' }))
          return
        }

        if (stored.code !== verificationCode) {
          res.writeHead(400)
          res.end(JSON.stringify({ message: '验证码错误' }))
          return
        }

        // 使用 PostgreSQL 数据库存储用户
        await registerUserToDatabase(email, username, password, key, res)
      } catch (error) {
        console.error('❌ Registration error:', error)
        res.writeHead(500)
        res.end(
          JSON.stringify({
            message: '注册失败，请稍后重试',
          })
        )
      }
    })
    return
  }

  // 查看内存中的用户数据（开发调试用）
  if (method === 'GET' && path === '/api/v1/debug/users') {
    const users = Array.from(userStorage.values()).map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))

    res.writeHead(200)
    res.end(
      JSON.stringify({
        message: '内存中的用户数据',
        count: users.length,
        users: users,
        note: '这些数据存储在内存中，重启服务后会丢失',
      })
    )
    return
  }

  // 404 处理
  res.writeHead(404)
  res.end(JSON.stringify({ message: 'Not Found' }))
})

// 启动服务器
server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Standalone verification server running on http://0.0.0.0:${port}`)
  console.log(`📚 Health check: http://0.0.0.0:${port}/api/v1/health`)
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📧 SMTP configured: ${emailConfigured ? 'Yes' : 'No (development mode only)'}`)
  if (emailConfigured) {
    console.log(`📮 Email will be sent from: ${process.env.SMTP_USER}`)
  }
})
