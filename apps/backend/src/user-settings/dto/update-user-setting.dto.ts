import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class UpdateUserSettingDto {
  @ApiProperty({
    description: '设置值',
    example: 'light',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  value!: string
}
