-- 数据库维护和监控脚本
-- 用于定期维护和性能监控

-- =============================================
-- 1. 性能监控查询
-- =============================================

-- 查看最慢的查询
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 查看索引使用情况
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 查看未使用的索引
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey';

-- 查看表大小
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =============================================
-- 2. 数据清理脚本
-- =============================================

-- 清理过期的邮箱验证码（7天前）
DELETE FROM email_verification_codes 
WHERE expires_at < NOW() - INTERVAL '7 days';

-- 清理过期的软删除记录（30天前）
DELETE FROM users 
WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';

DELETE FROM todos 
WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';

DELETE FROM documents 
WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';

-- =============================================
-- 3. 数据完整性检查
-- =============================================

-- 检查孤儿记录
SELECT 'user_preferences' as table_name, COUNT(*) as orphan_count
FROM user_preferences up
LEFT JOIN users u ON up.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'todos' as table_name, COUNT(*) as orphan_count
FROM todos t
LEFT JOIN users u ON t.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'documents' as table_name, COUNT(*) as orphan_count
FROM documents d
LEFT JOIN users u ON d.user_id = u.id
WHERE u.id IS NULL;

-- 检查数据一致性
SELECT 
  'users_without_preferences' as issue,
  COUNT(*) as count
FROM users u
LEFT JOIN user_preferences up ON u.id = up.user_id
WHERE up.id IS NULL AND u.deleted_at IS NULL;

-- =============================================
-- 4. 性能优化建议
-- =============================================

-- 更新表统计信息
ANALYZE users;
ANALYZE todos;
ANALYZE documents;
ANALYZE user_preferences;

-- 重建索引（如果需要）
-- REINDEX INDEX CONCURRENTLY idx_todos_user_status_due;

-- 清理死元组
-- VACUUM ANALYZE users;
-- VACUUM ANALYZE todos;
-- VACUUM ANALYZE documents;
