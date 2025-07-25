import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { UtilsService } from '../common/services/utils.service'
import { MailService } from '../mail/mail.service'
import { UsersService } from '../users/users.service'
import { VerificationService } from '../verification/verification.service'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

describe('AuthService', () => {
  let service: AuthService
  let usersService: UsersService
  let utilsService: UtilsService
  let verificationService: VerificationService

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn(),
    mapPrismaUserToInternalUser: jest.fn(),
    prisma: {
      user: {
        findUnique: jest.fn(),
      },
    },
  }

  const mockJwtService = {
    sign: jest.fn(),
    signAsync: jest.fn().mockResolvedValue('mock-token'),
    verify: jest.fn(),
  }

  const mockUtilsService = {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
    sanitizeUser: jest.fn(),
  }

  const mockVerificationService = {
    verifyCodeWithoutDelete: jest.fn(),
    deleteCode: jest.fn(),
  }

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '1h',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      }
      return config[key]
    }),
  }

  const mockMailService = {
    sendEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  }

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockSanitizedUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UtilsService,
          useValue: mockUtilsService,
        },
        {
          provide: VerificationService,
          useValue: mockVerificationService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    usersService = module.get<UsersService>(UsersService)
    utilsService = module.get<UtilsService>(UtilsService)
    verificationService = module.get<VerificationService>(VerificationService)

    // 重置所有 mock
    jest.clearAllMocks()
  })

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
      verificationCode: '123456',
    }

    it('应该成功注册新用户', async () => {
      // Arrange
      mockVerificationService.verifyCodeWithoutDelete.mockResolvedValue({
        success: true,
        message: '验证成功',
      })
      mockUsersService.findByEmail.mockResolvedValue(null)
      mockUsersService.findByUsername.mockResolvedValue(null)
      mockUtilsService.hashPassword.mockResolvedValue('hashedpassword')
      mockUsersService.create.mockResolvedValue(mockUser)
      mockUtilsService.sanitizeUser.mockReturnValue(mockSanitizedUser)
      mockJwtService.signAsync.mockResolvedValue('access-token')

      // Act
      const result = await service.register(registerDto)

      // Assert
      expect(verificationService.verifyCodeWithoutDelete).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.verificationCode,
        'register'
      )
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email)
      expect(usersService.findByUsername).toHaveBeenCalledWith(registerDto.username)
      expect(utilsService.hashPassword).toHaveBeenCalledWith(registerDto.password)
      expect(usersService.create).toHaveBeenCalled()
      expect(verificationService.deleteCode).toHaveBeenCalledWith(registerDto.email, 'register')
      expect(result.user).toEqual(mockSanitizedUser)
      expect(result.accessToken).toBe('access-token')
    })

    it('应该在验证码无效时抛出异常', async () => {
      // Arrange
      mockVerificationService.verifyCodeWithoutDelete.mockResolvedValue({
        success: false,
        message: '验证码无效',
      })

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException)
      expect(usersService.create).not.toHaveBeenCalled()
    })

    it('应该在邮箱已存在时抛出异常', async () => {
      // Arrange
      mockVerificationService.verifyCodeWithoutDelete.mockResolvedValue({
        success: true,
        message: '验证成功',
      })
      mockUsersService.findByEmail.mockResolvedValue(mockUser)

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException)
      expect(usersService.create).not.toHaveBeenCalled()
    })

    it('应该在用户名已存在时抛出异常', async () => {
      // Arrange
      mockVerificationService.verifyCodeWithoutDelete.mockResolvedValue({
        success: true,
        message: '验证成功',
      })
      mockUsersService.findByEmail.mockResolvedValue(null)
      mockUsersService.findByUsername.mockResolvedValue(mockUser)

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException)
      expect(usersService.create).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    }

    it('应该成功登录', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(mockUser)
      mockUsersService.mapPrismaUserToInternalUser.mockResolvedValue(mockUser)
      mockUsersService.prisma.user.findUnique.mockResolvedValue(mockUser)
      mockUtilsService.comparePassword.mockResolvedValue(true)
      mockUtilsService.sanitizeUser.mockReturnValue(mockSanitizedUser)
      mockJwtService.signAsync.mockResolvedValue('access-token')

      // Act
      const result = await service.login(loginDto)

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email)
      expect(utilsService.comparePassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password
      )
      expect(result.user).toEqual(mockSanitizedUser)
      expect(result.accessToken).toBe('access-token')
    })

    it('应该在邮箱不存在时抛出异常', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(null)

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })

    it('应该在密码错误时抛出异常', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(mockUser)
      mockUsersService.mapPrismaUserToInternalUser.mockResolvedValue(mockUser)
      mockUsersService.prisma.user.findUnique.mockResolvedValue(mockUser)
      mockUtilsService.comparePassword.mockResolvedValue(false)

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('validateUser', () => {
    it('应该验证有效用户', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(mockUser)
      mockUsersService.mapPrismaUserToInternalUser.mockResolvedValue(mockUser)
      mockUsersService.prisma.user.findUnique.mockResolvedValue(mockUser)
      mockUtilsService.comparePassword.mockResolvedValue(true)

      // Act
      const result = await service.validateUser('test@example.com', 'password123')

      // Assert
      expect(result).toEqual(mockUser)
    })

    it('应该在用户不存在时返回 null', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(null)

      // Act
      const result = await service.validateUser('nonexistent@example.com', 'password123')

      // Assert
      expect(result).toBeNull()
    })

    it('应该在密码错误时返回 null', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(mockUser)
      mockUsersService.mapPrismaUserToInternalUser.mockResolvedValue(mockUser)
      mockUsersService.prisma.user.findUnique.mockResolvedValue(mockUser)
      mockUtilsService.comparePassword.mockResolvedValue(false)

      // Act
      const result = await service.validateUser('test@example.com', 'wrongpassword')

      // Assert
      expect(result).toBeNull()
    })

    it('应该在用户没有密码时返回 null（Google 登录用户）', async () => {
      // Arrange
      const userWithoutPassword = { ...mockUser, password: null }
      mockUsersService.findByEmail.mockResolvedValue(mockUser)
      mockUsersService.mapPrismaUserToInternalUser.mockResolvedValue(userWithoutPassword)
      mockUsersService.prisma.user.findUnique.mockResolvedValue(userWithoutPassword)

      // Act
      const result = await service.validateUser('test@example.com', 'password123')

      // Assert
      expect(result).toBeNull()
    })
  })
})
