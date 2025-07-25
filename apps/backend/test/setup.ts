import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as path from 'path'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/database/prisma.service'

// Load test environment variables
process.env.NODE_ENV = 'test'
require('dotenv').config({ path: path.join(__dirname, '../.env.test') })

// Export request for use in test files
export { request }

// Jest globals
declare global {
  const beforeAll: (fn: () => Promise<void>) => void
  const afterAll: (fn: () => Promise<void>) => void
  const beforeEach: (fn: () => Promise<void>) => void
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

  // 清理数据库，确保测试开始时数据库是干净的
  await cleanupDatabase()
})

afterAll(async () => {
  // 清理测试数据
  await cleanupDatabase()

  // 关闭应用
  await app.close()
})

// 移除 beforeEach 清理，让测试套件内的测试可以共享数据
// 只在测试套件开始前清理一次数据库

async function cleanupDatabase(): Promise<void> {
  // For SQLite, we need to delete from tables individually
  try {
    // Delete in order to respect foreign key constraints
    await prisma.userSetting.deleteMany()
    await prisma.todo.deleteMany()
    await prisma.user.deleteMany()
  } catch (error) {
    console.log({ error })
  }
}
