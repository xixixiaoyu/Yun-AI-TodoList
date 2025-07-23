// Prisma 软删除扩展
import { Prisma } from '@prisma/client'

// 软删除中间件
export const softDeleteMiddleware: Prisma.Middleware = async (params, next) => {
  // 需要软删除过滤的模型
  const softDeleteModels = ['user', 'todo', 'document', 'userSetting']

  if (softDeleteModels.includes(params.model?.toLowerCase() || '')) {
    if (params.action === 'delete') {
      // 将 delete 转换为 update，设置 deletedAt
      params.action = 'update'
      params.args.data = {
        deletedAt: new Date(),
      }
    }

    if (params.action === 'deleteMany') {
      // 将 deleteMany 转换为 updateMany
      params.action = 'updateMany'
      params.args.data = {
        deletedAt: new Date(),
      }
    }

    // 为查询操作自动添加软删除过滤（可选，因为我们已经在服务层处理）
    // if (['findFirst', 'findMany', 'count', 'findUnique'].includes(params.action)) {
    //   if (!params.args) {
    //     params.args = {};
    //   }
    //
    //   if (!params.args.where) {
    //     params.args.where = {};
    //   }
    //
    //   // 只有在没有明确指定 deletedAt 条件时才添加过滤
    //   if (params.args.where.deletedAt === undefined) {
    //     params.args.where.deletedAt = null;
    //   }
    // }
  }

  return next(params)
}

// 数据库视图创建脚本
export const createActiveViewsSQL = `
-- 创建活跃用户视图
CREATE OR REPLACE VIEW active_users AS
SELECT * FROM users WHERE deleted_at IS NULL;

-- 创建活跃待办事项视图
CREATE OR REPLACE VIEW active_todos AS
SELECT * FROM todos WHERE deleted_at IS NULL;

-- 创建活跃文档视图
CREATE OR REPLACE VIEW active_documents AS
SELECT * FROM documents WHERE deleted_at IS NULL;

-- 创建活跃用户设置视图
CREATE OR REPLACE VIEW active_user_settings AS
SELECT * FROM user_settings WHERE deleted_at IS NULL;

-- 为视图创建规则，使其可更新
CREATE OR REPLACE RULE active_users_insert AS
ON INSERT TO active_users DO INSTEAD
INSERT INTO users VALUES (NEW.*);

CREATE OR REPLACE RULE active_users_update AS
ON UPDATE TO active_users DO INSTEAD
UPDATE users SET
  email = NEW.email,
  username = NEW.username,
  password = NEW.password,
  avatar_url = NEW.avatar_url,
  email_verified = NEW.email_verified,
  updated_at = NEW.updated_at,
  account_status = NEW.account_status,
  last_active_at = NEW.last_active_at
WHERE id = OLD.id AND deleted_at IS NULL;

CREATE OR REPLACE RULE active_users_delete AS
ON DELETE TO active_users DO INSTEAD
UPDATE users SET deleted_at = NOW() WHERE id = OLD.id;
`

// 使用示例
export class SoftDeleteService {
  constructor(private prisma: any) {
    // 应用中间件
    this.prisma.$use(softDeleteMiddleware)
  }

  // 硬删除方法（管理员使用）
  async hardDelete(model: string, where: any) {
    return this.prisma[model].deleteMany({
      where: {
        ...where,
        deletedAt: { not: null }, // 只删除已软删除的记录
      },
    })
  }

  // 恢复软删除的记录
  async restore(model: string, where: any) {
    return this.prisma[model].updateMany({
      where: {
        ...where,
        deletedAt: { not: null },
      },
      data: {
        deletedAt: null,
      },
    })
  }

  // 清理过期的软删除记录
  async cleanupExpiredSoftDeletes(model: string, daysOld = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    return this.prisma[model].deleteMany({
      where: {
        deletedAt: {
          lt: cutoffDate,
        },
      },
    })
  }
}
