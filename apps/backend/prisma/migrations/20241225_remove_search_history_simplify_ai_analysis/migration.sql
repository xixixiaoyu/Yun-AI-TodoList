-- Drop search_history table
DROP TABLE IF EXISTS "search_history";

-- Drop existing ai_analyses table if it exists
DROP TABLE IF EXISTS "ai_analyses";

-- Create simplified ai_analyses table with todoId as primary key
CREATE TABLE "ai_analyses" (
    "todoId" TEXT NOT NULL,
    "priority" INTEGER,
    "estimatedTime" TEXT,
    "reasoning" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("todoId")
);

-- Create index on userId for performance
CREATE INDEX "ai_analyses_userId_idx" ON "ai_analyses"("userId");

-- Add foreign key constraints
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "todos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
