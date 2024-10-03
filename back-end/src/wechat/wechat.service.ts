import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class WechatService {
	constructor(
		private httpService: HttpService,
		private configService: ConfigService
	) {}

	async getQrCode() {
		const appId = this.configService.get<string>('WECHAT_APP_ID')
		const redirectUri = encodeURIComponent(
			this.configService.get<string>('WECHAT_REDIRECT_URI')
		)
		const responseType = 'code'
		const scope = 'snsapi_login'
		const state = 'STATE' // 可以是一个随机字符串

		const url = `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&state=${state}#wechat_redirect`

		return { url }
	}

	async getAccessToken(code: string) {
		const appId = this.configService.get<string>('WECHAT_APP_ID')
		const appSecret = this.configService.get<string>('WECHAT_APP_SECRET')
		const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`

		const response = await firstValueFrom(this.httpService.get(url))
		return response.data
	}

	async getUserInfo(accessToken: string, openId: string) {
		const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openId}`
		const response = await firstValueFrom(this.httpService.get(url))
		return response.data
	}
}
