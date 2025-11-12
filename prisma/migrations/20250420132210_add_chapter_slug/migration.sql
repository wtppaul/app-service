/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Chapter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Chapter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_slug_key" ON "Chapter"("slug");
