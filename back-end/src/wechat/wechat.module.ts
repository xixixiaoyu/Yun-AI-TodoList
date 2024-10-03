import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { WechatService } from './wechat.service'
import { WechatController } from './wechat.controller'

@Module({
	imports: [HttpModule],
	providers: [WechatService],
	controllers: [WechatController],
})
export class WechatModule {}
