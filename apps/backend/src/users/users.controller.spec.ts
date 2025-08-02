import { Test, TestingModule } from '@nestjs/testing'
import { UtilsService } from '../common/services/utils.service'
import { ChangePasswordDto } from './dto/change-password.dto'
import { UpdateUserPreferencesDto } from './dto/user-preferences.dto'
import { UserPreferencesService } from './user-preferences.service'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

describe('UsersController', () => {
  let controller: UsersController
  let usersService: UsersService
  let userPreferencesService: UserPreferencesService
  let utilsService: UtilsService

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    avatarUrl: undefined,
    emailVerified: true,
    preferences: {
      theme: 'auto' as const,
      language: 'zh-CN',
      aiConfig: {
        enabled: true,
        autoAnalyze: true,
        priorityAnalysis: true,
        timeEstimation: true,
        subtaskSplitting: true,
        modelConfig: {
          model: 'deepseek-chat',
          temperature: 0.3,
          maxTokens: 1000,
        },
      },
      notifications: {
        desktop: true,
        email: false,
        dueReminder: true,
        reminderMinutes: 30,
      },
      storageConfig: {
        mode: 'hybrid' as const,
        autoSync: true,
        syncInterval: 5,
        offlineMode: true,
        conflictResolution: 'merge' as const,
        retryAttempts: 3,
        requestTimeout: 10000,
      },
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }

  const mockUsersService = {
    findById: jest.fn(),
    update: jest.fn(),
    changePassword: jest.fn(),
    delete: jest.fn(),
  }

  const mockUserPreferencesService = {
    updateBulkPreferences: jest.fn(),
  }

  const mockUtilsService = {
    sanitizeUser: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: UserPreferencesService,
          useValue: mockUserPreferencesService,
        },
        {
          provide: UtilsService,
          useValue: mockUtilsService,
        },
      ],
    }).compile()

    controller = module.get<UsersController>(UsersController)
    usersService = module.get<UsersService>(UsersService)
    userPreferencesService = module.get<UserPreferencesService>(UserPreferencesService)
    utilsService = module.get<UtilsService>(UtilsService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const sanitizedUser = { ...mockUser }
      delete (sanitizedUser as Record<string, unknown>).password

      mockUsersService.findById.mockResolvedValue(mockUser)
      mockUtilsService.sanitizeUser.mockReturnValue(sanitizedUser)

      const result = await controller.getProfile(mockUser)

      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id)
      expect(utilsService.sanitizeUser).toHaveBeenCalledWith(mockUser)
      expect(result).toEqual({
        user: sanitizedUser,
      })
    })

    it('should throw error if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null)

      await expect(controller.getProfile(mockUser)).rejects.toThrow('用户不存在')
    })
  })

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = { username: 'newusername' }
      const updatedUser = { ...mockUser, username: 'newusername' }
      const sanitizedUser = { ...updatedUser }
      delete (sanitizedUser as Record<string, unknown>).password

      mockUsersService.update.mockResolvedValue(updatedUser)
      mockUtilsService.sanitizeUser.mockReturnValue(sanitizedUser)

      const result = await controller.updateProfile(mockUser, updateDto)

      expect(usersService.update).toHaveBeenCalledWith(mockUser.id, updateDto)
      expect(utilsService.sanitizeUser).toHaveBeenCalledWith(updatedUser)
      expect(result).toEqual({
        user: sanitizedUser,
        message: '用户信息更新成功',
      })
    })
  })

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const updateDto: UpdateUserPreferencesDto = {
        theme: { theme: 'dark' },
      }
      const updatedPreferences = { ...mockUser.preferences, theme: 'dark' }

      mockUserPreferencesService.updateBulkPreferences.mockResolvedValue(updatedPreferences)

      const result = await controller.updatePreferences(mockUser, updateDto)

      expect(userPreferencesService.updateBulkPreferences).toHaveBeenCalledWith(
        mockUser.id,
        updateDto
      )
      expect(result).toEqual({
        preferences: updatedPreferences,
        message: '偏好设置更新成功',
      })
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      }

      mockUsersService.changePassword.mockResolvedValue(undefined)

      const result = await controller.changePassword(mockUser, changePasswordDto)

      expect(usersService.changePassword).toHaveBeenCalledWith(mockUser.id, changePasswordDto)
      expect(result).toEqual({
        message: '密码修改成功',
      })
    })
  })

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      mockUsersService.delete.mockResolvedValue(undefined)

      const result = await controller.deleteAccount(mockUser)

      expect(usersService.delete).toHaveBeenCalledWith(mockUser.id)
      expect(result).toEqual({
        message: '账户已成功删除',
      })
    })
  })

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const sanitizedUser = { ...mockUser }
      delete (sanitizedUser as Record<string, unknown>).password

      mockUsersService.findById.mockResolvedValue(mockUser)
      mockUtilsService.sanitizeUser.mockReturnValue(sanitizedUser)

      const result = await controller.getUserById('user-1')

      expect(usersService.findById).toHaveBeenCalledWith('user-1')
      expect(utilsService.sanitizeUser).toHaveBeenCalledWith(mockUser)
      expect(result).toEqual({
        user: sanitizedUser,
      })
    })

    it('should throw error if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null)

      await expect(controller.getUserById('nonexistent')).rejects.toThrow('用户不存在')
    })
  })
})
