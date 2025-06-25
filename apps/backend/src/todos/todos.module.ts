import { Module } from '@nestjs/common'
import { AIAnalysisModule } from '../ai-analysis/ai-analysis.module'
import { TodosController } from './todos.controller'
import { TodosService } from './todos.service'

@Module({
  imports: [AIAnalysisModule],
  controllers: [TodosController],
  providers: [TodosService],
  exports: [TodosService],
})
export class TodosModule {}
