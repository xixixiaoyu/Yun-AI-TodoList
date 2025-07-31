import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { ApiResponse } from '@shared/types'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let error = 'INTERNAL_SERVER_ERROR'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>
        message =
          (typeof responseObj.message === 'string' ? responseObj.message : undefined) ||
          (typeof responseObj.error === 'string' ? responseObj.error : undefined) ||
          message
        error = (typeof responseObj.error === 'string' ? responseObj.error : undefined) || error
      }
    } else if (exception instanceof Error) {
      message = exception.message
      this.logger.error(exception.stack)
    }

    const errorResponse: ApiResponse = {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
    }

    // 记录错误日志
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined
    )

    response.status(status).json(errorResponse)
  }
}
