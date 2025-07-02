import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty } from 'class-validator'

export class ForgotPasswordDto {
  @ApiProperty({
    description: '用户邮箱',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email!: string
}
