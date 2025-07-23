-- 数据库优化一键执行脚本
-- 将所有优化合并为一个脚本，便于在 Supabase SQL Editor 中执行

-- =============================================
-- 开始事务
-- =============================================
BEGIN;

-- =============================================
-- 第一步：删除 user_settings 表
-- =============================================

-- 检查 user_settings 表中的数据
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        RAISE NOTICE 'Found user_settings table, proceeding with removal...';
        
        -- 删除外键约束
        ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_userId_fkey;
        
        -- 删除索引
        DROP INDEX IF EXISTS idx_user_settings_soft_delete;
        
        -- 删除表
        DROP TABLE user_settings CASCADE;
        
        RAISE NOTICE 'user_settings table removed successfully';
    ELSE
        RAISE NOTICE 'user_settings table not found, skipping...';
    END IF;
END $$;

-- =============================================
-- 第二步：删除 document_chunks 表
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_chunks') THEN
        RAISE NOTICE 'Found document_chunks table, proceeding with removal...';
        
        -- 删除外键约束
        ALTER TABLE document_chunks DROP CONSTRAINT IF EXISTS document_chunks_documentId_fkey;
        
        -- 删除索引
        DROP INDEX IF EXISTS idx_document_chunks_document;
        
        -- 删除表
        DROP TABLE document_chunks CASCADE;
        
        RAISE NOTICE 'document_chunks table removed successfully';
    ELSE
        RAISE NOTICE 'document_chunks table not found, skipping...';
    END IF;
END $$;

-- =============================================
-- 第三步：创建新的用户配置表
-- =============================================

-- 1. 用户基本偏好表
CREATE TABLE IF NOT EXISTS user_basic_preferences (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language TEXT DEFAULT 'zh-CN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. AI 配置表
CREATE TABLE IF NOT EXISTS user_ai_config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT true,
    auto_analyze BOOLEAN DEFAULT true,
    priority_analysis BOOLEAN DEFAULT true,
    time_estimation BOOLEAN DEFAULT true,
    subtask_splitting BOOLEAN DEFAULT true,
    model TEXT DEFAULT 'deepseek-chat',
    temperature FLOAT DEFAULT 0.3 CHECK (temperature >= 0.0 AND temperature <= 2.0),
    max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens >= 100 AND max_tokens <= 8000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. 搜索配置表
CREATE TABLE IF NOT EXISTS user_search_config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    default_language TEXT DEFAULT 'zh-CN',
    safe_search BOOLEAN DEFAULT true,
    default_result_count INTEGER DEFAULT 10 CHECK (default_result_count > 0 AND default_result_count <= 100),
    engine TEXT DEFAULT 'google',
    region TEXT DEFAULT 'CN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. 通知配置表
CREATE TABLE IF NOT EXISTS user_notification_config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    desktop_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    due_reminder BOOLEAN DEFAULT true,
    reminder_minutes INTEGER DEFAULT 30 CHECK (reminder_minutes > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. 存储配置表
CREATE TABLE IF NOT EXISTS user_storage_config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    mode TEXT DEFAULT 'hybrid' CHECK (mode IN ('local', 'cloud', 'hybrid')),
    auto_sync BOOLEAN DEFAULT true,
    sync_interval INTEGER DEFAULT 5 CHECK (sync_interval > 0),
    offline_mode BOOLEAN DEFAULT true,
    conflict_resolution TEXT DEFAULT 'merge' CHECK (conflict_resolution IN ('merge', 'local', 'remote')),
    retry_attempts INTEGER DEFAULT 3 CHECK (retry_attempts >= 0 AND retry_attempts <= 10),
    request_timeout INTEGER DEFAULT 10000 CHECK (request_timeout > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- 第四步：创建索引
-- =============================================

-- 基本配置表索引
CREATE INDEX IF NOT EXISTS idx_user_basic_preferences_user_id ON user_basic_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_config_user_id ON user_ai_config(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_config_user_id ON user_search_config(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_config_user_id ON user_notification_config(user_id);
CREATE INDEX IF NOT EXISTS idx_user_storage_config_user_id ON user_storage_config(user_id);

-- Todo 表性能索引
CREATE INDEX IF NOT EXISTS idx_todos_user_status_priority ON todos(user_id, completed, priority);
CREATE INDEX IF NOT EXISTS idx_todos_user_title_status ON todos(user_id, title, completed);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_todos_title_fulltext ON todos USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_todos_description_fulltext ON todos USING gin(to_tsvector('english', coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_documents_filename_fulltext ON documents USING gin(to_tsvector('english', filename));
CREATE INDEX IF NOT EXISTS idx_documents_content_fulltext ON documents USING gin(to_tsvector('english', content));

-- =============================================
-- 第五步：数据迁移
-- =============================================

-- 从现有 user_preferences 迁移数据到新表
DO $$
DECLARE
    pref_record RECORD;
BEGIN
    FOR pref_record IN SELECT * FROM user_preferences LOOP
        -- 迁移基本偏好
        INSERT INTO user_basic_preferences (user_id, theme, language, created_at, updated_at)
        VALUES (pref_record.user_id, pref_record.theme, pref_record.language, pref_record.created_at, pref_record.updated_at)
        ON CONFLICT (user_id) DO UPDATE SET
            theme = EXCLUDED.theme,
            language = EXCLUDED.language,
            updated_at = EXCLUDED.updated_at;
        
        -- 迁移 AI 配置
        INSERT INTO user_ai_config (
            user_id, enabled, auto_analyze, priority_analysis, time_estimation,
            subtask_splitting, model, temperature, max_tokens, created_at, updated_at
        )
        VALUES (
            pref_record.user_id, pref_record.ai_enabled, pref_record.ai_auto_analyze,
            pref_record.ai_priority_analysis, pref_record.ai_time_estimation,
            pref_record.ai_subtask_splitting, pref_record.ai_model,
            pref_record.ai_temperature, pref_record.ai_max_tokens,
            pref_record.created_at, pref_record.updated_at
        )
        ON CONFLICT (user_id) DO UPDATE SET
            enabled = EXCLUDED.enabled,
            auto_analyze = EXCLUDED.auto_analyze,
            priority_analysis = EXCLUDED.priority_analysis,
            time_estimation = EXCLUDED.time_estimation,
            subtask_splitting = EXCLUDED.subtask_splitting,
            model = EXCLUDED.model,
            temperature = EXCLUDED.temperature,
            max_tokens = EXCLUDED.max_tokens,
            updated_at = EXCLUDED.updated_at;
        
        -- 迁移搜索配置
        INSERT INTO user_search_config (
            user_id, default_language, safe_search, default_result_count,
            engine, region, created_at, updated_at
        )
        VALUES (
            pref_record.user_id, pref_record.search_language, pref_record.search_safe_search,
            pref_record.search_default_result_count, pref_record.search_engine,
            pref_record.search_region, pref_record.created_at, pref_record.updated_at
        )
        ON CONFLICT (user_id) DO UPDATE SET
            default_language = EXCLUDED.default_language,
            safe_search = EXCLUDED.safe_search,
            default_result_count = EXCLUDED.default_result_count,
            engine = EXCLUDED.engine,
            region = EXCLUDED.region,
            updated_at = EXCLUDED.updated_at;
        
        -- 迁移通知配置
        INSERT INTO user_notification_config (
            user_id, desktop_notifications, email_notifications,
            due_reminder, reminder_minutes, created_at, updated_at
        )
        VALUES (
            pref_record.user_id, pref_record.desktop_notifications, pref_record.email_notifications,
            pref_record.due_reminder, pref_record.reminder_minutes,
            pref_record.created_at, pref_record.updated_at
        )
        ON CONFLICT (user_id) DO UPDATE SET
            desktop_notifications = EXCLUDED.desktop_notifications,
            email_notifications = EXCLUDED.email_notifications,
            due_reminder = EXCLUDED.due_reminder,
            reminder_minutes = EXCLUDED.reminder_minutes,
            updated_at = EXCLUDED.updated_at;
        
        -- 迁移存储配置
        INSERT INTO user_storage_config (
            user_id, mode, auto_sync, sync_interval, offline_mode,
            conflict_resolution, retry_attempts, request_timeout, created_at, updated_at
        )
        VALUES (
            pref_record.user_id, pref_record.storage_mode, pref_record.storage_auto_sync,
            pref_record.storage_sync_interval, pref_record.storage_offline_mode,
            pref_record.storage_conflict_resolution, pref_record.storage_retry_attempts,
            pref_record.storage_request_timeout, pref_record.created_at, pref_record.updated_at
        )
        ON CONFLICT (user_id) DO UPDATE SET
            mode = EXCLUDED.mode,
            auto_sync = EXCLUDED.auto_sync,
            sync_interval = EXCLUDED.sync_interval,
            offline_mode = EXCLUDED.offline_mode,
            conflict_resolution = EXCLUDED.conflict_resolution,
            retry_attempts = EXCLUDED.retry_attempts,
            request_timeout = EXCLUDED.request_timeout,
            updated_at = EXCLUDED.updated_at;
    END LOOP;
    
    RAISE NOTICE 'Data migration completed successfully';
END $$;

-- =============================================
-- 第六步：验证结果
-- =============================================

-- 显示优化结果
SELECT 'Optimization completed successfully!' as status;

-- 显示剩余的表
SELECT 
    'Tables after optimization:' as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 显示新创建的索引
SELECT 
    'New indexes created:' as info,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- 提交事务
COMMIT;

RAISE NOTICE '🎉 Database optimization completed successfully!';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Run: pnpm prisma generate';
RAISE NOTICE '2. Test application functionality';
RAISE NOTICE '3. Monitor performance improvements';
