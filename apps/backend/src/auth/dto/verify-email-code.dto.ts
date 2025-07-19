import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class VerifyEmailCodeDto {
  @ApiProperty({
    description: '邮箱地址',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email!: string

  @ApiProperty({
    description: '6位数字验证码',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @MinLength(6, { message: '验证码必须是6位数字' })
  @MaxLength(6, { message: '验证码必须是6位数字' })
  code!: string
}
