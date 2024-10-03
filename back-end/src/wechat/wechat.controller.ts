import { Controller, Get, Query, Res } from '@nestjs/common'
import { WechatService } from './wechat.service'
import { Response } from 'express'

@Controller('wechat')
export class WechatController {
	constructor(private wechatService: WechatService) {}

	@Get('login')
	async login(@Res() res: Response) {
		const { url } = await this.wechatService.getQrCode()
		res.redirect(url)
	}

	@Get('callback')
	async callback(@Query('code') code: string, @Res() res: Response) {
		const tokenInfo = await this.wechatService.getAccessToken(code)
		const userInfo = await this.wechatService.getUserInfo(
			tokenInfo.access_token,
			tokenInfo.openid
		)

		// 这里应该处理用户登录逻辑，例如创建或更新用户，生成 JWT 令牌等
		// 为了简单起见，我们只返回用户信息
		res.json(userInfo)
	}
}
