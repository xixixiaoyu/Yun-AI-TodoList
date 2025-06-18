import request from 'supertest'
import { app } from './setup'

describe('AppController (e2e)', () => {
  describe('/api/v1 (GET)', () => {
    it('should return application info', () => {
      return request(app.getHttpServer())
        .get('/api/v1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name')
          expect(res.body).toHaveProperty('version')
          expect(res.body).toHaveProperty('description')
          expect(res.body).toHaveProperty('environment')
          expect(res.body).toHaveProperty('timestamp')
          expect(res.body.name).toBe('Yun AI TodoList API')
        })
    })
  })

  describe('/api/v1/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status')
          expect(res.body).toHaveProperty('timestamp')
          expect(res.body).toHaveProperty('uptime')
          expect(res.body).toHaveProperty('database')
          expect(res.body).toHaveProperty('memory')
          expect(res.body.status).toBe('ok')
          expect(res.body.database.status).toBe('connected')
        })
    })
  })
})
