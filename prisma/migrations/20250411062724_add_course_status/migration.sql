/*
  Warnings:

  - You are about to drop the column `isPublished` on the `Course` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('PENDING_REVIEW', 'FOLLOWED_UP', 'APPROVED', 'RELEASED', 'REJECTED');

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "isPublished",
ADD COLUMN     "status" "CourseStatus" NOT NULL DEFAULT 'PENDING_REVIEW';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "username" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN "username" TEXT;
UPDATE "Teacher" SET "username" = 'placeholder_username';
ALTER TABLE "Teacher" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Student_username_key" ON "Student"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_username_key" ON "Teacher"("username");
