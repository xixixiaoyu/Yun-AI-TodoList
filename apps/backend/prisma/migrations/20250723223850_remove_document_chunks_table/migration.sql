-- 删除 document_chunks 表的迁移脚本
-- 优先级：高
-- 原因：表被定义但从未真正使用，是"僵尸表"

-- =============================================
-- 第一步：数据检查
-- =============================================

-- 检查 document_chunks 表中的数据
SELECT 
    'document_chunks_data_check' as check_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT document_id) as unique_documents
FROM document_chunks;

-- 如果有数据，显示一些样本
SELECT 
    'sample_data' as check_type,
    document_id,
    chunk_index,
    LENGTH(content) as content_length,
    created_at
FROM document_chunks 
ORDER BY created_at DESC 
LIMIT 5;

-- =============================================
-- 第二步：验证表的使用情况
-- =============================================

-- 检查是否有文档关联了分块
SELECT 
    'documents_with_chunks' as check_type,
    d.id,
    d.filename,
    COUNT(dc.id) as chunk_count
FROM documents d
LEFT JOIN document_chunks dc ON d.id = dc.document_id
WHERE dc.id IS NOT NULL
GROUP BY d.id, d.filename
ORDER BY chunk_count DESC
LIMIT 10;

-- =============================================
-- 第三步：删除外键约束和索引
-- =============================================

-- 删除相关的外键约束
ALTER TABLE document_chunks DROP CONSTRAINT IF EXISTS document_chunks_documentId_fkey;

-- 删除相关的索引
DROP INDEX IF EXISTS idx_document_chunks_document;

-- =============================================
-- 第四步：删除表
-- =============================================

-- 删除 document_chunks 表
DROP TABLE IF EXISTS document_chunks CASCADE;

-- =============================================
-- 第五步：验证删除结果
-- =============================================

-- 验证表已被删除
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'document_chunks';

-- 如果查询返回空结果，说明表已成功删除

-- 查看剩余的表
SELECT 
    'remaining_tables' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =============================================
-- 第六步：性能提升验证
-- =============================================

-- 检查 documents 表的大小（删除 chunks 关系后应该更简洁）
SELECT 
    'documents_table_info' as info,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'documents';

RAISE NOTICE 'document_chunks table removal completed successfully';
RAISE NOTICE 'Benefits: Reduced database complexity, eliminated unused table, improved query performance';
RAISE NOTICE 'Next step: Update Prisma schema to remove DocumentChunk model and chunks relation';
