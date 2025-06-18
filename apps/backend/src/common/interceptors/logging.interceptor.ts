import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { Request } from 'express'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>()
    const { method, url, ip } = request
    const userAgent = request.get('User-Agent') || ''
    const now = Date.now()

    this.logger.log(`${method} ${url} - ${ip} - ${userAgent}`)

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now
        this.logger.log(`${method} ${url} - ${ip} - ${userAgent} - ${responseTime}ms`)
      })
    )
  }
}
