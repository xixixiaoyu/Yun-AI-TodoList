/*
  Warnings:

  - You are about to drop the column `aiReasoning` on the `todos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "todos" DROP COLUMN "aiReasoning",
ADD COLUMN     "estimatedMinutes" INTEGER,
ALTER COLUMN "estimatedTime" SET DATA TYPE TEXT;
