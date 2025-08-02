import Joi from 'joi'

export const configValidationSchema = Joi.object({
  // 应用配置
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  FRONTEND_URL: Joi.string().default('http://localhost:3001'),

  // 数据库配置
  DATABASE_URL: Joi.string().required(),

  // Redis 配置
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().default(0),

  // JWT 配置
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // AI 服务配置
  DEEPSEEK_API_KEY: Joi.string().optional(),
  OPENAI_API_KEY: Joi.string().optional(),
  CLAUDE_API_KEY: Joi.string().optional(),

  // 文件上传配置
  UPLOAD_MAX_SIZE: Joi.number().default(10 * 1024 * 1024), // 10MB
  UPLOAD_DEST: Joi.string().default('./uploads'),

  // 邮件配置
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  SMTP_FROM: Joi.string().optional(),

  // 日志配置
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE: Joi.string().default('./logs/app.log'),

  // 安全配置
  BCRYPT_ROUNDS: Joi.number().default(12),

  // Docker 环境配置
  DOCKER_ENV: Joi.boolean().default(false),
  DATABASE_HOST: Joi.string().default('localhost'),
})
