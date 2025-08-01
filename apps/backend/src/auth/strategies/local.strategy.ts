import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { AuthService } from '../auth.service'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // 使用邮箱作为用户名
    })
  }

  async validate(email: string, password: string): Promise<unknown> {
    const user = await this.authService.validateUser(email, password)
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误')
    }
    return user
  }
}
