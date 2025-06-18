import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsString, IsInt, ValidateNested, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class TodoReorderItem {
  @ApiProperty({
    description: 'Todo ID',
    example: 'clx1234567890',
  })
  @IsString({ message: 'Todo ID 必须是字符串' })
  todoId!: string

  @ApiProperty({
    description: '新的排序位置',
    example: 1,
    minimum: 0,
  })
  @IsInt({ message: '排序位置必须是整数' })
  @Min(0, { message: '排序位置不能小于0' })
  newOrder!: number
}

export class ReorderTodosDto {
  @ApiProperty({
    description: 'Todo 重排序列表',
    type: [TodoReorderItem],
    example: [
      { todoId: 'clx1234567890', newOrder: 0 },
      { todoId: 'clx0987654321', newOrder: 1 },
    ],
  })
  @IsArray({ message: '重排序列表必须是数组' })
  @ValidateNested({ each: true })
  @Type(() => TodoReorderItem)
  items!: TodoReorderItem[]
}
