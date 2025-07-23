-- 查询当前数据库中的所有表（简化版）

-- 列出所有表及其分类
SELECT 
  table_name,
  table_type,
  CASE 
    WHEN table_name LIKE 'user_%_config' OR table_name = 'user_basic_preferences' THEN 'NEW_USER_CONFIG'
    WHEN table_name = 'user_preferences' THEN 'LEGACY_CONFIG'
    WHEN table_name IN ('todos', 'documents', 'users') THEN 'CORE_TABLE'
    WHEN table_name LIKE '%verification%' THEN 'AUTH_TABLE'
    ELSE 'OTHER'
  END as table_category,
  CASE 
    WHEN table_name = 'users' THEN '用户基本信息表'
    WHEN table_name = 'todos' THEN '待办事项表'
    WHEN table_name = 'documents' THEN '文档表'
    WHEN table_name = 'user_preferences' THEN '用户偏好表（原始）'
    WHEN table_name = 'user_basic_preferences' THEN '用户基本偏好表（新）'
    WHEN table_name = 'user_ai_config' THEN 'AI配置表（新）'
    WHEN table_name = 'user_search_config' THEN '搜索配置表（新）'
    WHEN table_name = 'user_notification_config' THEN '通知配置表（新）'
    WHEN table_name = 'user_storage_config' THEN '存储配置表（新）'
    WHEN table_name LIKE '%verification%' THEN '邮箱验证表'
    ELSE '其他表'
  END as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY 
  CASE table_category
    WHEN 'CORE_TABLE' THEN 1
    WHEN 'NEW_USER_CONFIG' THEN 2
    WHEN 'LEGACY_CONFIG' THEN 3
    WHEN 'AUTH_TABLE' THEN 4
    ELSE 5
  END,
  table_name;
