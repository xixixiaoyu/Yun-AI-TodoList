/*
  Warnings:

  - You are about to drop the column `defaultResultCount` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `safeSearch` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `searchEngine` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `searchLanguage` on the `user_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `searchRegion` on the `user_preferences` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_preferences" DROP COLUMN "defaultResultCount",
DROP COLUMN "safeSearch",
DROP COLUMN "searchEngine",
DROP COLUMN "searchLanguage",
DROP COLUMN "searchRegion";
