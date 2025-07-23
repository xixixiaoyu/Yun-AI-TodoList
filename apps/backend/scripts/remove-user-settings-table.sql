-- 删除 user_settings 表的迁移脚本
-- 优先级：高
-- 原因：与 user_preferences 表功能重复，造成数据冗余

-- =============================================
-- 第一步：数据备份和迁移准备
-- =============================================

-- 检查 user_settings 表中的数据
SELECT 
    'user_settings_data_check' as check_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT key) as unique_keys
FROM user_settings 
WHERE deleted_at IS NULL;

-- 查看所有使用的配置键
SELECT 
    key,
    COUNT(*) as usage_count,
    COUNT(DISTINCT user_id) as user_count
FROM user_settings 
WHERE deleted_at IS NULL
GROUP BY key
ORDER BY usage_count DESC;

-- =============================================
-- 第二步：数据迁移（如果需要）
-- =============================================

-- 将 user_settings 中的重要配置迁移到 user_preferences
-- 注意：只迁移不在 user_preferences 中存在的配置

DO $$
DECLARE
    setting_record RECORD;
    pref_record RECORD;
BEGIN
    -- 遍历所有 user_settings 记录
    FOR setting_record IN 
        SELECT DISTINCT user_id, key, value 
        FROM user_settings 
        WHERE deleted_at IS NULL
    LOOP
        -- 检查用户是否有 preferences 记录
        SELECT * INTO pref_record 
        FROM user_preferences 
        WHERE user_id = setting_record.user_id;
        
        IF NOT FOUND THEN
            -- 如果用户没有 preferences 记录，创建默认记录
            INSERT INTO user_preferences (
                id, user_id, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                setting_record.user_id,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END IF;
        
        -- 根据 key 映射到 user_preferences 的相应字段
        CASE setting_record.key
            WHEN 'theme' THEN
                UPDATE user_preferences 
                SET theme = setting_record.value, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = setting_record.user_id;
            
            WHEN 'language' THEN
                UPDATE user_preferences 
                SET language = setting_record.value, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = setting_record.user_id;
            
            WHEN 'notifications_enabled' THEN
                UPDATE user_preferences 
                SET desktop_notifications = (setting_record.value = 'true'), updated_at = CURRENT_TIMESTAMP
                WHERE user_id = setting_record.user_id;
            
            WHEN 'auto_sync' THEN
                UPDATE user_preferences 
                SET auto_sync = (setting_record.value = 'true'), updated_at = CURRENT_TIMESTAMP
                WHERE user_id = setting_record.user_id;
            
            ELSE
                -- 对于无法映射的配置，记录日志
                RAISE NOTICE 'Unmapped setting: user_id=%, key=%, value=%', 
                    setting_record.user_id, setting_record.key, setting_record.value;
        END CASE;
    END LOOP;
    
    RAISE NOTICE 'Data migration completed';
END $$;

-- =============================================
-- 第三步：验证数据迁移
-- =============================================

-- 检查迁移后的数据完整性
SELECT 
    'migration_verification' as check_type,
    COUNT(*) as users_with_preferences
FROM user_preferences;

-- 对比迁移前后的用户数量
SELECT 
    'user_count_comparison' as check_type,
    (SELECT COUNT(DISTINCT user_id) FROM user_settings WHERE deleted_at IS NULL) as users_in_settings,
    (SELECT COUNT(*) FROM user_preferences) as users_in_preferences;

-- =============================================
-- 第四步：删除外键约束和索引
-- =============================================

-- 删除相关的外键约束
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_userId_fkey;

-- 删除相关的索引
DROP INDEX IF EXISTS idx_user_settings_soft_delete;

-- =============================================
-- 第五步：删除表
-- =============================================

-- 删除 user_settings 表
DROP TABLE IF EXISTS user_settings CASCADE;

-- =============================================
-- 第六步：清理 User 模型中的关系
-- =============================================

-- 注意：需要手动更新 Prisma schema 文件
-- 删除 User 模型中的 settings UserSetting[] 关系

-- =============================================
-- 第七步：验证删除结果
-- =============================================

-- 验证表已被删除
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'user_settings';

-- 如果查询返回空结果，说明表已成功删除

-- 查看剩余的表
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

RAISE NOTICE 'user_settings table removal completed successfully';
