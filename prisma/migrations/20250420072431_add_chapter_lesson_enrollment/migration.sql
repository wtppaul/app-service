/*
  Warnings:

  - You are about to drop the column `videoUrl` on the `Lesson` table. All the data in the column will be lost.
  - Added the required column `playbackId` to the `Lesson` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER');

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "videoUrl",
ADD COLUMN     "playbackId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "userRole" "Role" NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_authId_courseId_key" ON "Enrollment"("authId", "courseId");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
