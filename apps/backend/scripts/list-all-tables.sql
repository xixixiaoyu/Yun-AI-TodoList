-- 查询当前数据库中的所有表

-- 1. 列出所有表及其基本信息
SELECT 
  'Current Database Tables' as info,
  table_name,
  table_type,
  CASE 
    WHEN table_name LIKE 'user_%_config' OR table_name = 'user_basic_preferences' THEN 'USER_CONFIG'
    WHEN table_name = 'user_preferences' THEN 'LEGACY_CONFIG'
    WHEN table_name IN ('todos', 'documents', 'users') THEN 'CORE_TABLE'
    WHEN table_name LIKE '%verification%' THEN 'AUTH_TABLE'
    ELSE 'OTHER'
  END as table_category
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. 统计每个表的记录数（如果表存在数据）
SELECT 
  'Table Row Counts' as info,
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 3. 表的大小信息
SELECT 
  'Table Sizes' as info,
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
