/*
  Warnings:

  - The values [RELEASED] on the enum `CourseStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CourseStatus_new" AS ENUM ('DRAFT', 'INCOMPLETE', 'PENDING_REVIEW', 'FOLLOWED_UP', 'APPROVED', 'PUBLISHED', 'REJECTED', 'UNPUBLISHED', 'ARCHIVED');
ALTER TABLE "Course" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Course" ALTER COLUMN "status" TYPE "CourseStatus_new" USING ("status"::text::"CourseStatus_new");
ALTER TYPE "CourseStatus" RENAME TO "CourseStatus_old";
ALTER TYPE "CourseStatus_new" RENAME TO "CourseStatus";
DROP TYPE "CourseStatus_old";
ALTER TABLE "Course" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;
