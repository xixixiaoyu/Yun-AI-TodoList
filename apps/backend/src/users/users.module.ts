import { Module } from '@nestjs/common'
import { UserPreferencesController } from './user-preferences.controller'
import { UserPreferencesService } from './user-preferences.service'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  controllers: [UsersController, UserPreferencesController],
  providers: [UsersService, UserPreferencesService],
  exports: [UsersService, UserPreferencesService],
})
export class UsersModule {}
