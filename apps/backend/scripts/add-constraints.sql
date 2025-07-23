-- 数据类型和约束优化脚本
-- 添加业务规则约束和数据完整性检查

-- =============================================
-- 1. 添加约束条件
-- =============================================

-- User 表约束
DO $$ 
BEGIN
    -- 邮箱格式验证
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_email_format') THEN
        ALTER TABLE users ADD CONSTRAINT check_email_format 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
    END IF;

    -- 账户状态约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_account_status') THEN
        ALTER TABLE users ADD CONSTRAINT check_account_status 
        CHECK (account_status IN ('active', 'inactive', 'suspended', 'deleted'));
    END IF;
END $$;

-- Todo 表约束
DO $$ 
BEGIN
    -- 优先级范围约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_priority_range') THEN
        ALTER TABLE todos ADD CONSTRAINT check_priority_range 
        CHECK (priority IS NULL OR (priority >= 1 AND priority <= 5));
    END IF;

    -- 标题长度约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_title_length') THEN
        ALTER TABLE todos ADD CONSTRAINT check_title_length 
        CHECK (length(title) >= 1 AND length(title) <= 200);
    END IF;
END $$;

-- UserPreferences 表约束
DO $$ 
BEGIN
    -- AI 温度范围约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_ai_temperature_range') THEN
        ALTER TABLE user_preferences ADD CONSTRAINT check_ai_temperature_range 
        CHECK (ai_temperature >= 0.0 AND ai_temperature <= 2.0);
    END IF;

    -- 提醒时间正数约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_reminder_minutes_positive') THEN
        ALTER TABLE user_preferences ADD CONSTRAINT check_reminder_minutes_positive 
        CHECK (reminder_minutes > 0);
    END IF;

    -- AI 最大令牌数范围约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_ai_max_tokens_range') THEN
        ALTER TABLE user_preferences ADD CONSTRAINT check_ai_max_tokens_range 
        CHECK (ai_max_tokens >= 100 AND ai_max_tokens <= 8000);
    END IF;
END $$;

-- Document 表约束
DO $$ 
BEGIN
    -- 文件大小限制 (50MB)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_file_size_limit') THEN
        ALTER TABLE documents ADD CONSTRAINT check_file_size_limit 
        CHECK (file_size <= 52428800);
    END IF;

    -- 文件名长度约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_filename_length') THEN
        ALTER TABLE documents ADD CONSTRAINT check_filename_length 
        CHECK (length(filename) >= 1 AND length(filename) <= 255);
    END IF;
END $$;

-- EmailVerificationCode 表约束
DO $$ 
BEGIN
    -- 验证类型约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_verification_type') THEN
        ALTER TABLE email_verification_codes ADD CONSTRAINT check_verification_type 
        CHECK (type IN ('register', 'login', 'reset_password', 'change_email'));
    END IF;

    -- 尝试次数限制
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_attempts_limit') THEN
        ALTER TABLE email_verification_codes ADD CONSTRAINT check_attempts_limit 
        CHECK (attempts >= 0 AND attempts <= 10);
    END IF;

    -- 验证码长度约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_code_length') THEN
        ALTER TABLE email_verification_codes ADD CONSTRAINT check_code_length 
        CHECK (length(code) = 6);
    END IF;
END $$;

-- =============================================
-- 2. 添加有用的字段
-- =============================================

-- 为 Document 表添加文件哈希字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'file_hash') THEN
        ALTER TABLE documents ADD COLUMN file_hash VARCHAR(64);
        CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash);
    END IF;
END $$;

-- 为 User 表添加最后登录 IP（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_login_ip') THEN
        ALTER TABLE users ADD COLUMN last_login_ip INET;
    END IF;
END $$;

-- =============================================
-- 3. 验证约束是否生效
-- =============================================

-- 查看所有约束
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('CHECK', 'FOREIGN KEY', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type;
