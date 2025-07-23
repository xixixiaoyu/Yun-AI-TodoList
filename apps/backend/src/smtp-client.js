const net = require('net')
const tls = require('tls')

class SMTPClient {
  constructor(options) {
    this.host = options.host
    this.port = options.port || 587
    this.user = options.user
    this.pass = options.pass
    this.secure = options.secure || false
    this.socket = null
    this.step = 0
    this.buffer = ''
  }

  async sendMail(mailOptions) {
    return new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
      this.mailOptions = mailOptions

      // 创建连接
      this.socket = net.createConnection(this.port, this.host)
      this.socket.setTimeout(30000) // 30秒超时

      this.socket.on('connect', () => {
        this.step = 1 // 等待服务器欢迎消息
      })

      this.socket.on('data', (data) => {
        this.handleResponse(data)
      })

      this.socket.on('error', (error) => {
        this.reject(error)
      })

      this.socket.on('timeout', () => {
        this.socket.destroy()
        this.reject(new Error('SMTP connection timeout'))
      })

      this.socket.on('close', () => {
        // Connection closed
      })
    })
  }

  handleResponse(data) {
    this.buffer += data.toString()
    const lines = this.buffer.split('\r\n')

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i]

      if (line.match(/^[0-9]{3}[ -]/)) {
        const code = parseInt(line.substring(0, 3))

        if (code >= 400) {
          this.reject(new Error(`SMTP Error: ${line}`))
          return
        }

        this.processStep(code)
      }
    }

    this.buffer = lines[lines.length - 1]
  }

  processStep(code) {
    switch (this.step) {
      case 1: // 服务器欢迎消息
        if (code === 220) {
          this.sendCommand(`EHLO ${this.host}`)
          this.step = 2
        }
        break

      case 2: // EHLO 响应
        if (code === 250) {
          this.sendCommand('STARTTLS')
          this.step = 3
        }
        break

      case 3: // STARTTLS 响应
        if (code === 220) {
          this.upgradeToTLS()
        }
        break

      case 4: // TLS 后的 EHLO
        if (code === 250) {
          this.sendCommand('AUTH LOGIN')
          this.step = 5
        }
        break

      case 5: // AUTH LOGIN 响应
        if (code === 334) {
          this.sendCommand(Buffer.from(this.user).toString('base64'))
          this.step = 6
        }
        break

      case 6: // 用户名响应
        if (code === 334) {
          this.sendCommand(Buffer.from(this.pass).toString('base64'))
          this.step = 7
        }
        break

      case 7: // 密码响应
        if (code === 235) {
          // 从 "Name <email@domain.com>" 格式中提取纯邮箱地址
          const emailMatch = this.mailOptions.from.match(/<(.+)>/)
          const fromEmail = emailMatch ? emailMatch[1] : this.mailOptions.from
          this.sendCommand(`MAIL FROM:<${fromEmail}>`)
          this.step = 8
        }
        break

      case 8: // MAIL FROM 响应
        if (code === 250) {
          this.sendCommand(`RCPT TO:<${this.mailOptions.to}>`)
          this.step = 9
        }
        break

      case 9: // RCPT TO 响应
        if (code === 250) {
          this.sendCommand('DATA')
          this.step = 10
        }
        break

      case 10: // DATA 响应
        if (code === 354) {
          this.sendEmailData()
          this.step = 11
        }
        break

      case 11: // 邮件数据响应
        if (code === 250) {
          this.sendCommand('QUIT')
          this.step = 12
          this.resolve({ messageId: 'smtp-' + Date.now(), status: 'sent' })
        }
        break

      case 12: // QUIT 响应
        this.socket.end()
        break
    }
  }

  upgradeToTLS() {
    const tlsSocket = tls.connect({
      socket: this.socket,
      servername: this.host,
      rejectUnauthorized: false, // 对于开发环境
    })

    tlsSocket.on('secureConnect', () => {
      this.socket = tlsSocket
      this.sendCommand(`EHLO ${this.host}`)
      this.step = 4
    })

    tlsSocket.on('data', (data) => {
      this.handleResponse(data)
    })

    tlsSocket.on('error', (error) => {
      this.reject(error)
    })
  }

  sendCommand(command) {
    this.socket.write(command + '\r\n')
  }

  sendEmailData() {
    const emailData = [
      `From: ${this.mailOptions.from}`,
      `To: ${this.mailOptions.to}`,
      `Subject: =?UTF-8?B?${Buffer.from(this.mailOptions.subject).toString('base64')}?=`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      this.mailOptions.html,
      '.',
    ].join('\r\n')

    this.socket.write(emailData + '\r\n')
  }
}

module.exports = SMTPClient
