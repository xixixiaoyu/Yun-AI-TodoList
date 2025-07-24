-- Yun Todo 数据库初始化脚本
-- 创建时间: 2025-01-24

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建数据库（如果不存在）
-- 注意：在 Docker 初始化脚本中，数据库已经通过环境变量创建

-- 设置默认权限
GRANT ALL PRIVILEGES ON DATABASE yun_todo_db TO yun_todo_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO yun_todo_user;

-- 创建一些有用的函数
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
