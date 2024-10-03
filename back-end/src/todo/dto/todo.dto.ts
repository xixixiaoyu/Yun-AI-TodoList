import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator'

export class CreateTodoDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	text: string

	@ApiProperty()
	@IsNotEmpty()
	@IsNumber()
	userId: number

	@ApiProperty({ required: false, default: false })
	@IsOptional()
	@IsBoolean()
	completed?: boolean
}

export class UpdateTodoDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	text?: string

	@ApiProperty({ required: false })
	@IsOptional()
	@IsBoolean()
	completed?: boolean
}
