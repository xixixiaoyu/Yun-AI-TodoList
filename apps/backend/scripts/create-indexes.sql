-- 创建性能优化索引
-- 这些索引将显著提升查询性能

-- Todo 表索引优化
CREATE INDEX IF NOT EXISTS "idx_todos_user_status_priority" 
ON "todos"("userId", "completed", "priority");

CREATE INDEX IF NOT EXISTS "idx_todos_user_title_status" 
ON "todos"("userId", "title", "completed");

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS "idx_todos_title_fulltext" 
ON "todos" USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS "idx_todos_description_fulltext" 
ON "todos" USING gin(to_tsvector('english', coalesce(description, '')));

-- Document 表全文搜索索引
CREATE INDEX IF NOT EXISTS "idx_documents_filename_fulltext" 
ON "documents" USING gin(to_tsvector('english', filename));

CREATE INDEX IF NOT EXISTS "idx_documents_content_fulltext" 
ON "documents" USING gin(to_tsvector('english', content));

-- 验证索引创建
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%fulltext%'
ORDER BY tablename, indexname;
