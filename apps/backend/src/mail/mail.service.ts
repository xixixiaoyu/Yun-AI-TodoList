import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Transporter } from 'nodemailer'
import * as nodemailer from 'nodemailer'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter: Transporter | null = null

  constructor(private readonly configService: ConfigService) {
    this.createTransporter()
  }

  private createTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST')
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587)
    const smtpUser = this.configService.get<string>('SMTP_USER')
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD')

    if (!smtpHost || !smtpUser || !smtpPassword) {
      this.logger.warn('SMTP configuration is incomplete. Email functionality will be disabled.')
      return
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false, // 允许自签名证书
      },
      connectionTimeout: 10000, // 10秒连接超时
      greetingTimeout: 5000, // 5秒问候超时
      socketTimeout: 15000, // 15秒套接字超时
    })

    this.logger.log('Mail transporter created successfully')
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173')
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`

    // 开发模式：如果没有配置 SMTP，则只记录日志
    const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development'

    if (!this.transporter) {
      if (isDevelopment) {
        this.logger.warn('SMTP not configured in development mode. Email content logged below:')
        this.logger.log(`=== PASSWORD RESET EMAIL ===`)
        this.logger.log(`To: ${email}`)
        this.logger.log(`Subject: 重置您的密码 - Yun AI TodoList`)
        this.logger.log(`Reset URL: ${resetUrl}`)
        this.logger.log(`Token: ${resetToken}`)
        this.logger.log(`=== END EMAIL ===`)
        return
      } else {
        this.logger.error('Mail transporter not configured')
        throw new Error('邮件服务未配置')
      }
    }

    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@example.com'

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: '重置您的密码 - Yun AI TodoList',
      html: this.getPasswordResetEmailTemplate(resetUrl),
    } as any

    try {
      await this.transporter.sendMail(mailOptions)
      this.logger.log(`Password reset email sent to ${email}`)
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error)

      // 在开发模式下，如果邮件发送失败，记录详细信息但不抛出错误
      if (isDevelopment) {
        this.logger.warn('Email sending failed in development mode, but continuing...')
        this.logger.log(`Reset URL for manual testing: ${resetUrl}`)
        return
      }

      throw new Error('发送重置邮件失败')
    }
  }

  private getPasswordResetEmailTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>重置密码</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .title {
            font-size: 20px;
            margin-bottom: 20px;
            color: #1f2937;
          }
          .content {
            margin-bottom: 30px;
            color: #4b5563;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #2563eb;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 4px;
            padding: 12px;
            margin: 20px 0;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🚀 Yun AI TodoList</div>
            <h1 class="title">重置您的密码</h1>
          </div>

          <div class="content">
            <p>您好！</p>
            <p>我们收到了重置您账户密码的请求。如果这是您本人的操作，请点击下面的按钮来重置密码：</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">重置密码</a>
            </div>

            <p>或者复制以下链接到浏览器中打开：</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetUrl}
            </p>

            <div class="warning">
              <strong>⚠️ 安全提醒：</strong>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>此链接将在 1 小时后过期</li>
                <li>如果您没有请求重置密码，请忽略此邮件</li>
                <li>请勿将此链接分享给他人</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>如有疑问，请联系我们的客服团队。</p>
            <p>&copy; 2025 Yun AI TodoList. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false
    }

    try {
      await this.transporter.verify()
      this.logger.log('Mail service connection test successful')
      return true
    } catch (error) {
      this.logger.error('Mail service connection test failed:', error)
      return false
    }
  }
}
