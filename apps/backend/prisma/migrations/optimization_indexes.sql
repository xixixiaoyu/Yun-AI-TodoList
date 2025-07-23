-- 数据库索引优化迁移脚本
-- 优先级：高
-- 影响范围：中等
-- 实施难度：低

-- =============================================
-- Todo 表索引优化
-- =============================================

-- 添加复合索引优化常见查询
CREATE INDEX IF NOT EXISTS "idx_todos_user_status_priority"
ON "todos"("userId", "completed", "priority");

CREATE INDEX IF NOT EXISTS "idx_todos_user_title_status"
ON "todos"("userId", "title", "completed");

-- =============================================
-- 全文搜索索引
-- =============================================

-- 为 Todo 表添加全文搜索索引
CREATE INDEX IF NOT EXISTS "idx_todos_title_fulltext"
ON "todos" USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS "idx_todos_description_fulltext"
ON "todos" USING gin(to_tsvector('english', coalesce(description, '')));

-- 为 Document 表添加全文搜索索引
CREATE INDEX IF NOT EXISTS "idx_documents_filename_fulltext"
ON "documents" USING gin(to_tsvector('english', filename));

CREATE INDEX IF NOT EXISTS "idx_documents_content_fulltext"
ON "documents" USING gin(to_tsvector('english', content));

-- =============================================
-- 性能监控查询
-- =============================================

-- 查看索引使用情况
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;
