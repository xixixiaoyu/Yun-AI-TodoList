-- 简化的 documents 表删除脚本

-- 清理 todos 表中的 documentId 引用
UPDATE todos SET "documentId" = NULL WHERE "documentId" IS NOT NULL;

-- 删除 documents 表
DROP TABLE IF EXISTS documents CASCADE;
