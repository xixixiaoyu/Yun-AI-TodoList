-- 简化版性能测试脚本（兼容 Prisma db execute）

-- 检查索引使用统计
SELECT
  'Index Usage Statistics' as test_name,
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  CASE
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 100 THEN 'LOW_USAGE'
    ELSE 'ACTIVE'
  END as usage_level
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexrelname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- 检查表大小统计
SELECT
  'Table Size Statistics' as test_name,
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 检查缓存命中率
SELECT
  'Cache Hit Ratio' as test_name,
  'Buffer Cache' as cache_type,
  ROUND(
    (sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) * 100, 2
  ) as hit_ratio_percent
FROM pg_statio_user_tables
WHERE schemaname = 'public';

-- 验证新表结构
SELECT
  'New Table Structure' as test_name,
  table_name,
  CASE
    WHEN table_name LIKE 'user_%_config' OR table_name = 'user_basic_preferences' THEN 'NEW_CONFIG_TABLE'
    WHEN table_name IN ('todos', 'documents', 'users') THEN 'CORE_TABLE'
    ELSE 'OTHER_TABLE'
  END as table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE_TABLE'
ORDER BY table_name;

-- 检查约束条件
SELECT
  'Constraints Check' as test_name,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('CHECK', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_type;
