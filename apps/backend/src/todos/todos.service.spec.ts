import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { CacheService } from '../common/cache.service'
import { UtilsService } from '../common/services/utils.service'
import { ValidationService } from '../common/validation.service'
import { PrismaService } from '../database/prisma.service'
import { CreateTodoDto } from './dto/create-todo.dto'
import { QueryTodosDto } from './dto/query-todos.dto'
import { UpdateTodoDto } from './dto/update-todo.dto'
import { TodosService } from './todos.service'

describe('TodosService', () => {
  let service: TodosService
  let prismaService: PrismaService
  let cacheService: CacheService
  let validationService: ValidationService

  const mockPrismaService = {
    todo: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $queryRaw: jest.fn(),
  }

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
  }

  const mockValidationService = {
    validateTodoData: jest.fn(),
  }

  const mockUtilsService = {
    generateId: jest.fn(),
  }

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
  }

  const mockTodo = {
    id: 'todo-1',
    userId: 'user-1',
    title: '测试待办事项',
    description: '这是一个测试待办事项',
    completed: false,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: 1,
    priority: 3,
    estimatedTime: 60,
    aiAnalyzed: false,
    dueDate: null,
    deletedAt: null,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: ValidationService,
          useValue: mockValidationService,
        },
        {
          provide: UtilsService,
          useValue: mockUtilsService,
        },
      ],
    }).compile()

    service = module.get<TodosService>(TodosService)
    prismaService = module.get<PrismaService>(PrismaService)
    cacheService = module.get<CacheService>(CacheService)
    validationService = module.get<ValidationService>(ValidationService)

    // 重置所有 mock
    jest.clearAllMocks()
  })

  describe('create', () => {
    const createTodoDto: CreateTodoDto = {
      title: '新待办事项',
      description: '描述',
      priority: 3,
      estimatedTime: '1小时',
    }

    it('应该成功创建待办事项', async () => {
      // Arrange
      mockValidationService.validateTodoData.mockReturnValue(undefined)
      mockPrismaService.todo.findFirst.mockResolvedValue(null) // 不存在重复
      mockPrismaService.todo.aggregate.mockResolvedValue({ _max: { order: 5 } })
      mockUtilsService.generateId.mockReturnValue('new-todo-id')
      mockPrismaService.todo.create.mockResolvedValue({
        ...mockTodo,
        id: 'new-todo-id',
        title: createTodoDto.title,
        description: createTodoDto.description,
      })

      // Act
      const result = await service.create(mockUser.id, createTodoDto)

      // Assert
      expect(validationService.validateTodoData).toHaveBeenCalledWith(createTodoDto)
      expect(prismaService.todo.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          title: {
            equals: createTodoDto.title.trim(),
            mode: 'insensitive',
          },
          completed: false,
        },
      })
      expect(prismaService.todo.create).toHaveBeenCalled()
      expect(cacheService.deletePattern).toHaveBeenCalled()
      expect(result.title).toBe(createTodoDto.title)
    })

    it('应该在标题重复时抛出异常', async () => {
      // Arrange
      mockValidationService.validateTodoData.mockReturnValue(undefined)
      mockPrismaService.todo.findFirst.mockResolvedValue(mockTodo) // 存在重复

      // Act & Assert
      await expect(service.create(mockUser.id, createTodoDto)).rejects.toThrow(ForbiddenException)
      expect(prismaService.todo.create).not.toHaveBeenCalled()
    })
  })

  describe('findAll', () => {
    const queryDto: QueryTodosDto = {
      page: 1,
      limit: 20,
    }

    it('应该返回待办事项列表', async () => {
      // Arrange
      const mockTodos = [mockTodo]
      mockPrismaService.todo.findMany.mockResolvedValue(mockTodos)
      mockPrismaService.todo.count.mockResolvedValue(1)

      // Act
      const result = await service.findAll(mockUser.id, queryDto)

      // Assert
      expect(result.todos).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('应该支持搜索功能', async () => {
      // Arrange
      const searchQuery = { ...queryDto, search: '测试' }
      mockPrismaService.$queryRaw.mockResolvedValue([{ id: 'todo-1' }])
      mockPrismaService.todo.findMany.mockResolvedValue([])
      mockPrismaService.todo.count.mockResolvedValue(0)

      // Act
      await service.findAll(mockUser.id, searchQuery)

      // Assert
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled()
      expect(prismaService.todo.findMany).toHaveBeenCalled()
    })
  })

  describe('findOne', () => {
    it('应该返回指定的待办事项', async () => {
      // Arrange
      mockPrismaService.todo.findFirst.mockResolvedValue(mockTodo)

      // Act
      const result = await service.findOne(mockUser.id, mockTodo.id)

      // Assert
      expect(result.id).toBe(mockTodo.id)
      expect(prismaService.todo.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockTodo.id,
          userId: mockUser.id,
          deletedAt: null,
        },
      })
    })

    it('应该在待办事项不存在时抛出异常', async () => {
      // Arrange
      mockPrismaService.todo.findFirst.mockResolvedValue(null)

      // Act & Assert
      await expect(service.findOne(mockUser.id, 'nonexistent-id')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('update', () => {
    const updateDto: UpdateTodoDto = {
      title: '更新的标题',
      completed: true,
    }

    it('应该成功更新待办事项', async () => {
      // Arrange
      mockPrismaService.todo.findFirst.mockResolvedValue(mockTodo)
      mockPrismaService.todo.update.mockResolvedValue({
        ...mockTodo,
        ...updateDto,
        completedAt: new Date(),
      })

      // Act
      const result = await service.update(mockUser.id, mockTodo.id, updateDto)

      // Assert
      expect(result.title).toBe(updateDto.title)
      expect(result.completed).toBe(true)
      expect(prismaService.todo.update).toHaveBeenCalled()
    })

    it('应该在待办事项不存在时抛出异常', async () => {
      // Arrange
      mockPrismaService.todo.findFirst.mockResolvedValue(null)

      // Act & Assert
      await expect(service.update(mockUser.id, 'nonexistent-id', updateDto)).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('remove', () => {
    it('应该成功删除待办事项', async () => {
      // Arrange
      mockPrismaService.todo.findFirst.mockResolvedValue(mockTodo)
      mockPrismaService.todo.update.mockResolvedValue({
        ...mockTodo,
        deletedAt: new Date(),
      })

      // Act
      await service.remove(mockUser.id, mockTodo.id)

      // Assert
      expect(prismaService.todo.update).toHaveBeenCalledWith({
        where: { id: mockTodo.id },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      })
    })

    it('应该在待办事项不存在时抛出异常', async () => {
      // Arrange
      mockPrismaService.todo.findFirst.mockResolvedValue(null)

      // Act & Assert
      await expect(service.remove(mockUser.id, 'nonexistent-id')).rejects.toThrow(NotFoundException)
    })
  })
})
