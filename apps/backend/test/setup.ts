import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/database/prisma.service'

// Jest globals
declare global {
  var beforeAll: (fn: () => Promise<void>) => void
  var afterAll: (fn: () => Promise<void>) => void
  var beforeEach: (fn: () => Promise<void>) => void
}

export let app: INestApplication
export let prisma: PrismaService

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  app = moduleFixture.createNestApplication()

  // 配置全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // 设置全局前缀
  app.setGlobalPrefix('api/v1')

  await app.init()

  // 获取 Prisma 服务
  prisma = app.get<PrismaService>(PrismaService)
})

afterAll(async () => {
  // 清理测试数据
  await cleanupDatabase()

  // 关闭应用
  await app.close()
})

beforeEach(async () => {
  // 每个测试前清理数据库
  await cleanupDatabase()
})

async function cleanupDatabase() {
  // For SQLite, we need to delete from tables individually
  try {
    // Delete in order to respect foreign key constraints
    await prisma.todoHistory.deleteMany()
    await prisma.searchHistory.deleteMany()
    await prisma.userSetting.deleteMany()
    await prisma.todo.deleteMany()
    await prisma.user.deleteMany()
  } catch (error) {
    console.log({ error })
  }
}
