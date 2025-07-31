import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'
import { AuthService } from '../auth.service'

export interface GoogleProfile {
  id: string
  emails: Array<{ value: string; verified: boolean }>
  name: {
    familyName: string
    givenName: string
  }
  photos: Array<{ value: string }>
  provider: string
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID')
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET')
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL')

    if (!clientID || !clientSecret) {
      console.warn('Google OAuth credentials not configured. Google login will not work.')
      // 提供默认值以避免策略初始化失败
      super({
        clientID: 'dummy',
        clientSecret: 'dummy',
        callbackURL: callbackURL || 'http://localhost:3000/auth/google/callback',
        scope: ['email', 'profile'],
      })
      return
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    })
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback
  ): Promise<unknown> {
    try {
      const { id, emails, name, photos } = profile

      if (!emails || emails.length === 0) {
        return done(new Error('No email found in Google profile'), false)
      }

      const email = emails[0].value
      const user = await this.authService.validateGoogleUser({
        googleId: id,
        email,
        username: `${name.givenName}${name.familyName}`.toLowerCase(),
        avatarUrl: photos?.[0]?.value,
        emailVerified: emails[0].verified,
      })

      return done(null, user)
    } catch (error) {
      return done(error, false)
    }
  }
}
