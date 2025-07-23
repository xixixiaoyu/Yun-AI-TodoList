-- 验证 documents 表删除结果

-- 检查 documents 表是否已删除
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public')
    THEN 'ERROR: documents table still exists!'
    ELSE 'SUCCESS: documents table deleted'
  END as documents_table_status;

-- 检查当前剩余的表
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
