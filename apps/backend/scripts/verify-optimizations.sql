-- 验证数据库优化结果的脚本

-- 检查剩余的表
SELECT 
    'Tables after optimization:' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 检查新创建的索引
SELECT 
    'New indexes created:' as info,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 检查表的大小
SELECT 
    'Table sizes:' as info,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 验证新表是否存在
SELECT 
    'New configuration tables:' as info,
    table_name,
    CASE 
        WHEN table_name = 'user_basic_preferences' THEN 'Basic user preferences (theme, language)'
        WHEN table_name = 'user_ai_config' THEN 'AI configuration settings'
        WHEN table_name = 'user_search_config' THEN 'Search engine configuration'
        WHEN table_name = 'user_notification_config' THEN 'Notification settings'
        WHEN table_name = 'user_storage_config' THEN 'Storage and sync configuration'
        ELSE 'Other table'
    END as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'user_basic_preferences',
        'user_ai_config', 
        'user_search_config',
        'user_notification_config',
        'user_storage_config'
    )
ORDER BY table_name;

-- 验证删除的表不存在
SELECT 
    'Removed tables verification:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') 
        THEN 'ERROR: user_settings table still exists!'
        ELSE 'SUCCESS: user_settings table removed'
    END as user_settings_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_chunks') 
        THEN 'ERROR: document_chunks table still exists!'
        ELSE 'SUCCESS: document_chunks table removed'
    END as document_chunks_status;
