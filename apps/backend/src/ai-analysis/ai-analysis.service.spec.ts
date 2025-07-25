import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../database/prisma.service'
import { AIAnalysisService } from './ai-analysis.service'

describe('AIAnalysisService', () => {
  let service: AIAnalysisService

  const mockPrismaService = {
    todo: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIAnalysisService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<AIAnalysisService>(AIAnalysisService)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
