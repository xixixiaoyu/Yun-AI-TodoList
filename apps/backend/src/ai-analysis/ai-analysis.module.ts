/**
 * AI 分析模块
 */

import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { DocumentsModule } from '../documents/documents.module'
import { AIAnalysisController } from './ai-analysis.controller'
import { AIAnalysisService } from './ai-analysis.service'

@Module({
  imports: [DatabaseModule, DocumentsModule],
  controllers: [AIAnalysisController],
  providers: [AIAnalysisService],
  exports: [AIAnalysisService],
})
export class AIAnalysisModule {}
