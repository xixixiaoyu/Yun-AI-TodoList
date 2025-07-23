-- 重构 user_preferences 表的迁移脚本
-- 优先级：中等
-- 原因：单表包含22个字段，违反单一职责原则，难以维护和扩展

-- =============================================
-- 第一步：创建新的功能分离表
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
-- 第二步：创建索引
-- =============================================

CREATE INDEX IF NOT EXISTS idx_user_basic_preferences_user_id ON user_basic_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_config_user_id ON user_ai_config(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_config_user_id ON user_search_config(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_config_user_id ON user_notification_config(user_id);
CREATE INDEX IF NOT EXISTS idx_user_storage_config_user_id ON user_storage_config(user_id);

-- =============================================
-- 第三步：数据迁移
-- =============================================

-- 迁移现有数据到新表
INSERT INTO user_basic_preferences (user_id, theme, language, created_at, updated_at)
SELECT 
    user_id,
    theme,
    language,
    created_at,
    updated_at
FROM user_preferences
ON CONFLICT (user_id) DO UPDATE SET
    theme = EXCLUDED.theme,
    language = EXCLUDED.language,
    updated_at = EXCLUDED.updated_at;

INSERT INTO user_ai_config (
    user_id, enabled, auto_analyze, priority_analysis, time_estimation, 
    subtask_splitting, model, temperature, max_tokens, created_at, updated_at
)
SELECT 
    user_id,
    ai_enabled,
    ai_auto_analyze,
    ai_priority_analysis,
    ai_time_estimation,
    ai_subtask_splitting,
    ai_model,
    ai_temperature,
    ai_max_tokens,
    created_at,
    updated_at
FROM user_preferences
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

INSERT INTO user_search_config (
    user_id, default_language, safe_search, default_result_count, 
    engine, region, created_at, updated_at
)
SELECT 
    user_id,
    search_language,
    search_safe_search,
    search_default_result_count,
    search_engine,
    search_region,
    created_at,
    updated_at
FROM user_preferences
ON CONFLICT (user_id) DO UPDATE SET
    default_language = EXCLUDED.default_language,
    safe_search = EXCLUDED.safe_search,
    default_result_count = EXCLUDED.default_result_count,
    engine = EXCLUDED.engine,
    region = EXCLUDED.region,
    updated_at = EXCLUDED.updated_at;

INSERT INTO user_notification_config (
    user_id, desktop_notifications, email_notifications, 
    due_reminder, reminder_minutes, created_at, updated_at
)
SELECT 
    user_id,
    desktop_notifications,
    email_notifications,
    due_reminder,
    reminder_minutes,
    created_at,
    updated_at
FROM user_preferences
ON CONFLICT (user_id) DO UPDATE SET
    desktop_notifications = EXCLUDED.desktop_notifications,
    email_notifications = EXCLUDED.email_notifications,
    due_reminder = EXCLUDED.due_reminder,
    reminder_minutes = EXCLUDED.reminder_minutes,
    updated_at = EXCLUDED.updated_at;

INSERT INTO user_storage_config (
    user_id, mode, auto_sync, sync_interval, offline_mode, 
    conflict_resolution, retry_attempts, request_timeout, created_at, updated_at
)
SELECT 
    user_id,
    storage_mode,
    storage_auto_sync,
    storage_sync_interval,
    storage_offline_mode,
    storage_conflict_resolution,
    storage_retry_attempts,
    storage_request_timeout,
    created_at,
    updated_at
FROM user_preferences
ON CONFLICT (user_id) DO UPDATE SET
    mode = EXCLUDED.mode,
    auto_sync = EXCLUDED.auto_sync,
    sync_interval = EXCLUDED.sync_interval,
    offline_mode = EXCLUDED.offline_mode,
    conflict_resolution = EXCLUDED.conflict_resolution,
    retry_attempts = EXCLUDED.retry_attempts,
    request_timeout = EXCLUDED.request_timeout,
    updated_at = EXCLUDED.updated_at;

-- =============================================
-- 第四步：验证数据迁移
-- =============================================

-- 验证迁移结果
SELECT 
    'migration_verification' as check_type,
    (SELECT COUNT(*) FROM user_preferences) as original_count,
    (SELECT COUNT(*) FROM user_basic_preferences) as basic_count,
    (SELECT COUNT(*) FROM user_ai_config) as ai_count,
    (SELECT COUNT(*) FROM user_search_config) as search_count,
    (SELECT COUNT(*) FROM user_notification_config) as notification_count,
    (SELECT COUNT(*) FROM user_storage_config) as storage_count;

-- =============================================
-- 第五步：创建视图（向后兼容）
-- =============================================

-- 创建兼容性视图，保持原有 API 兼容
CREATE OR REPLACE VIEW user_preferences_view AS
SELECT 
    bp.user_id,
    bp.theme,
    bp.language,
    ac.enabled as ai_enabled,
    ac.auto_analyze as ai_auto_analyze,
    ac.priority_analysis as ai_priority_analysis,
    ac.time_estimation as ai_time_estimation,
    ac.subtask_splitting as ai_subtask_splitting,
    ac.model as ai_model,
    ac.temperature as ai_temperature,
    ac.max_tokens as ai_max_tokens,
    sc.default_language as search_language,
    sc.safe_search as search_safe_search,
    sc.default_result_count as search_default_result_count,
    sc.engine as search_engine,
    sc.region as search_region,
    nc.desktop_notifications,
    nc.email_notifications,
    nc.due_reminder,
    nc.reminder_minutes,
    stc.mode as storage_mode,
    stc.auto_sync as storage_auto_sync,
    stc.sync_interval as storage_sync_interval,
    stc.offline_mode as storage_offline_mode,
    stc.conflict_resolution as storage_conflict_resolution,
    stc.retry_attempts as storage_retry_attempts,
    stc.request_timeout as storage_request_timeout,
    bp.created_at,
    GREATEST(bp.updated_at, ac.updated_at, sc.updated_at, nc.updated_at, stc.updated_at) as updated_at
FROM user_basic_preferences bp
LEFT JOIN user_ai_config ac ON bp.user_id = ac.user_id
LEFT JOIN user_search_config sc ON bp.user_id = sc.user_id
LEFT JOIN user_notification_config nc ON bp.user_id = nc.user_id
LEFT JOIN user_storage_config stc ON bp.user_id = stc.user_id;

RAISE NOTICE 'user_preferences table refactoring completed successfully';
RAISE NOTICE 'Benefits: Improved maintainability, better separation of concerns, easier to extend';
RAISE NOTICE 'Next step: Update application code to use new table structure or compatibility view';
