import request from 'supertest'
import { app, prisma } from './setup'

describe('Todos (e2e)', () => {
  const testUser = {
    email: 'todo-test@example.com',
    username: 'todouser',
    password: 'password123',
  }

  let accessToken: string
  let todoId: string

  // 辅助函数：获取有效的认证 token
  const getValidAccessToken = async (): Promise<string> => {
    try {
      // 尝试登录
      const loginResponse = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      })

      if (loginResponse.status === 200) {
        return loginResponse.body.accessToken
      }
    } catch {
      // 登录失败，可能用户不存在
    }

    // 如果登录失败，重新注册用户
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201)

    return registerResponse.body.accessToken
  }

  // 辅助函数：确保 Todo 存在，并返回有效的 token 和 todoId
  const ensureTodoExists = async (
    accessToken: string
  ): Promise<{ todoId: string; accessToken: string }> => {
    let validToken = accessToken

    // 尝试获取现有的 Todo
    if (todoId) {
      try {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/todos/${todoId}`)
          .set('Authorization', `Bearer ${validToken}`)

        if (response.status === 200) {
          return { todoId, accessToken: validToken }
        }
      } catch {
        // Todo 不存在，需要创建新的
      }
    }

    // 创建新的 Todo
    const todoData = {
      title: '测试 Todo',
      description: '这是一个测试 Todo',
      priority: 3,
      estimatedTime: '1小时',
    }

    try {
      const response = await request(app.getHttpServer())
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${validToken}`)
        .send(todoData)
        .expect(201)

      todoId = response.body.id
      return { todoId, accessToken: validToken }
    } catch {
      // 如果创建失败（可能是 token 无效），重新获取 token 并重试
      validToken = await getValidAccessToken()
      const response = await request(app.getHttpServer())
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${validToken}`)
        .send(todoData)
        .expect(201)

      todoId = response.body.id
      return { todoId, accessToken: validToken }
    }
  }

  beforeAll(async () => {
    // 在 Todo 测试套件开始前清理数据库
    await prisma.userSetting.deleteMany()
    await prisma.todo.deleteMany()
    await prisma.user.deleteMany()

    // 获取有效的认证 token
    accessToken = await getValidAccessToken()
  })

  describe('/todos (POST)', () => {
    it('should create a new todo', () => {
      const todoData = {
        title: '测试 Todo',
        description: '这是一个测试 Todo',
        priority: 3,
        estimatedTime: '1小时',
      }

      return request(app.getHttpServer())
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(todoData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id')
          expect(res.body.title).toBe(todoData.title)
          expect(res.body.description).toBe(todoData.description)
          expect(res.body.priority).toBe(todoData.priority)
          expect(res.body.estimatedTime).toBe(todoData.estimatedTime)
          expect(res.body.completed).toBe(false)

          todoId = res.body.id
        })
    })

    it('should not create todo without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/todos')
        .send({ title: '未授权 Todo' })
        .expect(401)
    })

    it('should not create todo with empty title', () => {
      return request(app.getHttpServer())
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '' })
        .expect(400)
    })
  })

  describe('/todos (GET)', () => {
    it('should get todos list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/todos')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('todos')
          expect(res.body).toHaveProperty('total')
          expect(res.body).toHaveProperty('page')
          expect(res.body).toHaveProperty('limit')
          expect(res.body).toHaveProperty('stats')
          expect(Array.isArray(res.body.todos)).toBe(true)
          expect(res.body.todos.length).toBeGreaterThan(0)
        })
    })

    it('should get todos with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/todos?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1)
          expect(res.body.limit).toBe(5)
        })
    })

    it('should search todos', () => {
      return request(app.getHttpServer())
        .get('/api/v1/todos?search=测试')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.todos.length).toBeGreaterThan(0)
          expect(res.body.todos[0].title).toContain('测试')
        })
    })

    it('should filter todos by type', () => {
      return request(app.getHttpServer())
        .get('/api/v1/todos?type=active')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.todos.every((todo: { completed: boolean }) => !todo.completed)).toBe(true)
        })
    })
  })

  describe('/todos/:id (GET)', () => {
    it('should get a specific todo', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/todos/${todoId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(todoId)
          expect(res.body.title).toBe('测试 Todo')
        })
    })

    it('should return 404 for non-existent todo', () => {
      return request(app.getHttpServer())
        .get('/api/v1/todos/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
    })
  })

  describe('/todos/:id (PATCH)', () => {
    it('should update a todo', async () => {
      const initialAccessToken = await getValidAccessToken()
      const { todoId: validTodoId, accessToken: validAccessToken } =
        await ensureTodoExists(initialAccessToken)

      const updateData = {
        title: '更新的 Todo',
        completed: true,
        priority: 5,
      }

      return request(app.getHttpServer())
        .patch(`/api/v1/todos/${validTodoId}`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe(updateData.title)
          expect(res.body.completed).toBe(updateData.completed)
          expect(res.body.priority).toBe(updateData.priority)
          expect(res.body).toHaveProperty('completedAt')
        })
    })

    it('should not update non-existent todo', async () => {
      const validAccessToken = await getValidAccessToken()

      return request(app.getHttpServer())
        .patch('/api/v1/todos/non-existent-id')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send({ title: '更新' })
        .expect(404)
    })
  })

  describe('/todos/stats (GET)', () => {
    it('should get todo statistics', async () => {
      const validAccessToken = await getValidAccessToken()

      return request(app.getHttpServer())
        .get('/api/v1/todos/stats')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total')
          expect(res.body).toHaveProperty('completed')
          expect(res.body).toHaveProperty('active')
          expect(res.body).toHaveProperty('completionRate')
          expect(res.body).toHaveProperty('overdue')
          expect(res.body).toHaveProperty('dueToday')
          expect(res.body).toHaveProperty('dueThisWeek')
        })
    })
  })

  describe('/todos/reorder (POST)', () => {
    it('should reorder todos', async () => {
      const initialAccessToken = await getValidAccessToken()
      const { todoId: validTodoId, accessToken: validAccessToken } =
        await ensureTodoExists(initialAccessToken)

      const reorderData = {
        items: [{ todoId: validTodoId, newOrder: 0 }],
      }

      return request(app.getHttpServer())
        .post('/api/v1/todos/reorder')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .send(reorderData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message')
        })
    })
  })

  describe('/todos/:id (DELETE)', () => {
    it('should delete a todo', async () => {
      const initialAccessToken = await getValidAccessToken()
      const { todoId: validTodoId, accessToken: validAccessToken } =
        await ensureTodoExists(initialAccessToken)

      return request(app.getHttpServer())
        .delete(`/api/v1/todos/${validTodoId}`)
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(204)
    })

    it('should not delete non-existent todo', async () => {
      const validAccessToken = await getValidAccessToken()

      return request(app.getHttpServer())
        .delete('/api/v1/todos/non-existent-id')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(404)
    })
  })
})
