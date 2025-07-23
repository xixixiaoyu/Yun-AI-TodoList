-- 简化版数据库优化脚本（兼容 Prisma db execute）

-- 删除 user_settings 表（如果存在）
DROP TABLE IF EXISTS user_settings CASCADE;

-- 删除 document_chunks 表（如果存在）
DROP TABLE IF EXISTS document_chunks CASCADE;

-- 创建用户基本偏好表
CREATE TABLE IF NOT EXISTS user_basic_preferences (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT UNIQUE NOT NULL,
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'zh-CN',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- 创建 AI 配置表
CREATE TABLE IF NOT EXISTS user_ai_config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT true,
    "autoAnalyze" BOOLEAN DEFAULT true,
    "priorityAnalysis" BOOLEAN DEFAULT true,
    "timeEstimation" BOOLEAN DEFAULT true,
    "subtaskSplitting" BOOLEAN DEFAULT true,
    model TEXT DEFAULT 'deepseek-chat',
    temperature FLOAT DEFAULT 0.3,
    "maxTokens" INTEGER DEFAULT 1000,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- 创建搜索配置表
CREATE TABLE IF NOT EXISTS user_search_config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT UNIQUE NOT NULL,
    "defaultLanguage" TEXT DEFAULT 'zh-CN',
    "safeSearch" BOOLEAN DEFAULT true,
    "defaultResultCount" INTEGER DEFAULT 10,
    engine TEXT DEFAULT 'google',
    region TEXT DEFAULT 'CN',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- 创建通知配置表
CREATE TABLE IF NOT EXISTS user_notification_config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT UNIQUE NOT NULL,
    "desktopNotifications" BOOLEAN DEFAULT true,
    "emailNotifications" BOOLEAN DEFAULT false,
    "dueReminder" BOOLEAN DEFAULT true,
    "reminderMinutes" INTEGER DEFAULT 30,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- 创建存储配置表
CREATE TABLE IF NOT EXISTS user_storage_config (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT UNIQUE NOT NULL,
    mode TEXT DEFAULT 'hybrid',
    "autoSync" BOOLEAN DEFAULT true,
    "syncInterval" INTEGER DEFAULT 5,
    "offlineMode" BOOLEAN DEFAULT true,
    "conflictResolution" TEXT DEFAULT 'merge',
    "retryAttempts" INTEGER DEFAULT 3,
    "requestTimeout" INTEGER DEFAULT 10000,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_basic_preferences_user_id ON user_basic_preferences("userId");
CREATE INDEX IF NOT EXISTS idx_user_ai_config_user_id ON user_ai_config("userId");
CREATE INDEX IF NOT EXISTS idx_user_search_config_user_id ON user_search_config("userId");
CREATE INDEX IF NOT EXISTS idx_user_notification_config_user_id ON user_notification_config("userId");
CREATE INDEX IF NOT EXISTS idx_user_storage_config_user_id ON user_storage_config("userId");

-- Todo 表性能索引
CREATE INDEX IF NOT EXISTS idx_todos_user_status_priority ON todos("userId", completed, priority);
CREATE INDEX IF NOT EXISTS idx_todos_user_title_status ON todos("userId", title, completed);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_todos_title_fulltext ON todos USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_todos_description_fulltext ON todos USING gin(to_tsvector('english', coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_documents_filename_fulltext ON documents USING gin(to_tsvector('english', filename));
CREATE INDEX IF NOT EXISTS idx_documents_content_fulltext ON documents USING gin(to_tsvector('english', content));
