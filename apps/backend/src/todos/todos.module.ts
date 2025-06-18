import { Module } from '@nestjs/common'
import { TodosService } from './todos.service'
import { TodosController } from './todos.controller'

@Module({
  controllers: [TodosController],
  providers: [TodosService],
  exports: [TodosService],
})
export class TodosModule {}
