-- 简化的 documents 表依赖检查

-- 检查 documents 表是否存在
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'documents';

-- 检查外键约束
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND (tc.table_name = 'documents' OR tc.constraint_name LIKE '%document%')
  AND tc.constraint_type = 'FOREIGN KEY';
