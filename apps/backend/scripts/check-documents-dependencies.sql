-- 检查 documents 表的依赖关系和影响

-- 1. 检查 documents 表是否存在
SELECT 
  'Table Existence Check' as check_type,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'documents';

-- 2. 检查外键约束 - documents 表作为被引用表
SELECT 
  'Foreign Keys TO documents' as check_type,
  tc.table_name as referencing_table,
  kcu.column_name as referencing_column,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'documents'
  AND tc.table_schema = 'public';

-- 3. 检查外键约束 - documents 表作为引用表
SELECT 
  'Foreign Keys FROM documents' as check_type,
  tc.table_name as referencing_table,
  kcu.column_name as referencing_column,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'documents'
  AND tc.table_schema = 'public';

-- 4. 检查 todos 表中的 documentId 字段
SELECT 
  'todos.documentId Analysis' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'todos' 
  AND column_name = 'documentId';

-- 5. 检查 documents 表的索引
SELECT 
  'documents Table Indexes' as check_type,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'documents';

-- 6. 检查 documents 表的数据量
SELECT 
  'documents Data Count' as check_type,
  COUNT(*) as total_records
FROM documents;

-- 7. 检查 todos 表中引用 documents 的记录
SELECT 
  'todos referencing documents' as check_type,
  COUNT(*) as total_todos_with_documents,
  COUNT(CASE WHEN "documentId" IS NOT NULL THEN 1 END) as todos_with_document_id
FROM todos;
