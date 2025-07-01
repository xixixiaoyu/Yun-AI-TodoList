import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreateUserSettingDto {
  @ApiProperty({
    description: '设置键名',
    example: 'theme',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key!: string

  @ApiProperty({
    description: '设置值',
    example: 'dark',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  value!: string
}
