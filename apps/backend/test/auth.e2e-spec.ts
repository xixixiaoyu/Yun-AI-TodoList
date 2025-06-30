import request from 'supertest'
import { app, prisma } from './setup'

describe('Authentication (e2e)', () => {
  // 在认证测试套件开始前清理数据库
  beforeAll(async () => {
    await prisma.userSetting.deleteMany()
    await prisma.todo.deleteMany()
    await prisma.user.deleteMany()
  })
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123',
  }

  let accessToken: string
  let refreshToken: string

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)

      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
      expect(response.body.user.email).toBe(testUser.email)
      expect(response.body.user.username).toBe(testUser.username)
      expect(response.body.user).not.toHaveProperty('password')

      accessToken = response.body.accessToken
      refreshToken = response.body.refreshToken
    })

    it('should not register user with existing email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('邮箱已被注册')
        })
    })

    it('should not register user with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400)
    })

    it('should not register user with weak password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'another@example.com',
          password: '123',
        })
        .expect(400)
    })
  })

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
      expect(response.body.user.email).toBe(testUser.email)

      // 更新 token 用于后续测试
      accessToken = response.body.accessToken
      refreshToken = response.body.refreshToken
    })

    it('should not login with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401)
    })

    it('should not login with invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401)
    })
  })

  describe('/auth/profile (GET)', () => {
    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user')
          expect(res.body.user.email).toBe(testUser.email)
        })
    })

    it('should not get profile without token', () => {
      return request(app.getHttpServer()).get('/api/v1/auth/profile').expect(401)
    })

    it('should not get profile with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
    })
  })

  describe('/auth/refresh (POST)', () => {
    it('should refresh token with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken')
          expect(res.body).toHaveProperty('refreshToken')
          expect(res.body).toHaveProperty('user')
        })
    })

    it('should not refresh with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401)
    })
  })

  describe('/auth/logout (POST)', () => {
    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message')
        })
    })

    it('should not logout without token', () => {
      return request(app.getHttpServer()).post('/api/v1/auth/logout').expect(401)
    })
  })
})
