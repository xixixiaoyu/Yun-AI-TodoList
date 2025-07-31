import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-github2'
import { AuthService } from '../auth.service'

export interface GitHubProfile {
  id: string
  username: string
  displayName: string
  emails: Array<{ value: string; verified?: boolean }>
  photos: Array<{ value: string }>
  provider: string
}
// import { User } from '@prisma/client'

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy-client-secret',
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback',
      scope: ['user:email'],
    })

    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      console.warn('GitHub OAuth credentials not configured. GitHub login will not work.')
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GitHubProfile,
    done: (error: Error | null, user?: unknown) => void
  ): Promise<unknown> {
    try {
      const { id, username, displayName, emails, photos } = profile
      const email = emails?.[0]?.value

      if (!email) {
        done(new Error('No email found in GitHub profile'), undefined)
        return
      }

      const user = await this.authService.validateGitHubUser({
        githubId: id,
        email,
        username: displayName || username,
        avatarUrl: photos?.[0]?.value,
      })

      done(null, user)
    } catch (error) {
      done(error instanceof Error ? error : new Error(String(error)), undefined)
    }
  }
}
