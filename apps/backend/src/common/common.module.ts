import { Module, Global } from '@nestjs/common'
import { LoggerService } from './services/logger.service'
import { UtilsService } from './services/utils.service'

@Global()
@Module({
  providers: [LoggerService, UtilsService],
  exports: [LoggerService, UtilsService],
})
export class CommonModule {}
