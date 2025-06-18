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

  log(message: any, context?: string): void {
    this.logger.info(message, { context })
  }

  error(message: any, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context })
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, { context })
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, { context })
  }

  verbose(message: any, context?: string): void {
    this.logger.verbose(message, { context })
  }
}
