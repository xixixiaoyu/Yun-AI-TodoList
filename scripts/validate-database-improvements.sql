-- 数据库改进验证脚本
-- 用于验证高优先级改进是否正确实施

-- =============================================
-- 1. 验证表结构
-- =============================================

-- 检查 users 表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查 user_preferences 表是否存在
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_preferences' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查 todos 表新增字段
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'todos' 
    AND table_schema = 'public'
    AND column_name IN ('deletedAt', 'version')
ORDER BY ordinal_position;

-- =============================================
-- 2. 验证索引创建
-- =============================================

-- 检查所有新创建的索引
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =============================================
-- 3. 验证外键约束
-- =============================================

-- 检查外键约束
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =============================================
-- 4. 验证数据完整性
-- =============================================

-- 检查用户数据迁移
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN "deletedAt" IS NULL THEN 1 END) as active_users,
    COUNT(CASE WHEN "deletedAt" IS NOT NULL THEN 1 END) as deleted_users
FROM users;

-- 检查用户偏好数据
SELECT 
    COUNT(*) as total_preferences,
    COUNT(DISTINCT "userId") as users_with_preferences
FROM user_preferences;

-- 验证用户和偏好的关联
SELECT 
    u.id,
    u.email,
    u."accountStatus",
    CASE WHEN up.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_preferences
FROM users u
LEFT JOIN user_preferences up ON u.id = up."userId"
WHERE u."deletedAt" IS NULL
LIMIT 5;

-- 检查待办事项数据
SELECT 
    COUNT(*) as total_todos,
    COUNT(CASE WHEN "deletedAt" IS NULL THEN 1 END) as active_todos,
    COUNT(CASE WHEN "deletedAt" IS NOT NULL THEN 1 END) as deleted_todos,
    AVG(version) as avg_version
FROM todos;

-- =============================================
-- 5. 性能验证
-- =============================================

-- 检查索引使用情况（需要有一些查询后才有数据）
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- 检查表统计信息
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================
-- 6. 验证查询性能
-- =============================================

-- 测试用户查询性能（带软删除过滤）
EXPLAIN ANALYZE 
SELECT u.*, up.theme, up.language 
FROM users u
LEFT JOIN user_preferences up ON u.id = up."userId"
WHERE u."deletedAt" IS NULL
    AND u."accountStatus" = 'active'
LIMIT 10;

-- 测试待办事项查询性能
EXPLAIN ANALYZE
SELECT * FROM todos 
WHERE "userId" = (SELECT id FROM users WHERE "deletedAt" IS NULL LIMIT 1)
    AND "deletedAt" IS NULL
    AND completed = false
ORDER BY "createdAt" DESC
LIMIT 20;

-- =============================================
-- 7. 数据一致性检查
-- =============================================

-- 检查孤立的用户偏好记录
SELECT COUNT(*) as orphaned_preferences
FROM user_preferences up
LEFT JOIN users u ON up."userId" = u.id
WHERE u.id IS NULL;

-- 检查没有偏好设置的活跃用户
SELECT COUNT(*) as users_without_preferences
FROM users u
LEFT JOIN user_preferences up ON u.id = up."userId"
WHERE u."deletedAt" IS NULL 
    AND up.id IS NULL;

-- 验证版本控制字段
SELECT 
    MIN(version) as min_version,
    MAX(version) as max_version,
    AVG(version) as avg_version
FROM todos
WHERE "deletedAt" IS NULL;

-- =============================================
-- 8. 总结报告
-- =============================================

SELECT 
    'Database Improvements Validation Summary' as report_title,
    NOW() as validation_time;

SELECT 
    'Tables' as category,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'Indexes' as category,
    COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Foreign Keys' as category,
    COUNT(*) as count
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public';
