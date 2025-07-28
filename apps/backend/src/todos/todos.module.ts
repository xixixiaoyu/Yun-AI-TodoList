import { Module } from '@nestjs/common'
import { CacheService } from '../common/cache.service'
import { ValidationService } from '../common/validation.service'
import { TodosController } from './todos.controller'
import { TodosService } from './todos.service'

@Module({
  imports: [
    /* AIAnalysisModule */
  ],
  controllers: [TodosController],
  providers: [TodosService, ValidationService, CacheService],
  exports: [TodosService],
})
export class TodosModule {}
