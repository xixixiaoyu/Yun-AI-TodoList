-- 初始化 PostgreSQL 数据库
-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 创建索引优化查询性能
-- 这些索引将在 Prisma 迁移后创建
