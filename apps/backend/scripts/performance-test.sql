-- 数据库性能测试脚本
-- 用于验证优化后的性能提升

-- =============================================
-- 性能测试准备
-- =============================================

-- 启用查询执行时间统计
\timing on

-- 显示查询计划
SET enable_seqscan = off; -- 强制使用索引（测试用）

-- =============================================
-- 1. 索引使用情况测试
-- =============================================

EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM todos 
WHERE "userId" = 'test-user-id' 
  AND completed = false 
  AND priority >= 3
ORDER BY "createdAt" DESC
LIMIT 20;

-- =============================================
-- 2. 全文搜索性能测试
-- =============================================

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM todos 
WHERE to_tsvector('english', title) @@ to_tsquery('english', 'project & task')
LIMIT 10;

-- =============================================
-- 3. 复杂查询性能测试
-- =============================================

EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  t.*,
  CASE 
    WHEN t."dueDate" < NOW() AND t.completed = false THEN 'overdue'
    WHEN t."dueDate" < NOW() + INTERVAL '1 day' AND t.completed = false THEN 'due_soon'
    ELSE 'normal'
  END as status
FROM todos t
WHERE t."userId" = 'test-user-id'
  AND t."deletedAt" IS NULL
ORDER BY 
  CASE WHEN t.completed = false THEN 0 ELSE 1 END,
  t.priority DESC NULLS LAST,
  t."createdAt" DESC
LIMIT 50;

-- =============================================
-- 4. 统计查询性能测试
-- =============================================

EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN completed = true THEN 1 END) as completed,
  COUNT(CASE WHEN completed = false THEN 1 END) as pending,
  COUNT(CASE WHEN "dueDate" < NOW() AND completed = false THEN 1 END) as overdue,
  AVG(CASE WHEN completed = true AND "estimatedTime" IS NOT NULL THEN "estimatedTime" END) as avg_completion_time
FROM todos 
WHERE "userId" = 'test-user-id' 
  AND "deletedAt" IS NULL;

-- =============================================
-- 5. 文档搜索性能测试
-- =============================================

EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  filename,
  content,
  ts_rank(to_tsvector('english', content), to_tsquery('english', 'database & optimization')) as rank
FROM documents 
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'database & optimization')
ORDER BY rank DESC
LIMIT 10;

-- =============================================
-- 6. 用户配置表查询性能测试
-- =============================================

-- 测试新的分离表结构
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  bp.theme,
  bp.language,
  ac.enabled as ai_enabled,
  ac.model as ai_model,
  sc.engine as search_engine,
  nc."desktopNotifications",
  stc.mode as storage_mode
FROM user_basic_preferences bp
LEFT JOIN user_ai_config ac ON bp."userId" = ac."userId"
LEFT JOIN user_search_config sc ON bp."userId" = sc."userId"
LEFT JOIN user_notification_config nc ON bp."userId" = nc."userId"
LEFT JOIN user_storage_config stc ON bp."userId" = stc."userId"
WHERE bp."userId" = 'test-user-id';

-- =============================================
-- 7. 索引使用统计
-- =============================================

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  CASE 
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 100 THEN 'LOW_USAGE'
    WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
    ELSE 'HIGH_USAGE'
  END as usage_level
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- =============================================
-- 8. 表大小和性能统计
-- =============================================

SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
  ROUND(
    (pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename))::numeric / 
    NULLIF(pg_relation_size(schemaname||'.'||tablename), 0) * 100, 2
  ) as index_ratio_percent
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =============================================
-- 9. 缓存命中率统计
-- =============================================

SELECT 
  'Buffer Cache Hit Ratio' as metric,
  ROUND(
    (sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0)) * 100, 2
  ) as percentage
FROM pg_statio_user_tables
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Index Cache Hit Ratio' as metric,
  ROUND(
    (sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0)) * 100, 2
  ) as percentage
FROM pg_statio_user_indexes
WHERE schemaname = 'public';

-- =============================================
-- 10. 慢查询模拟（压力测试）
-- =============================================

-- 创建测试数据（如果需要）
-- INSERT INTO todos ("userId", title, description, completed, priority, "createdAt", "updatedAt")
-- SELECT 
--   'test-user-' || (random() * 100)::int,
--   'Test Todo ' || generate_series,
--   'Description for todo ' || generate_series,
--   random() > 0.7,
--   (random() * 5)::int + 1,
--   NOW() - (random() * interval '365 days'),
--   NOW()
-- FROM generate_series(1, 10000);

-- 重置设置
SET enable_seqscan = on;
\timing off

-- 显示优化建议
SELECT 'Performance Test Completed!' as status;
SELECT 'Check the EXPLAIN ANALYZE results above for performance insights' as note;
SELECT 'Look for:' as tips;
SELECT '- Index Scan vs Seq Scan usage' as tip1;
SELECT '- Execution time improvements' as tip2;
SELECT '- Buffer hit ratios > 95%' as tip3;
SELECT '- Index usage statistics' as tip4;
