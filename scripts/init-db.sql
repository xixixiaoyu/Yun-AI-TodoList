-- Yun Todo 数据库初始化脚本
-- 创建时间: 2025-01-24

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 设置默认权限
GRANT ALL PRIVILEGES ON DATABASE yun_todo_db TO yun_todo_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO yun_todo_user;

-- 创建索引优化查询性能
-- 这些索引将在 Prisma 迁移后创建，这里只是预留

-- 用户表索引
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Todo 表索引
-- CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
-- CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
-- CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
-- CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
-- CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);

-- 搜索历史表索引
-- CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
-- CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);

-- 全文搜索索引
-- CREATE INDEX IF NOT EXISTS idx_todos_title_search ON todos USING gin(to_tsvector('english', title));
-- CREATE INDEX IF NOT EXISTS idx_todos_description_search ON todos USING gin(to_tsvector('english', description));

-- 创建数据库函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 输出初始化完成信息
DO $$
BEGIN
    RAISE NOTICE 'Yun Todo 数据库初始化完成!';
    RAISE NOTICE '数据库名: yun_todo_db';
    RAISE NOTICE '用户名: yun_todo_user';
    RAISE NOTICE '时区: %', current_setting('timezone');
END $$;

-- 输出初始化完成信息
DO $$
BEGIN
    RAISE NOTICE '数据库初始化完成！';
    RAISE NOTICE '时区设置为 UTC';
    RAISE NOTICE '已创建必要的扩展和函数';
END $$;
