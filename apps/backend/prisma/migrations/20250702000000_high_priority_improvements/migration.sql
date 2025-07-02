-- 高优先级数据库改进迁移
-- 1. 重构 User 表结构
-- 2. 新增 UserPreferences 表
-- 3. 添加关键索引优化
-- 4. 实现软删除机制

-- =============================================
-- 第一步：备份现有用户偏好数据
-- =============================================

-- 创建临时表存储现有的 JSON 配置数据
CREATE TEMP TABLE temp_user_configs AS
SELECT 
  id,
  theme,
  language,
  "aiConfig",
  "searchConfig",
  notifications,
  "storageConfig"
FROM users;

-- =============================================
-- 第二步：修改 User 表结构
-- =============================================

-- 添加新字段到 users 表
ALTER TABLE users ADD COLUMN "accountStatus" TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN "lastActiveAt" TIMESTAMP(3);
ALTER TABLE users ADD COLUMN "deletedAt" TIMESTAMP(3);

-- 移除旧的 JSON 字段
ALTER TABLE users DROP COLUMN theme;
ALTER TABLE users DROP COLUMN language;
ALTER TABLE users DROP COLUMN "aiConfig";
ALTER TABLE users DROP COLUMN "searchConfig";
ALTER TABLE users DROP COLUMN notifications;
ALTER TABLE users DROP COLUMN "storageConfig";

-- =============================================
-- 第三步：创建 UserPreferences 表
-- =============================================

CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'zh-CN',
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoAnalyze" BOOLEAN NOT NULL DEFAULT true,
    "priorityAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "timeEstimation" BOOLEAN NOT NULL DEFAULT true,
    "subtaskSplitting" BOOLEAN NOT NULL DEFAULT true,
    "aiModel" TEXT NOT NULL DEFAULT 'deepseek-chat',
    "aiTemperature" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "aiMaxTokens" INTEGER NOT NULL DEFAULT 1000,
    "searchLanguage" TEXT NOT NULL DEFAULT 'zh-CN',
    "safeSearch" BOOLEAN NOT NULL DEFAULT true,
    "defaultResultCount" INTEGER NOT NULL DEFAULT 10,
    "searchEngine" TEXT NOT NULL DEFAULT 'google',
    "searchRegion" TEXT NOT NULL DEFAULT 'CN',
    "desktopNotifications" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "dueReminder" BOOLEAN NOT NULL DEFAULT true,
    "reminderMinutes" INTEGER NOT NULL DEFAULT 30,
    "storageMode" TEXT NOT NULL DEFAULT 'hybrid',
    "autoSync" BOOLEAN NOT NULL DEFAULT true,
    "syncInterval" INTEGER NOT NULL DEFAULT 5,
    "offlineMode" BOOLEAN NOT NULL DEFAULT true,
    "conflictResolution" TEXT NOT NULL DEFAULT 'merge',
    "retryAttempts" INTEGER NOT NULL DEFAULT 3,
    "requestTimeout" INTEGER NOT NULL DEFAULT 10000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- 第四步：数据迁移
-- =============================================

-- 为每个用户创建默认的偏好设置记录
INSERT INTO "user_preferences" (
    "id", 
    "userId", 
    "theme", 
    "language",
    "createdAt",
    "updatedAt"
)
SELECT 
    gen_random_uuid(),
    id,
    COALESCE(theme, 'light'),
    COALESCE(language, 'zh-CN'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM temp_user_configs;

-- =============================================
-- 第五步：修改 Todo 表结构
-- =============================================

-- 添加软删除和版本控制字段到 todos 表
ALTER TABLE todos ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE todos ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- =============================================
-- 第六步：修改 UserSetting 表结构
-- =============================================

-- 添加软删除和版本控制字段到 user_settings 表
ALTER TABLE user_settings ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE user_settings ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- =============================================
-- 第七步：创建索引优化性能
-- =============================================

-- Users 表索引
CREATE INDEX "idx_users_last_active" ON "users"("lastActiveAt");
CREATE INDEX "idx_users_soft_delete" ON "users"("deletedAt");
CREATE INDEX "idx_users_account_status" ON "users"("accountStatus");

-- Todos 表索引
CREATE INDEX "idx_todos_user_status_due" ON "todos"("userId", "completed", "dueDate");
CREATE INDEX "idx_todos_user_created" ON "todos"("userId", "createdAt");
CREATE INDEX "idx_todos_priority" ON "todos"("priority");
CREATE INDEX "idx_todos_soft_delete" ON "todos"("deletedAt");

-- UserSettings 表索引
CREATE INDEX "idx_user_settings_soft_delete" ON "user_settings"("deletedAt");

-- =============================================
-- 第八步：创建外键约束
-- =============================================

-- UserPreferences 表外键
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================
-- 第九步：清理临时数据
-- =============================================

-- 删除临时表
DROP TABLE temp_user_configs;
