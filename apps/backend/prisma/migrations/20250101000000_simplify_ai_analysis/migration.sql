-- 简化 AI 分析数据模型
-- 移除 ai_analyses 表，将 AI 分析结果直接存储在 todos 表中

-- 1. 添加 aiReasoning 字段到 todos 表
ALTER TABLE "todos" ADD COLUMN "aiReasoning" TEXT;

-- 2. 如果 ai_analyses 表有数据，先迁移到 todos 表
UPDATE "todos" 
SET "aiReasoning" = (
  SELECT "reasoning" 
  FROM "ai_analyses" 
  WHERE "ai_analyses"."todoId" = "todos"."id"
)
WHERE EXISTS (
  SELECT 1 
  FROM "ai_analyses" 
  WHERE "ai_analyses"."todoId" = "todos"."id"
);

-- 3. 删除 ai_analyses 表的外键约束
ALTER TABLE "ai_analyses" DROP CONSTRAINT IF EXISTS "ai_analyses_todoId_fkey";
ALTER TABLE "ai_analyses" DROP CONSTRAINT IF EXISTS "ai_analyses_userId_fkey";

-- 4. 删除 ai_analyses 表的索引
DROP INDEX IF EXISTS "ai_analyses_userId_idx";

-- 5. 删除 ai_analyses 表
DROP TABLE IF EXISTS "ai_analyses";
