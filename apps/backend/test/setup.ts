import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/database/prisma.service'

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
  // 按照外键依赖顺序删除数据
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables.join(', ')} CASCADE;`)
  } catch (error) {
    console.log({ error })
  }
}
