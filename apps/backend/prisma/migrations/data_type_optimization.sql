-- 数据类型和约束优化迁移脚本
-- 优先级：高
-- 影响范围：中等
-- 实施难度：中等

-- =============================================
-- 1. 添加枚举类型约束
-- =============================================

-- 创建账户状态枚举
DO $$ BEGIN
    CREATE TYPE account_status_enum AS ENUM ('active', 'inactive', 'suspended', 'deleted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建邮箱验证类型枚举
DO $$ BEGIN
    CREATE TYPE verification_type_enum AS ENUM ('register', 'login', 'reset_password', 'change_email');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- 2. 添加约束条件
-- =============================================

-- User 表约束
ALTER TABLE users ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users ADD CONSTRAINT check_account_status 
CHECK (account_status IN ('active', 'inactive', 'suspended', 'deleted'));

-- Todo 表约束
ALTER TABLE todos ADD CONSTRAINT check_priority_range 
CHECK (priority IS NULL OR (priority >= 1 AND priority <= 5));

-- 转换 estimatedTime 从 String 到 Integer（分钟）
-- 注意：这需要数据迁移逻辑
ALTER TABLE todos ADD COLUMN estimated_minutes INTEGER;

-- 数据迁移逻辑（示例）
UPDATE todos SET estimated_minutes = 
CASE 
    WHEN "estimatedTime" ~ '^\d+$' THEN "estimatedTime"::INTEGER
    WHEN "estimatedTime" LIKE '%小时%' THEN 
        (regexp_replace("estimatedTime", '[^0-9]', '', 'g'))::INTEGER * 60
    WHEN "estimatedTime" LIKE '%分钟%' THEN 
        (regexp_replace("estimatedTime", '[^0-9]', '', 'g'))::INTEGER
    ELSE NULL
END
WHERE "estimatedTime" IS NOT NULL;

-- UserPreferences 表约束
ALTER TABLE user_preferences ADD CONSTRAINT check_ai_temperature_range 
CHECK (ai_temperature >= 0.0 AND ai_temperature <= 2.0);

ALTER TABLE user_preferences ADD CONSTRAINT check_reminder_minutes_positive 
CHECK (reminder_minutes > 0);

ALTER TABLE user_preferences ADD CONSTRAINT check_ai_max_tokens_range 
CHECK (ai_max_tokens >= 100 AND ai_max_tokens <= 4000);

-- Document 表约束
ALTER TABLE documents ADD CONSTRAINT check_file_size_limit 
CHECK (file_size <= 50 * 1024 * 1024); -- 50MB 限制

-- EmailVerificationCode 表约束
ALTER TABLE email_verification_codes ADD CONSTRAINT check_verification_type 
CHECK (type IN ('register', 'login', 'reset_password', 'change_email'));

ALTER TABLE email_verification_codes ADD CONSTRAINT check_attempts_limit 
CHECK (attempts >= 0 AND attempts <= 10);

-- =============================================
-- 3. 添加有用的字段
-- =============================================

-- 为 Document 表添加文件哈希字段（用于去重）
ALTER TABLE documents ADD COLUMN file_hash VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash);

-- 为 User 表添加最后登录 IP
ALTER TABLE users ADD COLUMN last_login_ip INET;

-- =============================================
-- 4. 性能优化
-- =============================================

-- 为软删除查询添加部分索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active 
ON users(id) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_todos_active 
ON todos(user_id, created_at) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_active 
ON documents(user_id, created_at) WHERE deleted_at IS NULL;
