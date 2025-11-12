/*
  Warnings:

  - A unique constraint covering the columns `[authId,courseId]` on the table `CourseLove` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[authId,lovedUserId]` on the table `UserLove` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `authId` to the `CourseLove` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userRole` to the `CourseLove` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authId` to the `UserLove` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userRole` to the `UserLove` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CourseLove_teacherId_studentId_courseId_key";

-- DropIndex
DROP INDEX "UserLove_teacherId_studentId_lovedUserId_key";

-- AlterTable
ALTER TABLE "CourseLove" ADD COLUMN     "authId" TEXT NOT NULL,
ADD COLUMN     "userRole" "Role" NOT NULL;

-- AlterTable
ALTER TABLE "UserLove" ADD COLUMN     "authId" TEXT NOT NULL,
ADD COLUMN     "lovedStudentId" TEXT,
ADD COLUMN     "lovedTeacherId" TEXT,
ADD COLUMN     "userRole" "Role" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CourseLove_authId_courseId_key" ON "CourseLove"("authId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLove_authId_lovedUserId_key" ON "UserLove"("authId", "lovedUserId");

-- AddForeignKey
ALTER TABLE "UserLove" ADD CONSTRAINT "UserLove_lovedTeacherId_fkey" FOREIGN KEY ("lovedTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLove" ADD CONSTRAINT "UserLove_lovedStudentId_fkey" FOREIGN KEY ("lovedStudentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
