import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as winston from 'winston'

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger

  constructor(private readonly configService: ConfigService) {
    const logLevel = this.configService.get('LOG_LEVEL', 'info')
    const logFile = this.configService.get('LOG_FILE', './logs/app.log')
    const isProduction = this.configService.get('NODE_ENV') === 'production'

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'yun-ai-todolist-backend' },
      transports: [
        new winston.transports.File({
          filename: logFile.replace('.log', '-error.log'),
          level: 'error',
        }),
        new winston.transports.File({ filename: logFile }),
      ],
    })

    if (!isProduction) {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        })
      )
    }
  }

  log(message: string | object, context?: string): void {
    const msg = typeof message === 'string' ? message : JSON.stringify(message)
    this.logger.info(msg, { context })
  }

  error(message: string | object, trace?: string, context?: string): void {
    const msg = typeof message === 'string' ? message : JSON.stringify(message)
    this.logger.error(msg, { trace, context })
  }

  warn(message: string | object, context?: string): void {
    const msg = typeof message === 'string' ? message : JSON.stringify(message)
    this.logger.warn(msg, { context })
  }

  debug(message: string | object, context?: string): void {
    const msg = typeof message === 'string' ? message : JSON.stringify(message)
    this.logger.debug(msg, { context })
  }

  verbose(message: string | object, context?: string): void {
    const msg = typeof message === 'string' ? message : JSON.stringify(message)
    this.logger.verbose(msg, { context })
  }
}
