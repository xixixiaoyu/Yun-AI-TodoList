import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UsersService } from './users.service'

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly _usersService: UsersService) {}

  // TODO: Implement user management endpoints
}
