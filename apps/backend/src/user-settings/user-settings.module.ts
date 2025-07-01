import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { UserSettingsController } from './user-settings.controller'
import { UserSettingsService } from './user-settings.service'

@Module({
  imports: [DatabaseModule],
  controllers: [UserSettingsController],
  providers: [UserSettingsService],
  exports: [UserSettingsService],
})
export class UserSettingsModule {}
