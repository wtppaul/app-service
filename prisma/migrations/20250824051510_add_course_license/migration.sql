-- CreateEnum
CREATE TYPE "CourseLicense" AS ENUM ('EE', 'ET', 'NT');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "license" "CourseLicense" NOT NULL DEFAULT 'NT';
