-- 安全删除 documents 表的脚本
-- 包含数据备份和完整的清理步骤

-- =============================================
-- 第一步：数据备份（可选，在生产环境中建议执行）
-- =============================================

-- 创建备份表（如果需要）
-- CREATE TABLE documents_backup AS SELECT * FROM documents;

-- =============================================
-- 第二步：清理外键约束和关联数据
-- =============================================

-- 清理 todos 表中的 documentId 引用
UPDATE todos 
SET "documentId" = NULL 
WHERE "documentId" IS NOT NULL;

-- 删除 todos 表上的 documentId 外键约束
ALTER TABLE todos DROP CONSTRAINT IF EXISTS todos_documentId_fkey;

-- 删除 todos 表上的 document 索引
DROP INDEX IF EXISTS idx_todos_document;

-- =============================================
-- 第三步：删除 documents 表的索引
-- =============================================

-- 删除 documents 表上的所有索引
DROP INDEX IF EXISTS idx_documents_user_created;
DROP INDEX IF EXISTS idx_documents_file_type;
DROP INDEX IF EXISTS idx_documents_processed;
DROP INDEX IF EXISTS idx_documents_soft_delete;

-- 删除全文搜索索引（如果存在）
DROP INDEX IF EXISTS idx_documents_filename_fulltext;
DROP INDEX IF EXISTS idx_documents_content_fulltext;

-- =============================================
-- 第四步：删除 documents 表
-- =============================================

-- 删除 documents 表（CASCADE 会自动删除相关约束）
DROP TABLE IF EXISTS documents CASCADE;

-- =============================================
-- 第五步：验证删除结果
-- =============================================

-- 验证 documents 表已被删除
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public')
    THEN 'ERROR: documents table still exists!'
    ELSE 'SUCCESS: documents table deleted'
  END as deletion_status;

-- 验证 todos 表中的 documentId 字段状态
SELECT 
  'todos.documentId cleanup' as check_type,
  COUNT(*) as total_todos,
  COUNT("documentId") as todos_with_document_id
FROM todos;

-- 显示剩余的表
SELECT 
  'Remaining tables' as info,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
