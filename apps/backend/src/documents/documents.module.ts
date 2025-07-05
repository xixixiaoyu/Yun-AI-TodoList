import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '../database/database.module'
import { DocumentsController } from './documents.controller'
import { DocumentsService } from './documents.service'
import { LlamaIndexService } from './llamaindex.service'

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, LlamaIndexService],
  exports: [DocumentsService, LlamaIndexService],
})
export class DocumentsModule {}
