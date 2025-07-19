import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SendVerificationCodeDto {
  @ApiProperty({
    description: '邮箱地址',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email!: string

  @ApiProperty({
    description: '验证码类型',
    enum: ['register', 'login', 'reset_password'],
    example: 'register',
  })
  @IsString()
  @IsIn(['register', 'login', 'reset_password'], {
    message: '验证码类型必须是 register、login 或 reset_password',
  })
  type!: 'register' | 'login' | 'reset_password'

  @ApiProperty({
    description: '用户名（注册时可选）',
    example: 'username',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string
}
