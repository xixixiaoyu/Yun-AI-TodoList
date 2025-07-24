import { Global, Module } from '@nestjs/common'
import { DatabaseHealthController } from './database-health.controller'
import { DatabaseHealthService } from './database-health.service'
import { PrismaService } from './prisma.service'

@Global()
@Module({
  controllers: [DatabaseHealthController],
  providers: [PrismaService, DatabaseHealthService],
  exports: [PrismaService, DatabaseHealthService],
})
export class DatabaseModule {}
